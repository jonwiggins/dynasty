# Dynasty Fund Simulator

An interactive web application that models the long-term sustainability of a perpetual fund designed to pay median U.S. income to a growing family lineage across multiple generations.

## Overview

The Dynasty Fund Simulator combines demographic modeling with stochastic investment simulation to help users understand whether a given fund amount can sustain payouts to an ever-growing family tree over 50-500 years. It runs hundreds of Monte Carlo simulations to provide probabilistic outcomes rather than single-point estimates.

## Features

- **Monte Carlo Simulation**: Run 10-500 parallel stochastic simulations with randomized returns
- **Demographic Modeling**: Realistic family growth with marriage, fertility, and mortality models
- **Interactive Controls**: Adjust 15+ parameters including fund size, returns, volatility, and demographics
- **Percentile Analysis**: View 5th, 25th, 50th, 75th, and 95th percentile outcomes
- **Single Run Details**: Drill into individual simulation runs to see births, deaths, and family growth
- **Real-time Visualization**: Charts update instantly as you adjust parameters

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
| **Initial Conditions** | Fund Amount | $500K - $50M | $5M |
| | Founder Age | 20 - 50 | 30 |
| **Investment** | Real Return Rate | 2% - 12% | 7% |
| | Volatility | 5% - 30% | 15% |
| **Income** | Median Income | $40K - $150K | $84K |
| | Real Growth | 0% - 3% | 0.8% |
| **Demographics** | Fertility Rate | 0.5 - 4.0 | 1.6 |
| | Marriage Age | 20 - 40 | 27 |
| | Life Expectancy | 60 - 100 | 80 |
| **Simulation** | Years | 50 - 500 | 200 |
| | Runs | 10 - 500 | 100 |

## How It Works

1. **Initialization**: Creates a founder at the specified age with an initial fund balance
2. **Yearly Simulation**: Each year processes:
   - Marriage events (age-based probability)
   - Birth events (fertility model with age and child spacing)
   - Death events (Gompertz-Makeham mortality law)
   - Investment returns (log-normal distribution)
   - Payouts to eligible beneficiaries (age 18+)
3. **Fund Tracking**: Monitors balance and detects ruin (balance ≤ 0)
4. **Aggregation**: Combines results across all runs to compute success rates and percentiles

## Key Metrics

- **Success Rate**: Percentage of simulations where the fund survives the full period
- **Fund Multiple**: Final fund value as a multiple of starting value (median case)
- **Median Ruin Year**: When the fund fails in unsuccessful simulations
- **Starting Payout Rate**: Initial withdrawal rate as percentage of fund

## License

MIT
