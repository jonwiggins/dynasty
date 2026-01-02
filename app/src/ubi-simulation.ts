import type {
  UBISimulationParams,
  UBIYearlySnapshot,
  UBISimulationResult,
  UBIAggregateResults,
} from './ubi-types';

export type { UBISimulationResult };

// Random number utilities
function randomNormal(mean: number, stdDev: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + stdDev * z;
}

/**
 * Calculate eligible population ratio based on life expectancy and eligibility age
 * Uses a simplified age distribution model
 */
function calculateEligibleRatio(lifeExpectancy: number, eligibilityAge: number): number {
  // Simplified: assume roughly uniform age distribution up to life expectancy
  // Eligible = (lifeExpectancy - eligibilityAge) / lifeExpectancy
  // This slightly overestimates eligibility but is a reasonable approximation
  if (eligibilityAge >= lifeExpectancy) return 0;
  return (lifeExpectancy - eligibilityAge) / lifeExpectancy;
}

/**
 * Run a single UBI fund simulation
 */
export function runUBISingleSimulation(params: UBISimulationParams): UBISimulationResult {
  const snapshots: UBIYearlySnapshot[] = [];

  let population = params.initialPopulation;
  let fundBalance = params.initialFund;
  let ubiAmount = params.ubiMonthlyAmount;
  let ruinYear: number | null = null;
  let peakPopulation = population;

  const eligibleRatio = calculateEligibleRatio(params.lifeExpectancy, params.eligibilityAge);

  // Main simulation loop
  for (let year = params.startYear; year < params.startYear + params.maxYears; year++) {
    // Calculate eligible population
    const eligiblePopulation = Math.floor(population * eligibleRatio);

    // Annual UBI cost (monthly amount * 12 * eligible population)
    const annualUBIPerPerson = ubiAmount * 12;
    const totalPayout = eligiblePopulation * annualUBIPerPerson;

    // Generate investment return (stochastic)
    const annualReturn = randomNormal(
      params.realReturnRate,
      params.returnVolatility
    );

    // Update fund
    const previousBalance = fundBalance;
    const investmentGain = fundBalance * annualReturn;
    fundBalance = fundBalance + investmentGain - totalPayout;

    // Calculate metrics
    const withdrawalRate = previousBalance > 0 ? totalPayout / previousBalance : 1;
    const perCapitaFund = population > 0 ? fundBalance / population : 0;

    // Record snapshot
    snapshots.push({
      year,
      fundBalance: Math.max(0, fundBalance),
      population: Math.round(population),
      eligiblePopulation,
      totalPayout,
      investmentReturn: annualReturn,
      withdrawalRate,
      perCapitaFund: Math.max(0, perCapitaFund),
      ubiAmount,
    });

    // Check for ruin
    if (fundBalance <= 0 && ruinYear === null) {
      ruinYear = year;
      // Continue simulation to track population growth
    }

    // Update for next year
    population = population * (1 + params.populationGrowthRate);
    peakPopulation = Math.max(peakPopulation, population);
    ubiAmount = ubiAmount * (1 + params.ubiRealGrowth);
  }

  return {
    params,
    snapshots,
    ruinYear,
    finalFund: Math.max(0, fundBalance),
    peakPopulation: Math.round(peakPopulation),
  };
}

/**
 * Run multiple simulations and aggregate results
 */
export function runUBIMultipleSimulations(params: UBISimulationParams): UBIAggregateResults {
  const allResults: UBISimulationResult[] = [];

  for (let i = 0; i < params.numSimulations; i++) {
    allResults.push(runUBISingleSimulation(params));
  }

  // Calculate success rate (fund never hit zero)
  const successCount = allResults.filter((r) => r.ruinYear === null).length;
  const successRate = successCount / params.numSimulations;

  // Calculate median ruin year (among failures)
  const ruinYears = allResults
    .filter((r) => r.ruinYear !== null)
    .map((r) => r.ruinYear!)
    .sort((a, b) => a - b);

  const medianRuinYear =
    ruinYears.length > 0 ? ruinYears[Math.floor(ruinYears.length / 2)] : null;

  // Calculate percentile fund balances over time
  const maxYears = params.maxYears;
  const percentileResults: UBIAggregateResults['percentileResults'] = {
    p5: [],
    p25: [],
    p50: [],
    p75: [],
    p95: [],
  };

  for (let yearIdx = 0; yearIdx < maxYears; yearIdx++) {
    const yearSnapshots = allResults
      .map((r) => r.snapshots[yearIdx])
      .filter((s) => s !== undefined);

    if (yearSnapshots.length === 0) continue;

    // Sort by fund balance for percentiles
    yearSnapshots.sort((a, b) => a.fundBalance - b.fundBalance);

    const getPercentile = (p: number) => {
      const idx = Math.floor((p / 100) * yearSnapshots.length);
      return yearSnapshots[Math.min(idx, yearSnapshots.length - 1)];
    };

    percentileResults.p5.push(getPercentile(5));
    percentileResults.p25.push(getPercentile(25));
    percentileResults.p50.push(getPercentile(50));
    percentileResults.p75.push(getPercentile(75));
    percentileResults.p95.push(getPercentile(95));
  }

  return {
    params,
    successRate,
    medianRuinYear,
    percentileResults,
    allResults,
  };
}

/**
 * Calculate key metrics for display
 */
export function calculateUBIMetrics(params: UBISimulationParams) {
  const eligibleRatio = calculateEligibleRatio(params.lifeExpectancy, params.eligibilityAge);
  const eligiblePopulation = params.initialPopulation * eligibleRatio;
  const annualUBICost = eligiblePopulation * params.ubiMonthlyAmount * 12;
  const initialWithdrawalRate = annualUBICost / params.initialFund;
  const perCapitaFund = params.initialFund / params.initialPopulation;
  const perCapitaFundEligible = params.initialFund / eligiblePopulation;

  // US median income for context (~$60K/year individual, ~$75K household)
  const annualUBI = params.ubiMonthlyAmount * 12;
  const ubiAsPercentOfMedian = annualUBI / 60000;

  return {
    eligiblePopulation: Math.round(eligiblePopulation),
    annualUBICost,
    initialWithdrawalRate,
    perCapitaFund,
    perCapitaFundEligible,
    annualUBI,
    ubiAsPercentOfMedian,
  };
}
