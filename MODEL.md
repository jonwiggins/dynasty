# Dynasty Fund Mathematical Model

## Overview

This document describes the system of equations that govern a dynasty fund's sustainability over multiple generations.

## State Variables

### Fund State
- **F(t)** = Fund balance at time t (in real dollars, inflation-adjusted)

### Family State
Each family member i has:
- **birth_year(i)** = Year of birth
- **death_year(i)** = Year of death (stochastic)
- **marriage_year(i)** = Year of marriage (stochastic, may not occur)
- **spouse(i)** = Reference to spouse (if married)
- **children(i)** = Set of children
- **eligible(i, t)** = Whether member is eligible for payouts at time t

### Population State
- **N(t)** = Number of eligible beneficiaries at time t
- **M(t)** = Median U.S. income at time t (in real dollars)

## Core Equations

### 1. Fund Dynamics

The fund balance evolves according to:

```
F(t+1) = F(t) × (1 + r) - P(t)
```

Where:
- **r** = Real (inflation-adjusted) investment return rate
- **P(t)** = Total payouts at time t

### 2. Payout Calculation

Total annual payout:

```
P(t) = N(t) × M(t)
```

Where:
- **N(t)** = Number of eligible recipients
- **M(t)** = Target payout per recipient (median income)

### 3. Median Income Growth

```
M(t+1) = M(t) × (1 + g)
```

Where:
- **g** = Real growth rate of median income (~0.8% historically)

### 4. Beneficiary Population Model

The population of beneficiaries follows a discrete event model:

#### Birth Events
For each married couple (i, spouse(i)) at time t:
```
P(child_born | couple_age, existing_children) = f(age, n_children)
```

Simplified model using average children per couple:
```
Expected children = TFR (Total Fertility Rate)
Child_spacing ~ Uniform(2, 4) years
First_child_delay ~ N(2, 1) years after marriage
```

#### Marriage Events
```
P(marriage at age a) = marriage_hazard(a)
```

Using historical data:
- Median marriage age: ~29 years
- Standard deviation: ~5 years
- Never-married rate: ~15-20%

#### Death Events
```
P(death at age a) = mortality_rate(a)
```

Using SSA actuarial tables:
- q(a) = probability of dying within 1 year at age a

### 5. Eligibility Rules

A person i is eligible at time t if:
```
eligible(i, t) = (birth_year(i) ≤ t) AND (death_year(i) > t) AND (age(i, t) ≥ 18)
```

## Sustainability Condition

For long-term sustainability, the fund must satisfy:

```
E[F(t)] > 0  for all t → ∞
```

This requires:
```
r > E[growth rate of P(t)]
```

Expanding P(t) = N(t) × M(t):
```
r > E[Ṅ/N] + g
```

Where:
- **E[Ṅ/N]** = Expected growth rate of beneficiary population
- **g** = Real income growth rate

### Critical Threshold Analysis

For perpetual sustainability:
```
Initial Fund / Initial Payout > 1 / (r - population_growth - income_growth)
```

With typical values:
- r = 7% (real return)
- g = 0.8% (income growth)
- Population growth depends on TFR

If population growth = 2% per year:
```
Fund multiple needed = 1 / (0.07 - 0.02 - 0.008) = 1 / 0.042 ≈ 24×
```

So initial fund should be ~24× the initial annual payout.

## Generational Growth Model

### Exponential Family Growth

In a simplified model where each couple has k children:
- Generation 0: 1 person
- Generation 1: 2 people (+ spouse)
- Generation 2: 2 + k children
- Generation n: Approximately 2 × (k/2)^n eligible adults

For k = 2 (replacement): Geometric growth at rate (k/2) = 1 (stable)
For k = 3: Growth rate = 1.5× per generation
For k = 1.6 (current TFR): Growth rate = 0.8× per generation (declining!)

### Generation Length
Average generation length: ~30 years (based on marriage age + first child delay)

### Population Growth Rate
Annual population growth rate:
```
annual_growth = (k/2)^(1/generation_length) - 1
```

For TFR = 1.6, generation = 30 years:
```
annual_growth = (0.8)^(1/30) - 1 ≈ -0.7% per year
```

This is actually **deflationary** for the fund under current fertility rates!

## Stochastic Simulation Approach

Given the complexity, Monte Carlo simulation is recommended:

```python
for simulation in range(N_SIMULATIONS):
    fund = initial_fund
    family = [Founder(age=30)]

    for year in range(MAX_YEARS):
        # 1. Age everyone, check for deaths
        for person in family:
            if random() < mortality_rate(person.age):
                person.die()

        # 2. Check for marriages
        for person in family:
            if person.single and random() < marriage_rate(person.age):
                person.marry(new_spouse())

        # 3. Check for births
        for couple in married_couples:
            if random() < birth_rate(couple):
                family.add(new_child(couple))

        # 4. Calculate payouts
        eligible = [p for p in family if p.alive and p.age >= 18]
        payout = len(eligible) * median_income

        # 5. Update fund
        fund = fund * (1 + investment_return) - payout

        # 6. Check for ruin
        if fund <= 0:
            record_failure(year)
            break
```

## Key Parameters (Default Values)

| Parameter | Symbol | Default Value | Source |
|-----------|--------|---------------|--------|
| Real investment return | r | 7.0% | S&P 500 historical |
| Real income growth | g | 0.8% | Census Bureau |
| Total fertility rate | TFR | 1.6 | CBO projections |
| Median marriage age | μ_m | 29 | Census Bureau |
| Marriage std dev | σ_m | 5 | Census Bureau |
| Never-married rate | p_nm | 15% | Census Bureau |
| Initial median income | M₀ | $84,000 | Census Bureau 2024 |
| Mortality | q(a) | SSA tables | SSA actuarial |

## Sensitivity Analysis Dimensions

Key variables to vary in simulation:
1. **Initial fund size** - What size guarantees 95% success over 200 years?
2. **Investment return** - How sensitive is success to market performance?
3. **Fertility rate** - Higher TFR dramatically increases required fund size
4. **Payout fraction** - What if we pay less than full median income?
5. **Eligibility rules** - What if we cap beneficiaries or use means testing?

## Extensions

### Payout Smoothing
Instead of paying M(t) exactly, use smoothed payouts:
```
P_smooth(t) = α × P(t) + (1-α) × P_smooth(t-1)
```

### Dynamic Payout Rules
Adjust payouts based on fund performance:
```
P(t) = min(target_payout, β × F(t))
```

### Beneficiary Caps
Limit eligible beneficiaries to prevent exponential growth:
```
N_effective(t) = min(N(t), N_max)
```

### Means Testing
Only pay beneficiaries below an income threshold.
