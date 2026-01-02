import type {
  Person,
  SimulationParams,
  YearlySnapshot,
  SimulationResult,
  AggregateResults,
} from './types';

export type { SimulationResult };

// Random number utilities
function randomNormal(mean: number, stdDev: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + stdDev * z;
}

// Simplified mortality model based on Gompertz-Makeham law
function getMortalityRate(age: number, _params: SimulationParams): number {
  // Simplified: probability of death increases exponentially with age
  const a = 0.0001; // Base mortality
  const b = 0.085; // Aging rate
  return Math.min(1, a * Math.exp(b * age));
}

// Get probability of marriage at a given age
function getMarriageHazard(
  age: number,
  params: SimulationParams,
  alreadyMarried: boolean
): number {
  if (alreadyMarried || age < 18) return 0;

  // Normal distribution centered at median marriage age
  const z = (age - params.medianMarriageAge) / params.marriageAgeStdDev;
  const pdf = Math.exp(-0.5 * z * z) / (params.marriageAgeStdDev * Math.sqrt(2 * Math.PI));

  // Scale by never-married rate and convert to hazard
  // Higher multiplier to ensure most people get married
  return Math.min(0.3, pdf * (1 - params.neverMarriedRate) * 3.0);
}

// Get probability of birth for a married woman
function getBirthProbability(
  age: number,
  yearsMarried: number,
  numChildren: number,
  params: SimulationParams
): number {
  if (age < params.minChildbearingAge || age > params.maxChildbearingAge) return 0;
  if (yearsMarried < params.firstChildDelay && numChildren === 0) return 0;

  // Calculate target children per woman (TFR)
  const targetChildren = params.totalFertilityRate;

  // Stop having children after reaching target * 1.5
  if (numChildren >= Math.ceil(targetChildren * 1.5)) return 0;

  // Higher base probability to ensure TFR is achieved
  // We want ~TFR children over the fertile years, with higher probability early
  const fertilePeriod = params.maxChildbearingAge - params.minChildbearingAge;
  const baseProbability = (targetChildren * 1.5) / fertilePeriod;

  // Adjust for age (fertility peaks around 25-30)
  const peakAge = 28;
  const ageFactor = Math.exp(-0.5 * Math.pow((age - peakAge) / 10, 2));

  // Reduce probability as more children are born (spacing effect)
  const childFactor = 1 / (1 + numChildren * 0.3);

  return Math.min(0.4, baseProbability * ageFactor * childFactor);
}

let nextPersonId = 0;

function createPerson(
  birthYear: number,
  gender: 'male' | 'female',
  generation: number,
  parentIds: [number, number] | null = null,
  params: SimulationParams
): Person {
  // Calculate life expectancy at birth, accounting for improvements over time
  // Life expectancy grows each year from the start year
  const yearsFromStart = Math.max(0, birthYear - params.startYear);
  const adjustedLifeExpectancy = params.baseLifeExpectancy +
    (yearsFromStart * params.lifeExpectancyGrowth);

  // Generate death year based on life expectancy
  const lifeSpan = Math.max(
    1,
    randomNormal(adjustedLifeExpectancy, params.lifeExpectancyStdDev)
  );

  return {
    id: nextPersonId++,
    birthYear,
    deathYear: birthYear + Math.round(lifeSpan),
    marriageYear: null,
    spouseId: null,
    parentIds,
    gender,
    generation,
  };
}

function createSpouse(
  marriageYear: number,
  partnerAge: number,
  gender: 'male' | 'female',
  generation: number,
  params: SimulationParams
): Person {
  // Spouse is typically similar age (within a few years)
  const ageDiff = randomNormal(gender === 'female' ? 2 : -2, 3);
  const spouseAge = Math.max(18, partnerAge + ageDiff);
  const birthYear = marriageYear - Math.round(spouseAge);

  const spouse = createPerson(birthYear, gender, generation, null, params);
  spouse.marriageYear = marriageYear;

  return spouse;
}

export function runSingleSimulation(params: SimulationParams, debug = false): SimulationResult {
  nextPersonId = 0;

  const family: Person[] = [];
  const snapshots: YearlySnapshot[] = [];

  if (debug) console.log('=== Starting simulation ===');

  // Create founder
  const founderBirthYear = params.startYear - params.founderAge;
  const founder = createPerson(
    founderBirthYear,
    Math.random() < 0.5 ? 'male' : 'female',
    0,
    null,
    params
  );
  family.push(founder);

  if (debug) console.log(`Founder: ID=${founder.id}, gender=${founder.gender}, born=${founder.birthYear}, dies=${founder.deathYear}`);

  let fundBalance = params.initialFund;
  let medianIncome = params.initialMedianIncome;
  let ruinYear: number | null = null;
  let peakPopulation = 0;
  let maxGeneration = 0;

  // Main simulation loop
  for (let year = params.startYear; year < params.startYear + params.maxYears; year++) {
    let births = 0;
    let deaths = 0;
    let marriages = 0;

    // Get people alive at start of year (includes those who will die this year)
    const livingPeople = family.filter(
      (p) => p.deathYear === null || p.deathYear >= year
    );

    // Process each living person
    for (const person of livingPeople) {
      const age = year - person.birthYear;

      // Check for death this year
      if (person.deathYear !== null && person.deathYear === year) {
        deaths++;
        continue; // Skip further processing for this person
      }

      // Check for marriage (if single and not already checked)
      if (person.marriageYear === null && person.spouseId === null) {
        if (Math.random() < getMarriageHazard(age, params, false)) {
          person.marriageYear = year;

          // Create spouse
          const spouseGender = person.gender === 'male' ? 'female' : 'male';
          const spouse = createSpouse(year, age, spouseGender, person.generation, params);
          spouse.spouseId = person.id;
          person.spouseId = spouse.id;
          family.push(spouse);
          marriages++;
          if (debug) console.log(`Year ${year}: Marriage! Person ID=${person.id} (${person.gender}, gen ${person.generation}) married spouse ID=${spouse.id} (${spouse.gender}, age ${year - spouse.birthYear})`);
        }
      }
    }

    // Check for births (separate loop to avoid modification during iteration)
    const marriedWomen = family.filter((p) => {
      if (p.gender !== 'female') return false;
      if (p.marriageYear === null || p.marriageYear > year) return false;
      if (p.deathYear !== null && p.deathYear <= year) return false;
      // Also check spouse is alive
      const spouse = family.find((s) => s.id === p.spouseId);
      if (spouse && spouse.deathYear !== null && spouse.deathYear <= year) return false;

      const age = year - p.birthYear;
      return age >= params.minChildbearingAge && age <= params.maxChildbearingAge;
    });

    if (debug && year <= params.startYear + 50) {
      const femalesInFamily = family.filter(p => p.gender === 'female').length;
      const marriedFemales = family.filter(p => p.gender === 'female' && p.marriageYear !== null && p.marriageYear <= year).length;
      console.log(`Year ${year}: ${femalesInFamily} females in family, ${marriedFemales} married, ${marriedWomen.length} eligible for birth`);
    }

    for (const woman of marriedWomen) {
      const age = year - woman.birthYear;
      const yearsMarried = year - (woman.marriageYear || year);
      const existingChildren = family.filter(
        (p) => p.parentIds && p.parentIds[0] === woman.id
      ).length;

      const birthProb = getBirthProbability(age, yearsMarried, existingChildren, params);
      if (debug && birthProb > 0 && year <= params.startYear + 50) {
        console.log(`  Woman ID=${woman.id}, age=${age}, yearsMarried=${yearsMarried}, children=${existingChildren}, birthProb=${birthProb.toFixed(3)}`);
      }

      if (Math.random() < birthProb) {
        const childGender = Math.random() < 0.5 ? 'male' : 'female';
        const child = createPerson(
          year,
          childGender,
          woman.generation + 1,
          [woman.id, woman.spouseId!],
          params
        );
        family.push(child);
        births++;
        maxGeneration = Math.max(maxGeneration, child.generation);
        if (debug) console.log(`Year ${year}: Birth! Child ID=${child.id} (${childGender}, gen ${child.generation}) to mother ID=${woman.id}`);
      }
    }

    // Calculate eligible beneficiaries
    const eligible = family.filter((p) => {
      if (p.deathYear !== null && p.deathYear <= year) return false;
      const age = year - p.birthYear;
      return age >= params.eligibilityAge;
    });

    const numEligible = eligible.length;
    peakPopulation = Math.max(peakPopulation, numEligible);

    // Calculate payouts
    const totalPayout = numEligible * medianIncome;

    // Generate investment return (log-normal)
    const annualReturn = randomNormal(
      params.realReturnRate,
      params.returnVolatility
    );

    // Update fund
    const previousBalance = fundBalance;
    fundBalance = fundBalance * (1 + annualReturn) - totalPayout;

    // Calculate withdrawal rate
    const withdrawalRate = previousBalance > 0 ? totalPayout / previousBalance : 1;

    // Record snapshot
    snapshots.push({
      year,
      fundBalance: Math.max(0, fundBalance),
      numEligible,
      totalPayout,
      medianIncome,
      investmentReturn: annualReturn,
      withdrawalRate,
      births,
      deaths,
      marriages,
    });

    // Check for ruin
    if (fundBalance <= 0 && ruinYear === null) {
      ruinYear = year;
      // Continue simulation to track family growth
    }

    // Update median income for next year
    medianIncome = medianIncome * (1 + params.realIncomeGrowth);
  }

  return {
    params,
    snapshots,
    family,
    ruinYear,
    finalFund: Math.max(0, fundBalance),
    peakPopulation,
    totalGenerations: maxGeneration + 1,
  };
}

export function runMultipleSimulations(params: SimulationParams): AggregateResults {
  const allResults: SimulationResult[] = [];

  for (let i = 0; i < params.numSimulations; i++) {
    allResults.push(runSingleSimulation(params));
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
  const percentileResults: AggregateResults['percentileResults'] = {
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

// Helper function for deterministic single run (for visualization)
export function runDeterministicSimulation(params: SimulationParams): SimulationResult {
  // Use fixed seed behavior by setting Math.random to a seeded version
  // For simplicity, we'll just run a single simulation
  // In a real implementation, you'd use a seeded PRNG
  return runSingleSimulation(params);
}

// Calculate required initial fund for a given success rate
export function calculateRequiredFund(
  params: SimulationParams,
  targetSuccessRate: number = 0.95,
  tolerance: number = 0.02
): number {
  let low = params.initialMedianIncome * 10;
  let high = params.initialMedianIncome * 100;

  // Binary search for required fund
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const testParams = { ...params, initialFund: mid, numSimulations: 50 };
    const results = runMultipleSimulations(testParams);

    if (Math.abs(results.successRate - targetSuccessRate) < tolerance) {
      return mid;
    }

    if (results.successRate < targetSuccessRate) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}
