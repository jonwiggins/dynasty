# UBI Sovereign Wealth Fund Research Questions

## Context

Unlike dynasty funds that serve growing family trees, UBI sovereign wealth funds must sustain payments to entire national populations. This creates fundamentally different dynamics:

- **Scale**: Millions to hundreds of millions of recipients vs. dozens to thousands
- **Growth**: National demographic trends vs. family fertility rates
- **Policy levers**: Eligibility rules, UBI amounts, and population policy
- **Real-world precedents**: Norway's GPFG, Alaska's Permanent Fund, proposed UBI programs

## Research Questions

### 1. Minimum Viable Fund Per Capita
What fund size per person is required for 50%, 75%, 90%, and 95% success rates over 75 years?

**Hypothesis**: Per-capita requirements will be similar regardless of total population size.

### 2. Sustainable UBI Amount
For a given fund size, what monthly UBI amount can be sustained with high confidence?

**Hypothesis**: Sustainable UBI will be roughly 3-4% of per-capita fund value annually.

### 3. UBI Safe Withdrawal Rate
What is the "safe withdrawal rate" equivalent for UBI funds? How does it compare to the traditional 4% retirement rule?

**Hypothesis**: UBI SWR will be lower than 4% due to the perpetual (not 30-year) time horizon.

### 4. Population Growth Impact
How does population growth rate (-1% to +3%) affect fund sustainability?

**Hypothesis**: Each 1% of population growth will require roughly 1% higher returns to compensate.

### 5. Volatility vs Returns Tradeoff
Is volatility reduction more important than higher returns for UBI funds (as found for dynasty funds)?

**Hypothesis**: Yes - long time horizons amplify sequence-of-returns risk.

### 6. Eligibility Age Effects
How much does restricting eligibility to adults (18+) vs. universal (0+) improve sustainability?

**Hypothesis**: Adult-only eligibility improves success by 15-25% due to ~20% fewer recipients.

### 7. UBI Growth Sustainability
Can UBI payments grow with productivity (0.5-1% real growth), or must they stay flat?

**Hypothesis**: Even modest UBI growth significantly reduces success rates.

### 8. Real-World Benchmarking
How do our model parameters compare to real sovereign wealth funds?
- Norway GPFG: ~$1.4T for 5.5M people (~$255K/capita)
- Alaska PF: ~$80B for 730K people (~$110K/capita), pays ~$1,600/year

### 9. Critical Thresholds
What are the critical thresholds for:
- Withdrawal rate above which failure is near-certain
- Volatility above which high returns can't compensate
- Population growth that makes UBI unsustainable

### 10. Optimal Configuration
What combination of parameters maximizes UBI generosity while maintaining >90% success?

## Experimental Design

- **Simulations per data point**: 200 (standard error ~3-4%)
- **Base parameters**: $2T fund, 50M population, $1000/month UBI, 5% return, 12% volatility
- **Time horizon**: 75 years (approximately 3 generations)
- **Success criterion**: Fund balance remains positive for entire period
