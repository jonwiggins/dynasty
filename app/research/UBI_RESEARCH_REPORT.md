# Sovereign Wealth Funds for Universal Basic Income: A Monte Carlo Analysis

## Abstract

This study uses Monte Carlo simulation to analyze the sustainability of sovereign wealth funds designed to provide Universal Basic Income (UBI) to national populations over 75 years. Our key finding is the **"Alaska Model" - modest payments ($133/month) with adequate per-capita funding ($110K) achieve 98%+ success rates that scale to any population size**. However, achieving meaningful UBI levels ($1,000/month) requires extraordinary per-capita wealth: approximately **$500,000 per person** for 90% confidence, equivalent to $25 trillion for a 50-million-person nation. We identify a critical "UBI Sustainability Threshold" where withdrawal rates above ~2% lead to high failure risk.

**Note on precision**: All success rates have standard error of approximately ±3-4 percentage points (95% CI: ±6-7 points) based on 200 simulations per data point.

## 1. Introduction

### 1.1 Background

Several sovereign wealth funds currently exist that could theoretically fund UBI programs:
- **Norway's GPFG**: $1.4 trillion for 5.5 million people (~$255K per capita)
- **Alaska Permanent Fund**: $80 billion for 730,000 people (~$110K per capita), currently pays ~$1,600/year
- **Saudi Arabia's PIF**: $900 billion for 35 million people (~$26K per capita)

The fundamental question: Can these funds sustain meaningful UBI payments indefinitely?

### 1.2 Research Questions

1. What per-capita fund size is required for various UBI amounts?
2. What is the "safe withdrawal rate" for perpetual UBI?
3. How does the Alaska model scale to larger populations?
4. Can countries like Norway fund $1,000/month UBI?
5. What fund would the United States need for meaningful UBI?
6. Is volatility reduction as critical as for dynasty funds?

## 2. Methodology

### 2.1 Simulation Model

We use a cohort-based population model (not individual tracking) enabling million-scale simulations:

- **Population**: Grows/shrinks at configurable annual rate
- **Eligibility**: Based on age threshold and life expectancy ratio
- **Returns**: Stochastic with configurable mean and volatility
- **Payouts**: Monthly UBI × 12 × eligible population
- **Success**: Fund remains positive for 75-year simulation period

### 2.2 Base Parameters

| Parameter | Default Value |
|-----------|---------------|
| Population | 50 million |
| Population Growth | 0.5%/year |
| Life Expectancy | 80 years |
| Eligibility Age | 18 |
| Real Return Rate | 5% |
| Return Volatility | 12% |
| Time Horizon | 75 years |

### 2.3 Experimental Design

We ran 200 Monte Carlo simulations per parameter combination across 10 experiment categories, testing over 150 distinct scenarios.

## 3. Results

### 3.1 Per-Capita Fund Requirements

**Finding**: For $1,000/month UBI, approximately **$500,000 per capita** is needed for 90% success.

| Per-Capita Fund | Monthly UBI | Success Rate | 95% CI |
|-----------------|-------------|--------------|--------|
| $100K | $1,000 | 0.5% | ±1% |
| $200K | $1,000 | 24-28% | ±6% |
| $350K | $1,000 | 70-76% | ±6% |
| $500K | $1,000 | 90-95% | ±4% |
| $750K | $1,000 | 96-99% | ±2% |

The relationship shows strong sensitivity to per-capita funding - doubling from $200K to $400K per capita increases success from ~25% to ~83%.

### 3.2 Sustainable UBI by Fund Size

**Finding**: Sustainable UBI is roughly **0.25-0.35% of per-capita fund monthly** (3-4% annually).

| Per-Capita Fund | Sustainable UBI (90%+ success) | Withdrawal Rate |
|-----------------|-------------------------------|-----------------|
| $100K | ~$200/month | 2.4% |
| $150K | ~$300/month | 2.4% |
| $200K | ~$300/month | 1.8% |
| $300K | ~$500/month | 2.0% |
| $500K | ~$1,000/month | 2.4% |

This corresponds to a **sustainable withdrawal rate of approximately 2-2.5%** - significantly below the traditional 4% retirement rule.

### 3.3 The Alaska Model: Scalability

**Finding**: The Alaska model ($110K per capita, $133/month) achieves 98%+ success at any population scale tested.

| Population Scale | Success Rate | 95% CI |
|-----------------|--------------|--------|
| Alaska (730K) | >99.5%* | - |
| Wyoming (580K) | 99% | ±1% |
| Norway-scale (5.5M) | 99.5% | ±1% |
| Small nation (10M) | 99% | ±1% |
| Medium nation (50M) | 98% | ±2% |
| Large nation (100M) | 98.5% | ±2% |

*With n=200 simulations, 100% observed success indicates >99.5% true rate.

**Key insight**: In this simplified model, per-capita math is scale-invariant. The Alaska dividend model appears mathematically sustainable at any population size, providing ~$1,600/year indefinitely. Real-world factors (administrative costs, investment capacity, political economy) may introduce scale-dependent effects not captured here.

### 3.4 UBI Safe Withdrawal Rate

**Finding**: For 85%+ confidence, withdrawal rate should be **at or below 2%**. True 90%+ confidence requires withdrawal rates below 2%.

| Withdrawal Rate | Success Rate | 95% CI |
|-----------------|--------------|--------|
| 2.0% | 84-88% | ±5% |
| 3.0% | 61-67% | ±6% |
| 4.0% | 34-39% | ±7% |
| 5.0% | 20-25% | ±6% |
| 6.0% | 8-13% | ±5% |
| 8.0%+ | <2% | - |

The traditional 4% retirement rule fails for UBI - it achieves only ~37% success over 75 years, far below acceptable thresholds for public policy.

### 3.5 Real-World Country Analysis

**Norway** ($255K per capita, $1.4T fund for 5.5M people):

| Monthly UBI | Annual Cost | WR | Success Rate |
|-------------|-------------|-----|--------------|
| $250 | $13B | 0.9% | >99.5%* |
| $500 | $26B | 1.9% | 97.5% |
| $750 | $39B | 2.8% | 77.5% |
| $1,000 | $52B | 3.7% | 54.5% |
| $1,500 | $78B | 5.6% | 12% |

**Norway could sustainably pay ~$500/month UBI** ($6,000/year) to all citizens - roughly 3x Alaska's current dividend.

**Saudi Arabia** ($26K per capita, $900B for 35M people):

| Monthly UBI | Success Rate |
|-------------|--------------|
| $100 | 40.5% |
| $200 | 3.5% |
| $300+ | ~0% |

Saudi Arabia's fund is **severely underfunded for UBI** - even $100/month has only 40% success.

**United States** (330M people):

| Fund Size | Per Capita | $500/mo UBI Success |
|-----------|-----------|---------------------|
| $10T | $30K | 0% |
| $15T | $45K | 0% |
| $20T | $61K | 1.5% |
| $25T | $76K | 6% |
| $30T | $91K | 19% |
| $40T | $121K | 43% |
| $50T | $152K | 59% |

*Based on experimental data. Extrapolating to 90% success suggests $75-100T required.*

For the US to pay $500/month UBI with 90% confidence, a fund of approximately **$75-100 trillion** would be needed - roughly 4-5x current US GDP.

### 3.6 Volatility Impact

**Finding**: Volatility matters, but less dramatically than for dynasty funds.

At $200K per capita, $1000/mo UBI:

| Volatility | 5% Return | 7% Return | 8% Return |
|------------|-----------|-----------|-----------|
| 6% | 18% | 90% | 97% |
| 8% | 22% | 80% | 95.5% |
| 10% | 30% | 67% | 86.5% |
| 12% | 27% | 61% | 78% |

Low volatility (6%) with 7% returns achieves 90% success - a ~30 percentage point improvement over 12% volatility. This is significant but less extreme than dynasty funds where the spread exceeded 50 points.

### 3.7 Return Requirements

**Finding**: Each additional percentage point of return is worth approximately $100K in per-capita fund.

At $200K per capita, $1,000/mo UBI:

| Real Return | Success Rate |
|-------------|--------------|
| 5% | 24% |
| 6% | 40.5% |
| 7% | 64.5% |
| 8% | 77% |
| 9% | 91.5% |
| 10% | 97.5% |

Achieving 9% real returns would allow $200K per capita to sustain $1,000/month UBI - but such returns are historically difficult.

### 3.8 Population Growth Impact

**Finding**: Population growth compounds payout requirements over time.

**Important caveat**: Our baseline test ($2T fund / 50M people = $40K per capita) is so underfunded that all growth scenarios show 0% success, making it impossible to isolate population growth effects. The table below illustrates fund inadequacy, not growth sensitivity:

| Growth Rate | Success Rate | Note |
|-------------|--------------|------|
| -1.0% | 0% | Fund too small |
| 0% | 0% | Fund too small |
| +0.5% | 0% | Fund too small |
| +2.0% | 0% | Fund too small |

At adequately funded levels, population decline does help sustainability:

- Declining population (-0.5%) with $200K per capita: 52.5% success
- Growing population (+0.5%) with $200K per capita: 24% success

This ~28 percentage point difference demonstrates the significant impact of demographic trends on fund sustainability.

### 3.9 Optimal Configurations

**Finding**: For 90%+ success with meaningful UBI, multiple parameters must align.

| Scenario | Success Rate |
|----------|--------------|
| Conservative ($200K/cap, $500/mo, 5% ret, 10% vol) | 89.5% |
| High return ($200K/cap, $750/mo, 7% ret, 12% vol) | 85.5% |
| Large fund ($300K/cap, $1000/mo, 5% ret, 10% vol) | 65.5% |
| Maximum UBI ($500K/cap, $1500/mo, 6% ret, 10% vol) | 90.5% |

The "Maximum UBI" scenario - $500K per capita with 6% returns and 10% volatility - can sustain $1,500/month ($18,000/year) with 90% confidence.

## 4. Discussion

### 4.1 The Tyranny of Compound Growth

UBI funds face a fundamental challenge: compound population growth eventually overwhelms compound investment returns. Even small differences compound dramatically over 75 years:

- 0.5% population growth: Population increases 45%
- 1.0% population growth: Population doubles
- 2.0% population growth: Population quadruples

This explains why population growth scenarios show such poor outcomes.

### 4.2 The Alaska Model's Elegance

The Alaska Permanent Fund's design is remarkably sound:
- Modest per-capita investment (~$110K)
- Modest payments (~$1,600/year)
- Low withdrawal rate (~1.5%)
- Near-certain sustainability (98%+)

If Alaska's model were applied globally:
- World population: 8 billion
- Required fund: $880 trillion (11x world GDP)
- Payment: $1,600/year per person

This is impractical at global scale but potentially achievable for small, wealthy nations.

### 4.3 Comparison to Dynasty Funds

| Factor | Dynasty Fund | UBI Fund |
|--------|-------------|----------|
| Recipients | Exponential growth (fertility) | Linear growth (pop rate) |
| Payment | Median income (~$84K) | Configurable UBI |
| Safe WR | <1% | ~2% |
| Volatility Sensitivity | Extreme | Significant |
| Required Fund Multiple | 100x+ first year payout | 40-50x annual cost |

UBI funds are somewhat more sustainable because population growth is slower and more predictable than family tree expansion.

### 4.4 Policy Implications

1. **The 4% rule is inadequate**: UBI funds should target ≤2% withdrawal rates
2. **Modest UBI is sustainable**: $200-500/month can work with realistic fund sizes
3. **$1,000/month requires extraordinary wealth**: ~$500K per capita
4. **Norway is well-positioned**: Could implement $500/month UBI today
5. **Large nations face enormous challenges**: US would need $75-100T for modest UBI

### 4.5 Limitations

1. **Simplified demographics**: Cohort model doesn't capture age-structure dynamics
2. **No inflation modeling**: All values in real terms
3. **75-year horizon**: Longer periods would show worse outcomes
4. **No taxes/fees**: Real-world administrative costs (0.05-0.5% for sovereign funds) reduce effective returns
5. **Deterministic eligibility**: Real policies have complex rules
6. **Optimistic return assumptions**: The 5% real return assumption may be optimistic; Norway's GPFG has achieved ~4% historically
7. **Independent returns**: Model assumes no return autocorrelation or regime-switching
8. **No political risk**: Fund raids, policy changes, and political pressures are not modeled
9. **Sample size**: 200 simulations per scenario limits precision, especially for values near 0% or 100%
10. **No sequence-of-returns analysis**: Early-period losses and their outsized impact not explicitly studied

## 5. Conclusion

Sovereign wealth funds can sustainably provide Universal Basic Income, but the required scale is humbling. The **"Alaska threshold"** of ~$100K per capita for ~$1,600/year payments represents a well-tested, scalable model. However, achieving "livable" UBI levels of $1,000+/month requires per-capita wealth of $400-500K - a level currently achieved only by Norway.

Our analysis suggests three viable paths to UBI:

1. **The Alaska Path**: Modest supplements ($100-200/month) with current fund sizes
2. **The Norway Path**: Meaningful UBI ($500/month) for small, wealthy nations
3. **The Long Path**: Massive fund accumulation over decades for larger nations

The fundamental insight is that **perpetual UBI requires treating the fund as an endowment, not a spending account**. The 4% rule that works for 30-year retirements fails for 75+ year UBI programs. A withdrawal rate of 2% or below - half the traditional rule - is necessary for high-confidence sustainability (85%+), with rates below 2% needed for 90%+ confidence.

---

## Appendix: Key Thresholds

| Metric | Threshold | Notes |
|--------|-----------|-------|
| Minimum per-capita for $1000/mo | ~$500K | 90%+ success |
| Sustainable withdrawal rate | ≤2% | 85%+ success |
| Alaska-model per capita | $110K | $133/month, 98%+ success |
| Norway sustainable UBI | ~$500/month | 97.5% success |
| US fund for $500/mo | $75-100T | Extrapolated for 85-95% success |

---

*Research conducted using the UBI Sovereign Wealth Fund Simulator. 200 Monte Carlo simulations per parameter combination. Standard errors of approximately ±3-4 percentage points apply to all reported success rates.*
