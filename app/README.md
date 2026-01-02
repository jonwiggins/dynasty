# Fund Sustainability Simulators

Interactive web applications that model long-term sustainability of perpetual funds using Monte Carlo simulation.

## Two Simulators

### Dynasty Fund Simulator (`/`)
Models a perpetual fund paying median U.S. income to a growing family lineage across multiple generations (50-500 years).

### UBI Sovereign Wealth Fund Simulator (`/ubi.html`)
Models a national sovereign wealth fund providing Universal Basic Income to an entire country's population (25-200 years).

## Overview

Both simulators combine demographic/population modeling with stochastic investment simulation to provide probabilistic outcomes rather than single-point estimates. They run 100 Monte Carlo simulations per parameter set.

## Features

- **Monte Carlo Simulation**: Run 100 parallel stochastic simulations with randomized returns
- **Demographic Modeling**: Realistic family growth with marriage, fertility, and mortality models
- **Interactive Controls**: Adjust 15+ parameters including fund size, returns, volatility, and demographics
- **Sensitivity Analysis**: Click on any parameter to see a dedicated chart showing how that variable affects success rate across its full range
- **Percentile Analysis**: View 25th, 50th, and 75th percentile outcomes
- **Single Run Details**: Drill into individual simulation runs to see births, deaths, and family growth
- **Real-time Updates**: Simulations auto-run as you adjust parameters with a visual loading indicator
- **Life Expectancy Growth**: Model improving longevity over time with configurable growth rates

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **Recharts** - Data visualization

## Installation

```bash
npm install
```

## Usage

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Configuration Parameters

| Category | Parameter | Range | Default |
|----------|-----------|-------|---------|
| **Initial Conditions** | Fund Amount | $500K - $10M | $5M |
| | Founder Age | 1 - 50 | 1 |
| **Investment** | Real Return Rate | 2% - 15% | 7% |
| | Volatility | 5% - 30% | 15% |
| **Income** | Median Income | $40K - $150K | $84K |
| | Real Growth | 0% - 3% | 0.8% |
| **Demographics** | Fertility Rate | 0.5 - 4.0 | 2.0 |
| | Marriage Age | 20 - 40 | 20 |
| | Life Expectancy | 60 - 120 | 78 |
| | Life Exp. Growth | 0 - 5 yrs/decade | 1.5 yrs/decade |
| **Simulation** | Years | 50 - 500 | 200 |

## How It Works

1. **Initialization**: Creates a founder at the specified age with an initial fund balance
2. **Yearly Simulation**: Each year processes:
   - Marriage events (age-based probability)
   - Birth events (fertility model with age and child spacing)
   - Death events (Gompertz-Makeham mortality law with improving life expectancy)
   - Investment returns (log-normal distribution)
   - Payouts to eligible beneficiaries (age 18+)
3. **Fund Tracking**: Monitors balance and detects ruin (balance ≤ 0)
4. **Aggregation**: Combines results across all runs to compute success rates and percentiles

## Key Metrics

- **Success Rate**: Percentage of simulations where the fund survives the full period
- **Fund Multiple**: Final fund value as a multiple of starting value (median case)
- **Median Ruin Year**: When the fund fails in unsuccessful simulations
- **Starting Payout Rate**: Initial withdrawal rate as percentage of fund

## Research Findings

We conducted a comprehensive study using 30,000+ Monte Carlo simulations to answer key questions about dynasty fund sustainability. See the full report in [`research/RESEARCH_REPORT.md`](research/RESEARCH_REPORT.md).

### Key Discoveries

**1. Volatility Matters More Than Returns**

| Volatility | Success Rate (at 7% return) |
|------------|----------------------------|
| 5% | ~100% |
| 10% | ~91% |
| 15% | ~66% |
| 25% | ~25% |

Reducing volatility from 15% to 10% improves success by ~25 percentage points—equivalent to adding millions to the initial fund.

**2. The "4% Rule" Fails for Dynasties**

| Withdrawal Rate | Success Rate |
|-----------------|--------------|
| 4.2% | ~26% |
| 1.7% | ~68% |
| 0.8% | ~86% |

Dynasty safe withdrawal rate is **<1%**, not 4%. Plan for fund = 100x+ first year payout.

**3. The Fertility Paradox**

| TFR | Success Rate |
|-----|--------------|
| 1.0 (shrinking) | ~87% |
| 2.0 (replacement) | ~70% |
| 4.0 (rapid growth) | ~31% |

Lower fertility dramatically improves fund survival, creating a tension between financial and demographic success.

**4. Minimum Viable Fund**

- **$5M**: ~70% success
- **$15M**: ~91% success
- **$20M**: ~95% success

For 90%+ confidence over 200 years, plan for $15-20M initial fund.

**5. Marriage Age as a Lever**

Delaying marriage from age 20 to 35 improves success from ~68% to ~91% by reducing overlapping generations.

### Optimal Configuration

For maximum sustainability with a $5M fund:
- TFR 1.5, Marriage age 30, 10% volatility → **~98% success**

For near-certain success:
- $10M, TFR 1.5, Marriage age 30, 10% volatility, 8% return → **~100% success**

---

## UBI Research Findings

We conducted a comprehensive study on sovereign wealth fund sustainability for UBI programs. See the full report in [`research/UBI_RESEARCH_REPORT.md`](research/UBI_RESEARCH_REPORT.md).

### Key Discoveries

**1. The Alaska Model Scales Perfectly**

| Population Scale | Success Rate |
|-----------------|--------------|
| Alaska (730K) | >99.5% |
| Norway-scale (5.5M) | 99.5% |
| Medium nation (50M) | 98% |
| Large nation (100M) | 98.5% |

The Alaska model ($110K per capita, $133/month) achieves 98%+ success at any population scale.

**2. Safe Withdrawal Rate is ~2%**

| Withdrawal Rate | Success Rate |
|-----------------|--------------|
| 2% | ~86% |
| 3% | ~64% |
| 4% | ~37% |
| 5% | ~23% |

The 4% retirement rule fails for UBI. Target ≤2% for 85%+ confidence.

**3. Per-Capita Requirements for $1,000/month UBI**

| Per-Capita Fund | Success Rate |
|-----------------|--------------|
| $200K | ~25% |
| $350K | ~73% |
| $500K | ~93% |

Meaningful UBI ($1,000/month) requires ~$500K per capita—$25T for 50M people.

**4. Real-World Country Analysis**

| Country | Per Capita | Sustainable UBI |
|---------|-----------|-----------------|
| Norway ($255K) | $500/month | 97.5% success |
| Saudi Arabia ($26K) | $100/month | 40% success |
| USA (needs $75-100T) | $500/month | ~85-95% success |

Norway could sustainably pay ~$500/month today. The US would need $75-100T (4-5x GDP).

**5. Volatility Matters (But Less Than Dynasty Funds)**

At $200K per capita with $1000/mo UBI:

| Volatility | 7% Return Success |
|------------|-------------------|
| 6% | 90% |
| 10% | 67% |
| 12% | 61% |

Low volatility with moderate returns beats high returns with high volatility.

### Key Insight

**The "Alaska Threshold"**: ~$100K per capita can sustain ~$1,600/year indefinitely at any scale. This is the proven, scalable model for UBI via sovereign wealth funds.

## License

MIT
