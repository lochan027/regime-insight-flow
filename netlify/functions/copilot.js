// Netlify Function: copilot
// This serverless function replicates the grounded-answer logic from backend.js
// It fetches /regime/current, /regime/analogues, /regime/history from the macro API
// and returns a deterministic, data-grounded recommendation.

const MACRO_API_BASE = process.env.VITE_API_PROXY_TARGET || 'https://macroregime.hub.zerve.cloud';

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

exports.handler = async function (event, context) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const question = body.question || '';

    // Fetch data in parallel
    const [currentRes, analoguesRes, historyRes] = await Promise.all([
      fetch(`${MACRO_API_BASE}/regime/current`).then((r) => r.json()).catch(() => null),
      fetch(`${MACRO_API_BASE}/regime/analogues`).then((r) => r.json()).catch(() => null),
      fetch(`${MACRO_API_BASE}/regime/history?n=50`).then((r) => r.json()).catch(() => null),
    ]);

    const regimeName = String(currentRes?.regime?.regime ?? currentRes?.data?.regime?.regime ?? currentRes?.regime ?? 'Data unavailable');
    const topAssets = (currentRes?.asset_outlook?.assets ?? currentRes?.data?.asset_outlook?.assets ?? currentRes?.top_assets ?? [])
      .slice(0, 3)
      .map((asset) => ({
        label: formatAssetLabel(asset.asset || asset.name || ''),
        value: Number(asset.annualized_return ?? asset.return ?? 0),
      }))
      .sort((a, b) => b.value - a.value);

    const analogueList = (analoguesRes?.analogues ?? analoguesRes?.data?.analogues ?? []) || [];
    const analogueTop2 = analogueList.slice(0, 2);

    const bestAssetsRaw = analogueTop2
      .flatMap((analogue) => Object.entries(analogue.forward_returns || {}))
      .map(([key, value]) => ({ label: formatAssetLabel(String(key).replace(/_12m$/, '')), value: Number(value) }))
      .filter((item) => Number.isFinite(item.value));

    const bestAssets = uniqueAssetsByLabel(bestAssetsRaw, 'desc', 2);

    const worstAssetsRaw = analogueTop2
      .flatMap((analogue) => Object.entries(analogue.forward_returns || {}))
      .map(([key, value]) => ({ label: formatAssetLabel(String(key).replace(/_12m$/, '')), value: Number(value) }))
      .filter((item) => Number.isFinite(item.value));

    const worstAssets = uniqueAssetsByLabel(worstAssetsRaw, 'asc', 2);

    const analogueText = analogueTop2.length
      ? analogueTop2.map((a) => `${a.regime || 'Unknown'} (${String(a.analogue_date || '').split('T')[0] || 'Unknown'})`).join(', ')
      : 'Data unavailable';

    const historyEntries = Array.isArray(historyRes?.data) ? historyRes.data : Array.isArray(historyRes) ? historyRes : historyRes?.history ?? [];
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

    const recommendation = `Recommendation: In ${regimeName}, favor ${favorText} and keep a cautious stance on weaker assets like ${avoidText}.`;
    const rationale = `Rationale: Current Regime: ${regimeName}. Analogues: ${analogueText}. Asset implications: the analogue periods show the strongest follow-through in ${bestAssets.map((a) => a.label).join(', ') || 'Data unavailable'}, while weaker outcomes clustered in ${avoidText}. Regime history: ${recentHistory}.`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: `${recommendation}\n${rationale}` }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err) }),
    };
  }
};
