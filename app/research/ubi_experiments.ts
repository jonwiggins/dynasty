/**
 * UBI Sovereign Wealth Fund Research Experiments
 *
 * Systematic analysis of UBI fund sustainability across key parameters.
 * Run with: npx tsx research/ubi_experiments.ts
 */

import { runUBIMultipleSimulations } from '../src/ubi-simulation';
import type { UBISimulationParams } from '../src/ubi-types';
import { UBI_DEFAULT_PARAMS } from '../src/ubi-types';
import * as fs from 'fs';

const RESEARCH_SIMULATIONS = 200;

interface ExperimentResult {
  name: string;
  params: Partial<UBISimulationParams>;
  successRate: number;
  medianRuinYear: number | null;
  avgFinalFund: number;
  avgFinalPopulation: number;
}

function runExperiment(
  name: string,
  paramOverrides: Partial<UBISimulationParams>
): ExperimentResult {
  const params: UBISimulationParams = {
    ...UBI_DEFAULT_PARAMS,
    numSimulations: RESEARCH_SIMULATIONS,
    ...paramOverrides,
  };

  const results = runUBIMultipleSimulations(params);

  const avgFinalFund = results.allResults.reduce(
    (sum, r) => sum + r.finalFund, 0
  ) / results.allResults.length;

  const avgFinalPopulation = results.allResults.reduce(
    (sum, r) => sum + (r.snapshots[r.snapshots.length - 1]?.population || 0), 0
  ) / results.allResults.length;

  return {
    name,
    params: paramOverrides,
    successRate: results.successRate,
    medianRuinYear: results.medianRuinYear,
    avgFinalFund,
    avgFinalPopulation,
  };
}

const allResults: Record<string, ExperimentResult[]> = {};

console.log('\n🔬 UBI SOVEREIGN WEALTH FUND RESEARCH');
console.log('=====================================\n');

// ============================================================================
// EXPERIMENT 1: Per-Capita Fund Requirements
// ============================================================================
console.log('📊 EXPERIMENT 1: Per-Capita Fund Requirements');
console.log('Finding fund size needed for various success rates...\n');

allResults['perCapitaFund'] = [];

// Test different per-capita fund amounts ($10K to $200K per person)
// With 50M population, this translates to $0.5T to $10T total fund
const perCapitaAmounts = [10_000, 20_000, 30_000, 40_000, 50_000, 75_000, 100_000, 150_000, 200_000];

for (const perCapita of perCapitaAmounts) {
  const totalFund = perCapita * 50_000_000; // 50M population
  process.stdout.write(`  $${(perCapita/1000).toFixed(0)}K per capita ($${(totalFund/1e12).toFixed(1)}T total)... `);
  const result = runExperiment(`perCapita_${perCapita/1000}K`, {
    initialFund: totalFund,
    initialPopulation: 50_000_000,
    ubiMonthlyAmount: 1000,
  });
  console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
  allResults['perCapitaFund'].push(result);
}

// ============================================================================
// EXPERIMENT 2: Sustainable UBI Amount
// ============================================================================
console.log('\n📊 EXPERIMENT 2: Sustainable UBI Amount');
console.log('What monthly UBI can a $2T fund sustain for 50M people?\n');

allResults['ubiAmount'] = [];

const ubiAmounts = [200, 400, 600, 800, 1000, 1200, 1500, 2000, 2500, 3000];

for (const ubi of ubiAmounts) {
  process.stdout.write(`  $${ubi}/month ($${ubi * 12}/year)... `);
  const result = runExperiment(`ubi_${ubi}`, {
    initialFund: 2_000_000_000_000, // $2T
    initialPopulation: 50_000_000,
    ubiMonthlyAmount: ubi,
  });
  console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
  allResults['ubiAmount'].push(result);
}

// ============================================================================
// EXPERIMENT 3: Safe Withdrawal Rate
// ============================================================================
console.log('\n📊 EXPERIMENT 3: UBI Safe Withdrawal Rate');
console.log('Testing various withdrawal rates (annual UBI cost / fund)...\n');

allResults['withdrawalRate'] = [];

// Calculate fund sizes that produce specific withdrawal rates for $1000/mo UBI with 50M eligible
// Annual cost = 50M * 0.775 (eligible ratio) * $12,000 = ~$465B
// For 2% WR: Fund = $465B / 0.02 = $23.25T
// For 10% WR: Fund = $465B / 0.10 = $4.65T

const withdrawalRates = [0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.10, 0.15, 0.20];

for (const wr of withdrawalRates) {
  // Calculate fund needed for this withdrawal rate with $1000/mo UBI
  const eligibleRatio = (80 - 18) / 80; // ~0.775
  const annualCost = 50_000_000 * eligibleRatio * 12_000;
  const requiredFund = annualCost / wr;

  process.stdout.write(`  ${(wr * 100).toFixed(1)}% WR ($${(requiredFund/1e12).toFixed(1)}T fund)... `);
  const result = runExperiment(`wr_${(wr * 100).toFixed(0)}pct`, {
    initialFund: requiredFund,
    initialPopulation: 50_000_000,
    ubiMonthlyAmount: 1000,
  });
  console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
  allResults['withdrawalRate'].push(result);
}

// ============================================================================
// EXPERIMENT 4: Population Growth Impact
// ============================================================================
console.log('\n📊 EXPERIMENT 4: Population Growth Impact');
console.log('How does population growth rate affect sustainability?\n');

allResults['populationGrowth'] = [];

const growthRates = [-0.01, -0.005, 0, 0.005, 0.01, 0.015, 0.02, 0.025, 0.03];

for (const growth of growthRates) {
  process.stdout.write(`  ${(growth * 100).toFixed(1)}% annual growth... `);
  const result = runExperiment(`growth_${(growth * 100).toFixed(1)}pct`, {
    initialFund: 2_000_000_000_000,
    initialPopulation: 50_000_000,
    populationGrowthRate: growth,
    ubiMonthlyAmount: 1000,
  });
  console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
  allResults['populationGrowth'].push(result);
}

// ============================================================================
// EXPERIMENT 5: Volatility Impact
// ============================================================================
console.log('\n📊 EXPERIMENT 5: Volatility Impact');
console.log('Is volatility reduction critical for UBI funds?\n');

allResults['volatility'] = [];

const volatilities = [0.05, 0.08, 0.10, 0.12, 0.15, 0.18, 0.20, 0.25, 0.30];

for (const vol of volatilities) {
  process.stdout.write(`  ${(vol * 100).toFixed(0)}% volatility... `);
  const result = runExperiment(`vol_${(vol * 100).toFixed(0)}pct`, {
    initialFund: 2_000_000_000_000,
    initialPopulation: 50_000_000,
    returnVolatility: vol,
    ubiMonthlyAmount: 1000,
  });
  console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
  allResults['volatility'].push(result);
}

// ============================================================================
// EXPERIMENT 6: Eligibility Age Effects
// ============================================================================
console.log('\n📊 EXPERIMENT 6: Eligibility Age Effects');
console.log('Universal (0+) vs Adult-only (18+) vs Senior (65+)...\n');

allResults['eligibilityAge'] = [];

const eligibilityAges = [0, 5, 12, 18, 21, 25, 55, 65];

for (const age of eligibilityAges) {
  process.stdout.write(`  Age ${age}+... `);
  const result = runExperiment(`eligibility_${age}`, {
    initialFund: 2_000_000_000_000,
    initialPopulation: 50_000_000,
    eligibilityAge: age,
    ubiMonthlyAmount: 1000,
  });
  console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
  allResults['eligibilityAge'].push(result);
}

// ============================================================================
// EXPERIMENT 7: UBI Real Growth
// ============================================================================
console.log('\n📊 EXPERIMENT 7: UBI Real Growth Sustainability');
console.log('Can UBI payments grow with productivity?\n');

allResults['ubiGrowth'] = [];

const ubiGrowthRates = [0, 0.002, 0.005, 0.008, 0.01, 0.012, 0.015, 0.02];

for (const growth of ubiGrowthRates) {
  process.stdout.write(`  ${(growth * 100).toFixed(1)}% annual UBI growth... `);
  const result = runExperiment(`ubiGrowth_${(growth * 100).toFixed(1)}pct`, {
    initialFund: 2_000_000_000_000,
    initialPopulation: 50_000_000,
    ubiRealGrowth: growth,
    ubiMonthlyAmount: 1000,
  });
  console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
  allResults['ubiGrowth'].push(result);
}

// ============================================================================
// EXPERIMENT 8: Return Rate Requirements
// ============================================================================
console.log('\n📊 EXPERIMENT 8: Return Rate Requirements');
console.log('What return rate is needed for various success rates?\n');

allResults['returnRate'] = [];

const returnRates = [0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.10, 0.12];

for (const ret of returnRates) {
  process.stdout.write(`  ${(ret * 100).toFixed(0)}% real return... `);
  const result = runExperiment(`return_${(ret * 100).toFixed(0)}pct`, {
    initialFund: 2_000_000_000_000,
    initialPopulation: 50_000_000,
    realReturnRate: ret,
    ubiMonthlyAmount: 1000,
  });
  console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
  allResults['returnRate'].push(result);
}

// ============================================================================
// EXPERIMENT 9: Volatility-Return Interaction
// ============================================================================
console.log('\n📊 EXPERIMENT 9: Volatility-Return Interaction');
console.log('What return compensates for higher volatility?\n');

allResults['volReturnMatrix'] = [];

const volLevels = [0.08, 0.12, 0.16, 0.20];
const retLevels = [0.04, 0.05, 0.06, 0.07, 0.08];

for (const vol of volLevels) {
  console.log(`  Volatility ${(vol * 100).toFixed(0)}%:`);
  for (const ret of retLevels) {
    process.stdout.write(`    Return ${(ret * 100).toFixed(0)}%... `);
    const result = runExperiment(`vol${(vol*100).toFixed(0)}_ret${(ret*100).toFixed(0)}`, {
      initialFund: 2_000_000_000_000,
      initialPopulation: 50_000_000,
      returnVolatility: vol,
      realReturnRate: ret,
      ubiMonthlyAmount: 1000,
    });
    console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
    allResults['volReturnMatrix'].push(result);
  }
}

// ============================================================================
// EXPERIMENT 10: Real-World Benchmarks
// ============================================================================
console.log('\n📊 EXPERIMENT 10: Real-World Benchmarks');
console.log('Testing Norway-like and Alaska-like configurations...\n');

allResults['realWorld'] = [];

// Norway: $1.4T fund, 5.5M people, ~$255K per capita
// They spend ~3% annually, mostly on government budget (not direct UBI)
process.stdout.write('  Norway-scale ($255K/capita, 3% spend, $1000/mo UBI)... ');
const norwayResult = runExperiment('norway_scale', {
  initialFund: 255_000 * 5_500_000, // ~$1.4T
  initialPopulation: 5_500_000,
  ubiMonthlyAmount: 1000,
  populationGrowthRate: 0.005, // Norway ~0.5% growth
  realReturnRate: 0.05,
  returnVolatility: 0.12,
});
console.log(`Success: ${(norwayResult.successRate * 100).toFixed(1)}%`);
allResults['realWorld'].push(norwayResult);

// Alaska: $80B fund, 730K people, ~$110K per capita
// They pay ~$1600/year dividend
process.stdout.write('  Alaska-scale ($110K/capita, $133/mo UBI)... ');
const alaskaResult = runExperiment('alaska_scale', {
  initialFund: 110_000 * 730_000, // ~$80B
  initialPopulation: 730_000,
  ubiMonthlyAmount: 133, // ~$1600/year
  populationGrowthRate: 0.005,
  realReturnRate: 0.05,
  returnVolatility: 0.12,
});
console.log(`Success: ${(alaskaResult.successRate * 100).toFixed(1)}%`);
allResults['realWorld'].push(alaskaResult);

// US-scale: What fund would be needed for $1000/mo UBI to 330M people?
process.stdout.write('  US-scale (330M people, $1000/mo UBI, $40K/capita fund)... ');
const usResult = runExperiment('us_scale', {
  initialFund: 40_000 * 330_000_000, // $13.2T
  initialPopulation: 330_000_000,
  ubiMonthlyAmount: 1000,
  populationGrowthRate: 0.005,
  realReturnRate: 0.05,
  returnVolatility: 0.12,
});
console.log(`Success: ${(usResult.successRate * 100).toFixed(1)}%`);
allResults['realWorld'].push(usResult);

// ============================================================================
// Save Results
// ============================================================================
console.log('\n\n💾 Saving results...');

const outputDir = './research/results';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = `${outputDir}/ubi_experiments_${timestamp}.json`;
fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
console.log(`Results saved to: ${outputPath}`);

// ============================================================================
// Summary Statistics
// ============================================================================
console.log('\n\n📈 KEY FINDINGS SUMMARY');
console.log('========================\n');

// Per-capita fund threshold
const fund90 = allResults['perCapitaFund'].find(r => r.successRate >= 0.90);
const fund75 = allResults['perCapitaFund'].find(r => r.successRate >= 0.75);
console.log('Per-Capita Fund Requirements:');
console.log(`  75% success: ~$${fund75 ? ((fund75.params.initialFund as number) / 50_000_000 / 1000).toFixed(0) : '>200'}K per capita`);
console.log(`  90% success: ~$${fund90 ? ((fund90.params.initialFund as number) / 50_000_000 / 1000).toFixed(0) : '>200'}K per capita`);

// Safe withdrawal rate
const swr90 = allResults['withdrawalRate'].find(r => r.successRate >= 0.90);
const swr75 = allResults['withdrawalRate'].find(r => r.successRate >= 0.75);
console.log('\nSafe Withdrawal Rate:');
console.log(`  75% success: ~${swr75 ? (Object.values(swr75.params)[0] as number * 100).toFixed(1) : '<2'}%`);
console.log(`  90% success: ~${swr90 ? (Object.values(swr90.params)[0] as number * 100).toFixed(1) : '<2'}%`);

// Volatility impact
const lowVol = allResults['volatility'].find(r => (r.params.returnVolatility as number) === 0.08);
const highVol = allResults['volatility'].find(r => (r.params.returnVolatility as number) === 0.20);
console.log('\nVolatility Impact (at 5% return):');
console.log(`  8% volatility: ${lowVol ? (lowVol.successRate * 100).toFixed(0) : 'N/A'}% success`);
console.log(`  20% volatility: ${highVol ? (highVol.successRate * 100).toFixed(0) : 'N/A'}% success`);

// Population growth impact
const noGrowth = allResults['populationGrowth'].find(r => (r.params.populationGrowthRate as number) === 0);
const highGrowth = allResults['populationGrowth'].find(r => (r.params.populationGrowthRate as number) === 0.02);
console.log('\nPopulation Growth Impact:');
console.log(`  0% growth: ${noGrowth ? (noGrowth.successRate * 100).toFixed(0) : 'N/A'}% success`);
console.log(`  2% growth: ${highGrowth ? (highGrowth.successRate * 100).toFixed(0) : 'N/A'}% success`);

console.log('\n\n✅ UBI experiments complete!\n');
