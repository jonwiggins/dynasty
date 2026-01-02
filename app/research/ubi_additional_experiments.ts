/**
 * Additional UBI Experiments - Filling Gaps from Initial Analysis
 *
 * Key gaps identified:
 * 1. Need larger per-capita funds to find 90% success threshold
 * 2. Need lower UBI amounts to find sustainable levels
 * 3. Need higher return scenarios
 * 4. Need combined optimization scenarios
 *
 * Run with: npx tsx research/ubi_additional_experiments.ts
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

  return {
    name,
    params: paramOverrides,
    successRate: results.successRate,
    medianRuinYear: results.medianRuinYear,
    avgFinalFund,
  };
}

const allResults: Record<string, ExperimentResult[]> = {};

console.log('\n🔬 ADDITIONAL UBI EXPERIMENTS');
console.log('==============================\n');

// ============================================================================
// EXPERIMENT A: Larger Per-Capita Funds (Finding 90%+ Threshold)
// ============================================================================
console.log('📊 EXPERIMENT A: Larger Per-Capita Funds');
console.log('Finding fund size for 90%+ success with $1000/mo UBI...\n');

allResults['largerFunds'] = [];

const largerPerCapita = [250_000, 300_000, 350_000, 400_000, 500_000, 600_000, 750_000, 1_000_000];

for (const perCapita of largerPerCapita) {
  const totalFund = perCapita * 50_000_000;
  process.stdout.write(`  $${(perCapita/1000).toFixed(0)}K per capita ($${(totalFund/1e12).toFixed(1)}T)... `);
  const result = runExperiment(`perCapita_${perCapita/1000}K`, {
    initialFund: totalFund,
    initialPopulation: 50_000_000,
    ubiMonthlyAmount: 1000,
    realReturnRate: 0.05,
    returnVolatility: 0.12,
  });
  console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
  allResults['largerFunds'].push(result);
}

// ============================================================================
// EXPERIMENT B: Sustainable UBI Amounts with Various Fund Sizes
// ============================================================================
console.log('\n📊 EXPERIMENT B: Sustainable UBI at Different Fund Sizes');
console.log('What UBI is sustainable at each fund level?\n');

allResults['sustainableUBI'] = [];

// Test different fund sizes with different UBI amounts
const fundPerCapitas = [100_000, 150_000, 200_000, 300_000];
const ubiLevels = [100, 200, 300, 500, 750, 1000];

for (const fundPC of fundPerCapitas) {
  console.log(`  Fund: $${(fundPC/1000).toFixed(0)}K per capita`);
  for (const ubi of ubiLevels) {
    process.stdout.write(`    UBI $${ubi}/mo... `);
    const result = runExperiment(`fund${fundPC/1000}K_ubi${ubi}`, {
      initialFund: fundPC * 50_000_000,
      initialPopulation: 50_000_000,
      ubiMonthlyAmount: ubi,
      realReturnRate: 0.05,
      returnVolatility: 0.12,
    });
    console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
    allResults['sustainableUBI'].push(result);
  }
}

// ============================================================================
// EXPERIMENT C: Higher Return Scenarios
// ============================================================================
console.log('\n📊 EXPERIMENT C: Higher Return Scenarios');
console.log('What if we achieve 7-10% real returns?\n');

allResults['higherReturns'] = [];

const highReturns = [0.06, 0.07, 0.08, 0.09, 0.10];
const fundSizes = [100_000, 150_000, 200_000]; // per capita

for (const fundPC of fundSizes) {
  console.log(`  Fund: $${(fundPC/1000).toFixed(0)}K per capita, $1000/mo UBI`);
  for (const ret of highReturns) {
    process.stdout.write(`    ${(ret * 100).toFixed(0)}% return... `);
    const result = runExperiment(`fund${fundPC/1000}K_ret${(ret*100).toFixed(0)}`, {
      initialFund: fundPC * 50_000_000,
      initialPopulation: 50_000_000,
      ubiMonthlyAmount: 1000,
      realReturnRate: ret,
      returnVolatility: 0.12,
    });
    console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
    allResults['higherReturns'].push(result);
  }
}

// ============================================================================
// EXPERIMENT D: Low Volatility + High Return Combinations
// ============================================================================
console.log('\n📊 EXPERIMENT D: Low Volatility + High Return');
console.log('Optimal investment strategies...\n');

allResults['lowVolHighRet'] = [];

const volatilities = [0.06, 0.08, 0.10, 0.12];
const returns = [0.05, 0.06, 0.07, 0.08];

for (const vol of volatilities) {
  console.log(`  Volatility ${(vol * 100).toFixed(0)}%:`);
  for (const ret of returns) {
    process.stdout.write(`    Return ${(ret * 100).toFixed(0)}%... `);
    const result = runExperiment(`vol${(vol*100).toFixed(0)}_ret${(ret*100).toFixed(0)}`, {
      initialFund: 200_000 * 50_000_000, // $200K per capita
      initialPopulation: 50_000_000,
      ubiMonthlyAmount: 1000,
      realReturnRate: ret,
      returnVolatility: vol,
    });
    console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
    allResults['lowVolHighRet'].push(result);
  }
}

// ============================================================================
// EXPERIMENT E: Realistic Country Scenarios
// ============================================================================
console.log('\n📊 EXPERIMENT E: Realistic Country Scenarios');
console.log('Modeling actual wealth funds with various UBI levels...\n');

allResults['countryScenarios'] = [];

// Norway: 5.5M people, $1.4T fund
console.log('  Norway (5.5M people, $1.4T fund):');
const norwayUBIs = [250, 500, 750, 1000, 1500, 2000];
for (const ubi of norwayUBIs) {
  process.stdout.write(`    $${ubi}/mo UBI... `);
  const result = runExperiment(`norway_ubi${ubi}`, {
    initialFund: 1_400_000_000_000,
    initialPopulation: 5_500_000,
    ubiMonthlyAmount: ubi,
    populationGrowthRate: 0.005,
    realReturnRate: 0.05,
    returnVolatility: 0.10, // Conservative strategy
  });
  console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
  allResults['countryScenarios'].push(result);
}

// Saudi Arabia: 35M people, ~$900B fund (PIF)
console.log('  Saudi Arabia (35M people, ~$900B fund):');
const saudiUBIs = [100, 200, 300, 500];
for (const ubi of saudiUBIs) {
  process.stdout.write(`    $${ubi}/mo UBI... `);
  const result = runExperiment(`saudi_ubi${ubi}`, {
    initialFund: 900_000_000_000,
    initialPopulation: 35_000_000,
    ubiMonthlyAmount: ubi,
    populationGrowthRate: 0.015, // Higher growth
    realReturnRate: 0.06,
    returnVolatility: 0.15,
  });
  console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
  allResults['countryScenarios'].push(result);
}

// US: 330M people, what fund size needed?
console.log('  USA (330M people, various fund sizes, $500/mo UBI):');
const usFundTrillions = [10, 15, 20, 25, 30, 40, 50];
for (const fund of usFundTrillions) {
  process.stdout.write(`    $${fund}T fund... `);
  const result = runExperiment(`us_fund${fund}T`, {
    initialFund: fund * 1_000_000_000_000,
    initialPopulation: 330_000_000,
    ubiMonthlyAmount: 500, // More modest UBI
    populationGrowthRate: 0.005,
    realReturnRate: 0.05,
    returnVolatility: 0.12,
  });
  console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
  allResults['countryScenarios'].push(result);
}

// ============================================================================
// EXPERIMENT F: The "Alaska Model" Analysis
// ============================================================================
console.log('\n📊 EXPERIMENT F: Alaska Model Deep Dive');
console.log('Can Alaska-style dividends scale to larger populations?\n');

allResults['alaskaModel'] = [];

// Alaska pays ~$1600/year (~$133/month) with ~$110K per capita
// Test scaling this model
const alaskaScales = [
  { name: 'Alaska (actual)', pop: 730_000, perCapita: 110_000, ubi: 133 },
  { name: 'Wyoming-scale', pop: 580_000, perCapita: 110_000, ubi: 133 },
  { name: 'Montana-scale', pop: 1_100_000, perCapita: 110_000, ubi: 133 },
  { name: 'Norway-scale (Alaska model)', pop: 5_500_000, perCapita: 110_000, ubi: 133 },
  { name: 'Small nation (10M)', pop: 10_000_000, perCapita: 110_000, ubi: 133 },
  { name: 'Medium nation (50M)', pop: 50_000_000, perCapita: 110_000, ubi: 133 },
  { name: 'Large nation (100M)', pop: 100_000_000, perCapita: 110_000, ubi: 133 },
];

for (const scale of alaskaScales) {
  process.stdout.write(`  ${scale.name}... `);
  const result = runExperiment(`alaska_${scale.name.replace(/[^a-zA-Z0-9]/g, '_')}`, {
    initialFund: scale.perCapita * scale.pop,
    initialPopulation: scale.pop,
    ubiMonthlyAmount: scale.ubi,
    populationGrowthRate: 0.005,
    realReturnRate: 0.05,
    returnVolatility: 0.12,
  });
  console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
  allResults['alaskaModel'].push(result);
}

// ============================================================================
// EXPERIMENT G: Optimal Configuration Search
// ============================================================================
console.log('\n📊 EXPERIMENT G: Optimal Configurations');
console.log('Finding best parameter combinations for 90%+ success...\n');

allResults['optimal'] = [];

const scenarios = [
  {
    name: 'Conservative baseline ($200K/cap, $500/mo, 5% ret, 10% vol)',
    params: {
      initialFund: 200_000 * 50_000_000,
      initialPopulation: 50_000_000,
      ubiMonthlyAmount: 500,
      realReturnRate: 0.05,
      returnVolatility: 0.10,
    }
  },
  {
    name: 'High return ($200K/cap, $750/mo, 7% ret, 12% vol)',
    params: {
      initialFund: 200_000 * 50_000_000,
      initialPopulation: 50_000_000,
      ubiMonthlyAmount: 750,
      realReturnRate: 0.07,
      returnVolatility: 0.12,
    }
  },
  {
    name: 'Low volatility ($200K/cap, $750/mo, 5% ret, 8% vol)',
    params: {
      initialFund: 200_000 * 50_000_000,
      initialPopulation: 50_000_000,
      ubiMonthlyAmount: 750,
      realReturnRate: 0.05,
      returnVolatility: 0.08,
    }
  },
  {
    name: 'Large fund ($300K/cap, $1000/mo, 5% ret, 10% vol)',
    params: {
      initialFund: 300_000 * 50_000_000,
      initialPopulation: 50_000_000,
      ubiMonthlyAmount: 1000,
      realReturnRate: 0.05,
      returnVolatility: 0.10,
    }
  },
  {
    name: 'Maximum UBI ($500K/cap, $1500/mo, 6% ret, 10% vol)',
    params: {
      initialFund: 500_000 * 50_000_000,
      initialPopulation: 50_000_000,
      ubiMonthlyAmount: 1500,
      realReturnRate: 0.06,
      returnVolatility: 0.10,
    }
  },
  {
    name: 'Adult-only ($200K/cap, $1000/mo, 5% ret, 10% vol, 18+)',
    params: {
      initialFund: 200_000 * 50_000_000,
      initialPopulation: 50_000_000,
      ubiMonthlyAmount: 1000,
      realReturnRate: 0.05,
      returnVolatility: 0.10,
      eligibilityAge: 18,
    }
  },
  {
    name: 'Declining population ($200K/cap, $1000/mo, -0.5% growth)',
    params: {
      initialFund: 200_000 * 50_000_000,
      initialPopulation: 50_000_000,
      ubiMonthlyAmount: 1000,
      realReturnRate: 0.05,
      returnVolatility: 0.10,
      populationGrowthRate: -0.005,
    }
  },
];

for (const scenario of scenarios) {
  process.stdout.write(`  ${scenario.name}... `);
  const result = runExperiment(scenario.name, scenario.params);
  console.log(`Success: ${(result.successRate * 100).toFixed(1)}%`);
  allResults['optimal'].push(result);
}

// ============================================================================
// Save Results
// ============================================================================
console.log('\n\n💾 Saving additional results...');

const outputDir = './research/results';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = `${outputDir}/ubi_additional_experiments_${timestamp}.json`;
fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
console.log(`Results saved to: ${outputPath}`);

// ============================================================================
// Key Insights Summary
// ============================================================================
console.log('\n\n📈 KEY ADDITIONAL FINDINGS');
console.log('===========================\n');

// Find 90% success threshold for per-capita fund
const fund90 = allResults['largerFunds'].find(r => r.successRate >= 0.90);
console.log(`Fund for 90% success ($1000/mo UBI): $${fund90 ? ((fund90.params.initialFund as number) / 50_000_000 / 1000).toFixed(0) : '>1000'}K per capita`);

// Find sustainable UBI at $200K per capita
const sustainable200K = allResults['sustainableUBI']
  .filter(r => (r.params.initialFund as number) / 50_000_000 === 200_000 && r.successRate >= 0.90)
  .sort((a, b) => (b.params.ubiMonthlyAmount as number) - (a.params.ubiMonthlyAmount as number))[0];
console.log(`Sustainable UBI at $200K/capita: $${sustainable200K?.params.ubiMonthlyAmount || '<100'}/month`);

// Alaska model scalability
const alaskaLarge = allResults['alaskaModel'].find(r => r.name.includes('100M'));
console.log(`Alaska model at 100M population: ${alaskaLarge ? (alaskaLarge.successRate * 100).toFixed(0) : 'N/A'}% success`);

// Best optimal scenario
const bestOptimal = allResults['optimal'].reduce((best, r) =>
  r.successRate > best.successRate ? r : best
);
console.log(`Best optimal scenario: ${bestOptimal.name} (${(bestOptimal.successRate * 100).toFixed(0)}%)`);

console.log('\n\n✅ Additional experiments complete!\n');
