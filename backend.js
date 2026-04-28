import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const MACRO_API_BASE = 'https://macroregime.hub.zerve.cloud';

if (!PERPLEXITY_API_KEY) {
  console.warn('⚠️  Warning: PERPLEXITY_API_KEY not set in environment variables');
}

/**
 * @typedef {Object} Message
 * @property {'user' | 'assistant'} role
 * @property {string} content
 */

/**
 * Fetch current regime data
 */
async function fetchCurrentRegime() {
  try {
    const res = await fetch(`${MACRO_API_BASE}/regime/current`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Error fetching current regime:', e);
  }
  return null;
}

/**
 * Fetch historical analogues for comparison
 */
async function fetchAnalogues() {
  try {
    const res = await fetch(`${MACRO_API_BASE}/regime/analogues`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Error fetching analogues:', e);
  }
  return null;
}

/**
 * Fetch regime history
 */
async function fetchHistory() {
  try {
    const res = await fetch(`${MACRO_API_BASE}/regime/history?n=50`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Error fetching history:', e);
  }
  return null;
}

/**
 * Format asset label for display
 */
function formatAssetLabel(key) {
  const labels = {
    'eq_us': 'US Equities',
    'bond_long': 'Long Duration Bonds',
    'credit_ig': 'Investment Grade Credit',
    'commodities': 'Commodities',
    'gold': 'Gold',
    'cash': 'Cash',
  };
  return labels[key] || key;
}

function uniqueAssetsByLabel(items, direction = 'desc', limit = 2) {
  const map = new Map();
  for (const item of items) {
    if (!item?.label) continue;
    const existing = map.get(item.label);
    if (!existing) {
      map.set(item.label, item);
      continue;
    }
    if (direction === 'desc' ? item.value > existing.value : item.value < existing.value) {
      map.set(item.label, item);
    }
  }
  return [...map.values()]
    .sort((a, b) => (direction === 'desc' ? b.value - a.value : a.value - b.value))
    .slice(0, limit);
}

function extractCurrentRegime(payload) {
  if (payload?.data?.regime) {
    return typeof payload.data.regime === 'string' ? payload.data.regime : payload.data.regime.regime ?? 'Data unavailable';
  }

  if (payload?.regime) {
    return typeof payload.regime === 'string' ? payload.regime : payload.regime.regime ?? 'Data unavailable';
  }

  return 'Data unavailable';
}

function extractTopAssets(payload) {
  return payload?.data?.top_assets ?? payload?.top_assets ?? payload?.asset_outlook?.assets ?? [];
}

function extractAnalogues(payload) {
  const analogues = payload?.data?.analogues ?? payload?.analogues ?? [];
  return Array.isArray(analogues) ? analogues : analogues.analogues ?? [];
}

function extractHistoryEntries(payload) {
  return payload?.data ?? payload?.history ?? payload ?? [];
}

/**
 * Build rich context for Perplexity from market data
 */
function buildMarketContext(currentRegime, analogues, history) {
  let context = '';

  if (currentRegime) {
    const regime = String(currentRegime?.regime?.regime ?? currentRegime?.data?.regime?.regime ?? currentRegime?.regime ?? 'Data unavailable');
    const topAssets = currentRegime?.asset_outlook?.assets ?? currentRegime?.data?.asset_outlook?.assets ?? currentRegime?.top_assets ?? [];
    
    context += `\n## Current Market Regime\n`;
    context += `**Regime**: ${regime}\n`;
    
    if (topAssets.length > 0) {
      context += `**Top Performing Assets**:\n`;
      topAssets.slice(0, 3).forEach((asset) => {
        const label = formatAssetLabel(asset.asset);
        const returns = ((asset.annualized_return || 0) * 100).toFixed(1);
        context += `- ${label}: ${returns}% annualized return\n`;
      });
    }
  }

  const analogueList = analogues?.analogues ?? analogues?.data?.analogues ?? analogues?.analogues?.analogues ?? [];
  if (analogueList.length > 0) {
    // Pick the top 2 closest analogues to reference in the prompt
    const matches = analogueList.slice(0, 2);
    if (matches.length > 0) {
      context += `\n## Historical Analogues (Top 2 similar regimes)\n`;
      matches.forEach((match, idx) => {
        const regime = match.regime || 'Unknown';
        const date = match.analogue_date ? match.analogue_date.split('T')[0] : 'Unknown';
        context += `**Analogue ${idx + 1}**: ${regime} (${date})\n`;

        if (match.forward_returns) {
          context += `Forward Returns (by asset):\n`;
          Object.entries(match.forward_returns).forEach(([asset, ret]) => {
            const label = formatAssetLabel(asset.replace('_12m', ''));
            const pct = (ret * 100).toFixed(1);
            context += `- ${label}: ${pct}%\n`;
          });
        }
      });
    }
  }

  const historyEntries = Array.isArray(history?.data) ? history.data : Array.isArray(history) ? history : history?.history ?? [];
  if (Array.isArray(historyEntries) && historyEntries.length > 0) {
    context += `\n## Regime History Summary\n`;
    const sample = historyEntries.slice(0, 5).map((h) => `${String(h.date || '').split('T')[0]}: ${h.regime}`).join('; ');
    context += `Recent entries: ${sample}\n`;
  }

  return context;
}

function buildGroundedAnswer(question, currentRegimeData, analoguesData, historyData) {
  const regimeName = String(currentRegimeData?.regime?.regime ?? currentRegimeData?.data?.regime?.regime ?? currentRegimeData?.regime ?? 'Data unavailable');
  const topAssets = (currentRegimeData?.asset_outlook?.assets ?? currentRegimeData?.data?.asset_outlook?.assets ?? currentRegimeData?.top_assets ?? [])
    .slice(0, 3)
    .map((asset) => ({
      label: formatAssetLabel(asset.asset || asset.name || ''),
      value: Number(asset.annualized_return ?? asset.return ?? 0),
    }))
    .sort((a, b) => b.value - a.value);

  const analogueList = (analoguesData?.analogues ?? analoguesData?.data?.analogues ?? analoguesData?.analogues?.analogues ?? []).slice(0, 2);
  const analogueText = analogueList.length
    ? analogueList
        .map((analogue) => `${analogue.regime || 'Unknown'} (${String(analogue.analogue_date || '').split('T')[0] || 'Unknown'})`)
        .join(', ')
    : 'Data unavailable';

  const bestAssetsRaw = analogueList
    .flatMap((analogue) => Object.entries(analogue.forward_returns || {}))
    .map(([key, value]) => ({
      label: formatAssetLabel(String(key).replace(/_12m$/, '')),
      value: Number(value),
    }))
    .filter((item) => Number.isFinite(item.value));

  const bestAssets = uniqueAssetsByLabel(bestAssetsRaw, 'desc', 2);

  const worstAssetsRaw = analogueList
    .flatMap((analogue) => Object.entries(analogue.forward_returns || {}))
    .map(([key, value]) => ({
      label: formatAssetLabel(String(key).replace(/_12m$/, '')),
      value: Number(value),
    }))
    .filter((item) => Number.isFinite(item.value));

  const worstAssets = uniqueAssetsByLabel(worstAssetsRaw, 'asc', 2);

  const historyEntries = Array.isArray(historyData?.data) ? historyData.data : Array.isArray(historyData) ? historyData : historyData?.history ?? [];
  const recentHistory = Array.isArray(historyEntries) && historyEntries.length > 0
    ? historyEntries.slice(0, 3).map((h) => `${String(h.date || '').split('T')[0]} ${h.regime}`).join(' · ')
    : 'Data unavailable';

  const favorText = bestAssets.length > 0
    ? bestAssets.map((a) => `${a.label} (${(a.value * 100).toFixed(1)}%)`).join(', ')
    : topAssets.length > 0
      ? topAssets.map((a) => `${a.label} (${(a.value * 100).toFixed(1)}%)`).join(', ')
      : 'Data unavailable';

  const avoidText = worstAssets.length > 0
    ? worstAssets.map((a) => `${a.label} (${(a.value * 100).toFixed(1)}%)`).join(', ')
    : 'Data unavailable';

  return [
    `Recommendation: In ${regimeName}, favor ${favorText} and keep a cautious stance on weaker assets like ${avoidText}.`,
    `Rationale: Current Regime: ${regimeName}. Analogues: ${analogueText}. Asset implications: the analogue periods show the strongest follow-through in ${bestAssets.map((a) => a.label).join(', ') || 'Data unavailable'}, while weaker outcomes clustered in ${avoidText}. Regime history: ${recentHistory}.`,
  ].join('\n');
}

// Enhanced endpoint with real market data
app.post('/api/copilot/ask', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log(`📊 RegimeMind analyzing: "${question}"`);

    // Fetch real market data in parallel (current, analogues, history)
    const [currentRegimeData, analoguesData, historyData] = await Promise.all([
      fetchCurrentRegime(),
      fetchAnalogues(),
      fetchHistory(),
    ]);

    console.log('DEBUG: currentRegimeData present?', !!currentRegimeData);
    console.log('DEBUG: analoguesData present?', !!analoguesData);
    console.log('DEBUG: historyData present?', !!historyData);

    // Build rich context from real data
    const marketContext = buildMarketContext(currentRegimeData, analoguesData, historyData);

    // Instruct the model to always reference the current regime, 1-2 analogue periods, and
    // the asset-level implications. We still keep this for optional model output, but the
    // final response is generated deterministically from your endpoints to guarantee grounding.
    const systemPrompt = `You are RegimeMind, a professional investment advisor specializing in macro regime analysis.
You have access to real market data about the current regime, historical analogues, forward returns, and regime history.

${marketContext}

Rules for your answer:
- ALWAYS mention the Current Regime by name (e.g., "Current Regime: <name>").
- ALWAYS mention 1-2 Historical Analogues by name and date (e.g., "Analogues: <name> (<date>), ...").
- ALWAYS summarize Asset Implications (which assets to favor or avoid and why) based on the data above.
- Keep the overall answer concise: a one-line "Recommendation:" followed by a one-line "Rationale:" that explicitly references the Current Regime and at least one Analogue.
- If the data above does not contain a field, say "Data unavailable" for that piece instead of guessing.

Output format (strict):
Recommendation: <short action-focused sentence>
Rationale: <1 sentence that references Current Regime and 1-2 Analogues and asset implications>

Only output the two lines above. Do NOT include extraneous commentary.`;
    const groundedAnswer = buildGroundedAnswer(question, currentRegimeData, analoguesData, historyData);

    // Optional model call can remain available for logging/experimentation, but the public
    // answer is always the grounded one above so users never get generic responses.
    if (PERPLEXITY_API_KEY) {
      console.log(`✨ Grounded answer generated from data endpoints; Perplexity disabled for final output.`);
    }

    res.json({ answer: groundedAnswer, systemPrompt });
  } catch (error) {
    console.error('❌ Backend error:', error);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Copilot backend running on http://localhost:${PORT}`);
  console.log(`Using Perplexity API: ${PERPLEXITY_API_KEY ? 'Configured' : 'Not configured'}`);
});
