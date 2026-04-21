# Regime Insight Flow

A machine-learning-powered web application and REST API that classifies the current US macroeconomic environment into one of four historical **macro regimes** using 25 Federal Reserve (FRED) indicators — and maps which asset classes have historically performed best in each regime, going back to 1990.

---

## Table of Contents

- [Overview](#overview)
- [Macro Regimes](#macro-regimes)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
  - [Building for Production](#building-for-production)
- [API Reference](#api-reference)
  - [Base URL](#base-url)
  - [Authentication](#authentication)
  - [Rate Limiting](#rate-limiting)
  - [GET /regime/current](#get-regimecurrent)
  - [GET /regime/history](#get-regimehistory)
  - [GET /regime/analogues](#get-regimeanalogues)
- [Use Cases](#use-cases)
- [Project Structure](#project-structure)
- [Running Tests](#running-tests)
- [Linting](#linting)

---

## Overview

Regime Insight Flow answers the question: **"What macro regime are we in right now — and what does history say about what comes next?"**

A classification model ingests 25 Federal Reserve economic indicators and assigns the current month to one of four macro regimes. For each regime the API surfaces:

- The regime label and model confidence score
- Which asset classes have led performance in similar historical periods
- A full month-by-month history of regime transitions back to 1990
- The historical months most analogous to any given reference date, along with subsequent 12-month asset returns

The companion React frontend provides a live dashboard and interactive API explorer so you can explore the data without writing a single line of code.

---

## Macro Regimes

| Regime | Characteristics | Typical Leaders |
|---|---|---|
| **Goldilocks** | Strong growth, contained inflation | US Equities, Tech, IG Credit |
| **Reflation** | Accelerating growth off a trough | Cyclicals, High Yield Credit |
| **Stagflation** | Sticky inflation, slowing growth | Commodities, Real Assets |
| **Deflation** | Falling growth and inflation | Long Duration Bonds, Quality |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org) |
| Build tool | [Vite](https://vitejs.dev) |
| Styling | [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| Animation | [Framer Motion](https://www.framer.motion.com) |
| Data fetching | [TanStack Query v5](https://tanstack.com/query) |
| Charts | [Recharts](https://recharts.org) |
| Routing | [React Router v6](https://reactrouter.com) |
| Forms | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Testing | [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) |
| Linting | [ESLint](https://eslint.org) |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 (or [Bun](https://bun.sh) ≥ 1)
- **npm** (bundled with Node) or **bun**

### Installation

```bash
# Clone the repository
git clone https://github.com/lochan027/regime-insight-flow.git
cd regime-insight-flow

# Install dependencies
npm install
# or
bun install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API | Falls back to rich mock data |

> **Note:** When `VITE_API_BASE_URL` is not set, the app automatically uses built-in mock data so the entire UI is functional during local development without a running backend.

### Running Locally

```bash
npm run dev
# or
bun run dev
```

The app will be available at `http://localhost:5173`.

### Building for Production

```bash
npm run build
# or
bun run build
```

Output is written to the `dist/` directory. Preview the production build with:

```bash
npm run preview
```

---

## API Reference

### Base URL

```
https://api.example.com   # replace with your VITE_API_BASE_URL
```

All endpoints return **JSON** and responses are **gzip-compressed**.

### Authentication

No API key is required for any public endpoint.

### Rate Limiting

**60 requests per minute** per IP address.

---

### GET /regime/current

Returns the current macro regime, model confidence score, and top-performing asset classes.

**Request**

```bash
curl -s https://api.example.com/regime/current
```

```js
const res = await fetch("https://api.example.com/regime/current");
const data = await res.json();
```

```python
import requests
data = requests.get("https://api.example.com/regime/current").json()
```

**Parameters:** _None_

**Response fields**

| Field | Type | Description |
|---|---|---|
| `regime` | `string` | Regime label (e.g. `"Goldilocks"`) |
| `confidence` | `number` | Model confidence score, `0`–`1` |
| `in_place_since` | `date` | ISO date when this regime began |
| `months_in_regime` | `integer` | Number of months the current regime has been active |
| `top_assets` | `array` | Top-performing asset classes in this regime (see below) |
| `as_of` | `date` | Date the classification was last updated |

**`top_assets` item fields**

| Field | Type | Description |
|---|---|---|
| `asset` | `string` | Asset class name |
| `return_pct` | `number` | Historical average return (%) in this regime |

**Example response**

```json
{
  "regime": "Goldilocks",
  "confidence": 0.78,
  "in_place_since": "2024-08-01",
  "months_in_regime": 8,
  "top_assets": [
    { "asset": "US Equities", "return_pct": 14.2 },
    { "asset": "Tech (NDX)", "return_pct": 18.6 },
    { "asset": "Investment Grade Credit", "return_pct": 6.4 }
  ],
  "as_of": "2025-04-01"
}
```

---

### GET /regime/history

Returns monthly regime classifications and the growth composite from 1990 onwards.

**Request**

```bash
curl -s "https://api.example.com/regime/history?start=2000-01&end=2024-12"
```

**Query parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `start` | `string` | No | Start month in `YYYY-MM` format (default `1990-01`) |
| `end` | `string` | No | End month in `YYYY-MM` format (default: current month) |
| `include_indicators` | `boolean` | No | When `true`, include all 25 raw FRED indicator values per data point |

**Response fields**

| Field | Type | Description |
|---|---|---|
| `start` | `string` | First month in the returned series |
| `end` | `string` | Last month in the returned series |
| `points` | `array` | Array of monthly data points (see below) |

**`points` item fields**

| Field | Type | Description |
|---|---|---|
| `points[].date` | `string` | Year-month identifier (`YYYY-MM`) |
| `points[].regime` | `string` | Model-assigned regime label |
| `points[].growth_composite` | `number` | Composite growth score, `−1` to `1` |
| `points[].indicators` | `object` | _(only when `include_indicators=true`)_ Raw FRED indicator values |

**Example response**

```json
{
  "start": "2000-01",
  "end": "2000-03",
  "points": [
    { "date": "2000-01", "regime": "Goldilocks", "growth_composite": 0.61 },
    { "date": "2000-02", "regime": "Goldilocks", "growth_composite": 0.58 },
    { "date": "2000-03", "regime": "Overheating", "growth_composite": 0.49 }
  ]
}
```

---

### GET /regime/analogues

Returns the historical months most similar to a given reference date, along with subsequent 12-month asset returns.

**Request**

```bash
curl -s "https://api.example.com/regime/analogues?date=2024-09-01&n=5"
```

**Query parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `date` | `string` | **Yes** | Reference date (`YYYY-MM-DD`) |
| `n` | `integer` | No | Number of analogues to return, `1`–`10` (default `3`) |

**Response fields**

| Field | Type | Description |
|---|---|---|
| `date` | `string` | The reference date supplied in the request |
| `regime` | `string` | Regime assigned to the reference date |
| `matches` | `array` | Ordered list of analogue months (see below) |

**`matches` item fields**

| Field | Type | Description |
|---|---|---|
| `matches[].date` | `date` | Analogue month |
| `matches[].regime` | `string` | Regime of the analogue month |
| `matches[].similarity` | `number` | Similarity score, `0`–`1` (higher = more similar) |
| `matches[].forward_returns_12m` | `array` | Asset returns in the 12 months following the analogue month |

**`forward_returns_12m` item fields**

| Field | Type | Description |
|---|---|---|
| `asset` | `string` | Asset class name |
| `return_pct` | `number` | 12-month forward return (%) |

**Example response**

```json
{
  "date": "2024-09-01",
  "regime": "Goldilocks",
  "matches": [
    {
      "date": "1995-06-01",
      "regime": "Goldilocks",
      "similarity": 0.92,
      "forward_returns_12m": [
        { "asset": "US Equities", "return_pct": 19.3 },
        { "asset": "US Treasuries 10Y", "return_pct": 4.1 },
        { "asset": "Gold", "return_pct": 1.8 }
      ]
    }
  ]
}
```

---

## Use Cases

| Audience | How they use it |
|---|---|
| **Portfolio managers** | Tilt allocations toward asset classes that have historically led in the current regime |
| **Quant analysts** | Backtest strategies conditioned on regime transitions instead of fixed calendar windows |
| **Financial journalists** | Anchor stories with a clear, model-based read on where the macro cycle stands |
| **Fintech developers** | Drop a regime indicator into dashboards, alerts, and onboarding with a single fetch call |
| **Risk managers** | Stress-test books against historical analogues that resemble today's regime fingerprint |
| **Researchers** | Study how 25 FRED indicators co-move across decades of US business cycles |

---

## Project Structure

```
regime-insight-flow/
├── public/                  # Static assets
├── src/
│   ├── components/          # React UI components
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── ApiDocsSection.tsx
│   │   ├── ApiExplorer.tsx
│   │   ├── HeroSection.tsx
│   │   ├── HeroLiveCard.tsx
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── TimelineSection.tsx
│   │   └── UseCasesSection.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useCurrentRegime.ts
│   │   └── useRegimeHistory.ts
│   ├── lib/
│   │   ├── api.ts           # API client + mock data
│   │   ├── constants.ts     # API base URL, regime descriptions
│   │   ├── format.ts        # Formatting utilities
│   │   └── utils.ts         # General utilities
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── Index.tsx
│   │   └── NotFound.tsx
│   ├── types/
│   │   └── api.ts           # TypeScript response types
│   ├── test/                # Test files
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## Running Tests

```bash
npm run test
# or watch mode
npm run test:watch
```

---

## Linting

```bash
npm run lint
```
