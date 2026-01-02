/**
 * Dynasty Fund Research Experiments
 *
 * This script runs systematic experiments to answer key research questions
 * about multi-generational fund sustainability.
 */

import { runMultipleSimulations } from '../src/simulation';
import type { SimulationParams } from '../src/types';
import { DEFAULT_PARAMS } from '../src/types';
import * as fs from 'fs';

// Simulation count for research (balanced for speed and accuracy)
const RESEARCH_SIMULATIONS = 200;

interface ExperimentResult {
  name: string;
  params: Partial<SimulationParams>;
  successRate: number;
  medianRuinYear: number | null;
  avgFinalFund: number;
}

function runExperiment(
  name: string,
  paramOverrides: Partial<SimulationParams>
): ExperimentResult {
  const params: SimulationParams = {
    ...DEFAULT_PARAMS,
    numSimulations: RESEARCH_SIMULATIONS,
    ...paramOverrides,
  };

  const results = runMultipleSimulations(params);

  // Calculate average final fund
  const avgFinalFund = results.allResults.reduce(
    (sum, r) => sum + r.finalFund, 0
  ) / results.allResults.length;

  return {
    name,
    params: paramOverrides,
    successRate: results.successRate,
    medianRuinYear: results.medianRuinYear,
    avgFinalFund,
  };
}

function runExperimentSeries(
  seriesName: string,
  paramKey: keyof SimulationParams,
  values: number[],
  baseOverrides: Partial<SimulationParams> = {}
): ExperimentResult[] {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${seriesName}`);
  console.log('='.repeat(60));

  const results: ExperimentResult[] = [];

  for (const value of values) {
    const name = `${paramKey}=${value}`;
    process.stdout.write(`  ${name}... `);

    const result = runExperiment(name, {
      ...baseOverrides,
      [paramKey]: value,
    });

    console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
    results.push(result);
  }

  return results;
}

// Store all results
const allResults: Record<string, ExperimentResult[]> = {};

console.log('\n🔬 DYNASTY FUND RESEARCH EXPERIMENTS');
console.log('=====================================\n');
console.log(`Running ${RESEARCH_SIMULATIONS} simulations per data point`);
console.log(`Base parameters: $${(DEFAULT_PARAMS.initialFund/1e6).toFixed(1)}M fund, ${DEFAULT_PARAMS.maxYears} years`);

// ============================================================================
// EXPERIMENT 1: Minimum Viable Fund
// ============================================================================
console.log('\n\n📊 EXPERIMENT 1: Minimum Viable Fund Size');
console.log('Question: What initial fund is needed for various success rates?');

allResults['minViableFund'] = runExperimentSeries(
  'Fund Size vs Success Rate',
  'initialFund',
  [1_000_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000, 6_000_000, 7_000_000, 8_000_000, 10_000_000],
  { totalFertilityRate: 2.0 }
);

// ============================================================================
// EXPERIMENT 2: Fertility Rate Impact
// ============================================================================
console.log('\n\n📊 EXPERIMENT 2: The Fertility Paradox');
console.log('Question: How does TFR affect sustainability?');

allResults['fertilityImpact'] = runExperimentSeries(
  'TFR vs Success Rate',
  'totalFertilityRate',
  [1.0, 1.5, 1.8, 2.0, 2.1, 2.3, 2.5, 3.0, 3.5, 4.0],
  { initialFund: 5_000_000 }
);

// ============================================================================
// EXPERIMENT 3: Return Rate Requirements
// ============================================================================
console.log('\n\n📊 EXPERIMENT 3: Return Rate Requirements');
console.log('Question: What return rate is needed for different TFRs?');

const tfrLevels = [1.5, 2.0, 2.5, 3.0];
const returnRates = [0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10, 0.12];

allResults['returnByTFR'] = [];
for (const tfr of tfrLevels) {
  console.log(`\n  TFR = ${tfr}:`);
  for (const rate of returnRates) {
    process.stdout.write(`    return=${(rate*100).toFixed(0)}%... `);
    const result = runExperiment(`TFR${tfr}_return${rate}`, {
      totalFertilityRate: tfr,
      realReturnRate: rate,
      initialFund: 5_000_000,
    });
    console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
    allResults['returnByTFR'].push(result);
  }
}

// ============================================================================
// EXPERIMENT 4: Volatility Impact
// ============================================================================
console.log('\n\n📊 EXPERIMENT 4: Volatility vs Mean Returns');
console.log('Question: Which matters more - higher returns or lower volatility?');

// Compare: 7% return with varying volatility
allResults['volatilityImpact'] = runExperimentSeries(
  'Volatility at 7% return',
  'returnVolatility',
  [0.05, 0.10, 0.15, 0.20, 0.25, 0.30],
  { realReturnRate: 0.07, initialFund: 5_000_000 }
);

// Compare: Fixed 15% volatility with varying returns
allResults['returnImpact'] = runExperimentSeries(
  'Return rate at 15% volatility',
  'realReturnRate',
  [0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10],
  { returnVolatility: 0.15, initialFund: 5_000_000 }
);

// ============================================================================
// EXPERIMENT 5: Life Expectancy Growth
// ============================================================================
console.log('\n\n📊 EXPERIMENT 5: The Longevity Crisis');
console.log('Question: How does increasing life expectancy affect sustainability?');

allResults['longevityImpact'] = runExperimentSeries(
  'Life Expectancy Growth Rate',
  'lifeExpectancyGrowth',
  [0, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5],
  { initialFund: 5_000_000, totalFertilityRate: 2.0 }
);

// ============================================================================
// EXPERIMENT 6: Safe Withdrawal Rate
// ============================================================================
console.log('\n\n📊 EXPERIMENT 6: Dynasty Safe Withdrawal Rate');
console.log('Question: What initial withdrawal rate is sustainable?');

// Vary initial fund to effectively vary withdrawal rate
// Withdrawal rate = income / fund
const incomeLevel = 84_000; // Fixed income
const fundLevels = [1_000_000, 1_500_000, 2_000_000, 2_500_000, 3_000_000, 4_000_000, 5_000_000, 7_000_000, 10_000_000];

allResults['withdrawalRate'] = [];
console.log('\n  Initial Withdrawal Rates:');
for (const fund of fundLevels) {
  const withdrawalRate = incomeLevel / fund;
  process.stdout.write(`    ${(withdrawalRate * 100).toFixed(1)}% ($${(fund/1e6).toFixed(1)}M)... `);
  const result = runExperiment(`withdrawal_${(withdrawalRate*100).toFixed(1)}pct`, {
    initialFund: fund,
    initialMedianIncome: incomeLevel,
    totalFertilityRate: 2.0,
  });
  (result as any).withdrawalRate = withdrawalRate;
  console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
  allResults['withdrawalRate'].push(result);
}

// ============================================================================
// EXPERIMENT 7: Marriage Age Impact
// ============================================================================
console.log('\n\n📊 EXPERIMENT 7: Marriage Age as a Lever');
console.log('Question: Does delaying marriage extend fund life?');

allResults['marriageAge'] = runExperimentSeries(
  'Marriage Age',
  'medianMarriageAge',
  [20, 22, 25, 28, 30, 32, 35],
  { initialFund: 5_000_000, totalFertilityRate: 2.0 }
);

// ============================================================================
// Save Results
// ============================================================================
console.log('\n\n💾 Saving results...');

const outputDir = './research/results';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = `${outputDir}/experiments_${timestamp}.json`;
fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
console.log(`Results saved to: ${outputPath}`);

// ============================================================================
// Summary Statistics
// ============================================================================
console.log('\n\n📈 KEY FINDINGS SUMMARY');
console.log('========================\n');

// Find minimum fund for 90% success
const fundResults = allResults['minViableFund'];
const fund90 = fundResults.find(r => r.successRate >= 0.90);
const fund75 = fundResults.find(r => r.successRate >= 0.75);
console.log(`Minimum fund for 75% success: $${fund75 ? ((fund75.params.initialFund as number)/1e6).toFixed(1) : '>10'}M`);
console.log(`Minimum fund for 90% success: $${fund90 ? ((fund90.params.initialFund as number)/1e6).toFixed(1) : '>10'}M`);

// Find optimal TFR
const tfrResults = allResults['fertilityImpact'];
const bestTFR = tfrResults.reduce((best, r) => r.successRate > best.successRate ? r : best);
console.log(`\nOptimal TFR for sustainability: ${bestTFR.params.totalFertilityRate} (${(bestTFR.successRate*100).toFixed(1)}% success)`);

// Volatility vs Return comparison
const vol15 = allResults['volatilityImpact'].find(r => r.params.returnVolatility === 0.15);
const vol25 = allResults['volatilityImpact'].find(r => r.params.returnVolatility === 0.25);
if (vol15 && vol25) {
  console.log(`\nVolatility impact: 15% vol = ${(vol15.successRate*100).toFixed(1)}% success, 25% vol = ${(vol25.successRate*100).toFixed(1)}% success`);
}

// Longevity impact
const noGrowth = allResults['longevityImpact'].find(r => r.params.lifeExpectancyGrowth === 0);
const fastGrowth = allResults['longevityImpact'].find(r => r.params.lifeExpectancyGrowth === 0.3);
if (noGrowth && fastGrowth) {
  console.log(`\nLongevity crisis: 0 growth = ${(noGrowth.successRate*100).toFixed(1)}% success, 3yr/decade = ${(fastGrowth.successRate*100).toFixed(1)}% success`);
}

// Safe withdrawal rate
const wr95 = allResults['withdrawalRate'].find(r => r.successRate >= 0.95);
const wr90 = allResults['withdrawalRate'].find(r => r.successRate >= 0.90);
console.log(`\nDynasty Safe Withdrawal Rate:`);
console.log(`  95% success: ${wr95 ? ((wr95 as any).withdrawalRate * 100).toFixed(1) : '<0.8'}%`);
console.log(`  90% success: ${wr90 ? ((wr90 as any).withdrawalRate * 100).toFixed(1) : '<0.8'}%`);

console.log('\n\n✅ Experiments complete!\n');
