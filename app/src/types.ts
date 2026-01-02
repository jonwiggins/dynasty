// Dynasty Fund Simulation Types

export interface Person {
  id: number;
  birthYear: number;
  deathYear: number | null;
  marriageYear: number | null;
  spouseId: number | null;
  parentIds: [number, number] | null; // [mother, father] or null for founder/spouse
  gender: 'male' | 'female';
  generation: number;
}

export interface SimulationParams {
  // Initial conditions
  initialFund: number;
  founderAge: number;
  startYear: number;

  // Investment parameters
  realReturnRate: number; // Annual real (inflation-adjusted) return
  returnVolatility: number; // Standard deviation of returns

  // Income parameters
  initialMedianIncome: number;
  realIncomeGrowth: number; // Annual real growth in median income

  // Marriage parameters
  medianMarriageAge: number;
  marriageAgeStdDev: number;
  neverMarriedRate: number;

  // Fertility parameters
  totalFertilityRate: number; // Average children per woman
  minChildbearingAge: number;
  maxChildbearingAge: number;
  firstChildDelay: number; // Years after marriage

  // Mortality (simplified - uses base life expectancy)
  baseLifeExpectancy: number;
  lifeExpectancyStdDev: number;

  // Eligibility
  eligibilityAge: number; // Age to start receiving payouts

  // Simulation settings
  maxYears: number;
  numSimulations: number;
}

export interface YearlySnapshot {
  year: number;
  fundBalance: number;
  numEligible: number;
  totalPayout: number;
  medianIncome: number;
  investmentReturn: number;
  withdrawalRate: number;
  births: number;
  deaths: number;
  marriages: number;
}

export interface SimulationResult {
  params: SimulationParams;
  snapshots: YearlySnapshot[];
  family: Person[];
  ruinYear: number | null;
  finalFund: number;
  peakPopulation: number;
  totalGenerations: number;
}

export interface AggregateResults {
  params: SimulationParams;
  successRate: number;
  medianRuinYear: number | null;
  percentileResults: {
    p5: YearlySnapshot[];
    p25: YearlySnapshot[];
    p50: YearlySnapshot[];
    p75: YearlySnapshot[];
    p95: YearlySnapshot[];
  };
  allResults: SimulationResult[];
}

export const DEFAULT_PARAMS: SimulationParams = {
  // Initial conditions
  initialFund: 5_000_000,
  founderAge: 30,
  startYear: 2025,

  // Investment parameters
  realReturnRate: 0.07, // 7% real return
  returnVolatility: 0.15, // 15% standard deviation

  // Income parameters
  initialMedianIncome: 84_000,
  realIncomeGrowth: 0.008, // 0.8% real growth

  // Marriage parameters
  medianMarriageAge: 29,
  marriageAgeStdDev: 5,
  neverMarriedRate: 0.15,

  // Fertility parameters
  totalFertilityRate: 1.6,
  minChildbearingAge: 20,
  maxChildbearingAge: 45,
  firstChildDelay: 2,

  // Mortality
  baseLifeExpectancy: 80,
  lifeExpectancyStdDev: 10,

  // Eligibility
  eligibilityAge: 18,

  // Simulation settings
  maxYears: 200,
  numSimulations: 100,
};
