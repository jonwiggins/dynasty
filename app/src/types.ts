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
  lifeExpectancyGrowth: number; // Years added per year (e.g., 0.1 = 1 year per decade)

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

export interface ParamConfig {
  min: number;
  max: number;
  step: number;
  label: string;
  format: (v: number) => string;
}

const formatCurrency = (v: number) => `$${(v / 1_000_000).toFixed(1)}M`;
const formatPercent = (v: number) => `${(v * 100).toFixed(1)}%`;
const formatNumber = (v: number) => v.toFixed(1);
const formatInt = (v: number) => v.toFixed(0);
const formatIncome = (v: number) => `$${(v / 1000).toFixed(0)}K`;

export const PARAM_CONFIGS: Partial<Record<keyof SimulationParams, ParamConfig>> = {
  initialFund: { min: 500_000, max: 10_000_000, step: 500_000, label: 'Initial Fund', format: formatCurrency },
  founderAge: { min: 1, max: 50, step: 1, label: 'Founder Age', format: formatInt },
  realReturnRate: { min: 0.02, max: 0.15, step: 0.005, label: 'Real Return Rate', format: formatPercent },
  returnVolatility: { min: 0.05, max: 0.30, step: 0.01, label: 'Return Volatility', format: formatPercent },
  initialMedianIncome: { min: 40_000, max: 150_000, step: 2_000, label: 'Median Income', format: formatIncome },
  realIncomeGrowth: { min: 0, max: 0.03, step: 0.001, label: 'Real Income Growth', format: formatPercent },
  totalFertilityRate: { min: 0.5, max: 4.0, step: 0.1, label: 'Fertility Rate', format: formatNumber },
  medianMarriageAge: { min: 20, max: 40, step: 1, label: 'Marriage Age', format: formatInt },
  baseLifeExpectancy: { min: 60, max: 120, step: 1, label: 'Life Expectancy', format: formatInt },
  lifeExpectancyGrowth: { min: 0, max: 0.5, step: 0.05, label: 'Life Exp. Growth', format: (v: number) => `${(v * 10).toFixed(1)} yrs/decade` },
  maxYears: { min: 50, max: 500, step: 10, label: 'Years to Simulate', format: formatInt },
};

export const DEFAULT_PARAMS: SimulationParams = {
  // Initial conditions
  initialFund: 5_000_000,
  founderAge: 1,
  startYear: 2025,

  // Investment parameters
  realReturnRate: 0.07, // 7% real return
  returnVolatility: 0.15, // 15% standard deviation

  // Income parameters
  initialMedianIncome: 84_000,
  realIncomeGrowth: 0.008, // 0.8% real growth

  // Marriage parameters
  medianMarriageAge: 20,
  marriageAgeStdDev: 5,
  neverMarriedRate: 0.15,

  // Fertility parameters
  totalFertilityRate: 2.0,
  minChildbearingAge: 20,
  maxChildbearingAge: 45,
  firstChildDelay: 2,

  // Mortality
  baseLifeExpectancy: 78, // Current US life expectancy
  lifeExpectancyStdDev: 12,
  lifeExpectancyGrowth: 0.15, // ~1.5 years per decade (historical average)

  // Eligibility
  eligibilityAge: 18,

  // Simulation settings
  maxYears: 200,
  numSimulations: 100,
};
