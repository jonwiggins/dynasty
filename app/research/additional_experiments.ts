/**
 * Additional Dynasty Fund Research Experiments
 *
 * Filling gaps from initial analysis:
 * 1. Larger fund sizes to find 90%+ threshold
 * 2. Volatility-return interaction
 * 3. Optimal combined scenarios
 */

import { runMultipleSimulations } from '../src/simulation';
import type { SimulationParams } from '../src/types';
import { DEFAULT_PARAMS } from '../src/types';
import * as fs from 'fs';

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

const allResults: Record<string, ExperimentResult[]> = {};

console.log('\n🔬 ADDITIONAL EXPERIMENTS');
console.log('=========================\n');

// ============================================================================
// EXPERIMENT A: Larger Fund Sizes (finding 90%+ threshold)
// ============================================================================
console.log('📊 EXPERIMENT A: Larger Fund Sizes');
console.log('Finding the 90% success threshold...\n');

allResults['largeFunds'] = [];
const largeFundSizes = [10_000_000, 12_000_000, 15_000_000, 20_000_000, 25_000_000, 30_000_000];

for (const fund of largeFundSizes) {
  process.stdout.write(`  $${(fund/1e6).toFixed(0)}M... `);
  const result = runExperiment(`fund_${fund/1e6}M`, {
    initialFund: fund,
    totalFertilityRate: 2.0,
  });
  console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
  allResults['largeFunds'].push(result);
}

// ============================================================================
// EXPERIMENT B: Volatility-Return Interaction Matrix
// ============================================================================
console.log('\n📊 EXPERIMENT B: Volatility-Return Interaction');
console.log('What return compensates for higher volatility?\n');

allResults['volReturnMatrix'] = [];
const volatilities = [0.10, 0.15, 0.20, 0.25];
const returns = [0.06, 0.07, 0.08, 0.09, 0.10, 0.12];

for (const vol of volatilities) {
  console.log(`  Volatility ${(vol*100).toFixed(0)}%:`);
  for (const ret of returns) {
    process.stdout.write(`    Return ${(ret*100).toFixed(0)}%... `);
    const result = runExperiment(`vol${vol}_ret${ret}`, {
      returnVolatility: vol,
      realReturnRate: ret,
      initialFund: 5_000_000,
      totalFertilityRate: 2.0,
    });
    console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
    allResults['volReturnMatrix'].push(result);
  }
}

// ============================================================================
// EXPERIMENT C: Optimal Scenarios
// ============================================================================
console.log('\n📊 EXPERIMENT C: Optimal Combined Scenarios');
console.log('Testing various "optimal" parameter combinations...\n');

allResults['optimalScenarios'] = [];

const scenarios = [
  {
    name: 'Baseline ($5M, TFR 2.0, 7% return, 15% vol)',
    params: { initialFund: 5_000_000, totalFertilityRate: 2.0, realReturnRate: 0.07, returnVolatility: 0.15 }
  },
  {
    name: 'Low Volatility Focus ($5M, 7% return, 10% vol)',
    params: { initialFund: 5_000_000, totalFertilityRate: 2.0, realReturnRate: 0.07, returnVolatility: 0.10 }
  },
  {
    name: 'Delayed Marriage ($5M, marriage at 30)',
    params: { initialFund: 5_000_000, totalFertilityRate: 2.0, medianMarriageAge: 30 }
  },
  {
    name: 'Shrinking Family ($5M, TFR 1.5)',
    params: { initialFund: 5_000_000, totalFertilityRate: 1.5 }
  },
  {
    name: 'Combined Optimal ($5M, TFR 1.5, marriage 30, 10% vol)',
    params: { initialFund: 5_000_000, totalFertilityRate: 1.5, medianMarriageAge: 30, returnVolatility: 0.10 }
  },
  {
    name: 'Aggressive Family ($5M, TFR 3.0, 12% return)',
    params: { initialFund: 5_000_000, totalFertilityRate: 3.0, realReturnRate: 0.12 }
  },
  {
    name: 'Conservative Wealth ($10M, TFR 2.0, 6% return, 10% vol)',
    params: { initialFund: 10_000_000, totalFertilityRate: 2.0, realReturnRate: 0.06, returnVolatility: 0.10 }
  },
  {
    name: 'Maximum Safety ($10M, TFR 1.5, marriage 30, 10% vol, 8% return)',
    params: { initialFund: 10_000_000, totalFertilityRate: 1.5, medianMarriageAge: 30, returnVolatility: 0.10, realReturnRate: 0.08 }
  },
];

for (const scenario of scenarios) {
  process.stdout.write(`  ${scenario.name}... `);
  const result = runExperiment(scenario.name, scenario.params);
  console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
  allResults['optimalScenarios'].push(result);
}

// ============================================================================
// EXPERIMENT D: Return needed for 90% success at each TFR
// ============================================================================
console.log('\n📊 EXPERIMENT D: Return Needed for 90% Success by TFR');

allResults['returnFor90'] = [];
const tfrLevels = [1.5, 2.0, 2.5, 3.0];
const returnRange = [0.06, 0.07, 0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.14, 0.15];

for (const tfr of tfrLevels) {
  console.log(`\n  TFR ${tfr}:`);
  for (const ret of returnRange) {
    process.stdout.write(`    ${(ret*100).toFixed(0)}% return... `);
    const result = runExperiment(`tfr${tfr}_ret${ret}`, {
      totalFertilityRate: tfr,
      realReturnRate: ret,
      initialFund: 5_000_000,
    });
    console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
    allResults['returnFor90'].push(result);

    // Stop if we hit 95%+ success
    if (result.successRate >= 0.95) break;
  }
}

// ============================================================================
// Save Results
// ============================================================================
console.log('\n\n💾 Saving additional results...');

const outputDir = './research/results';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = `${outputDir}/additional_experiments_${timestamp}.json`;
fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
console.log(`Results saved to: ${outputPath}`);

// ============================================================================
// Key Insights
// ============================================================================
console.log('\n\n📈 ADDITIONAL KEY FINDINGS');
console.log('===========================\n');

// Find 90% fund threshold
const fund90 = allResults['largeFunds'].find(r => r.successRate >= 0.90);
console.log(`Fund size for 90% success: $${fund90 ? ((fund90.params.initialFund as number)/1e6).toFixed(0) : '>30'}M`);

// Find optimal scenario
const bestOptimal = allResults['optimalScenarios'].reduce((best, r) =>
  r.successRate > best.successRate ? r : best
);
console.log(`Best optimal scenario: ${bestOptimal.name} (${(bestOptimal.successRate*100).toFixed(1)}%)`);

// Return needed for 90% at each TFR
console.log('\nReturn needed for 90%+ success by TFR:');
for (const tfr of tfrLevels) {
  const tfrResults = allResults['returnFor90'].filter(r =>
    r.params.totalFertilityRate === tfr && r.successRate >= 0.90
  );
  if (tfrResults.length > 0) {
    const minReturn = Math.min(...tfrResults.map(r => r.params.realReturnRate as number));
    console.log(`  TFR ${tfr}: ${(minReturn * 100).toFixed(0)}% return`);
  } else {
    console.log(`  TFR ${tfr}: >15% return needed`);
  }
}

console.log('\n\n✅ Additional experiments complete!\n');
