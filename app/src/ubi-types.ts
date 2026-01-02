// UBI Sovereign Wealth Fund Simulation Types

export interface UBISimulationParams {
  // Population parameters
  initialPopulation: number;
  populationGrowthRate: number; // Annual growth rate (e.g., 0.005 = 0.5%)
  lifeExpectancy: number;

  // Fund parameters
  initialFund: number;
  realReturnRate: number;
  returnVolatility: number;

  // UBI parameters
  ubiMonthlyAmount: number;
  eligibilityAge: number;
  ubiRealGrowth: number; // Annual real growth in UBI amount

  // Simulation settings
  startYear: number;
  maxYears: number;
  numSimulations: number;
}

export interface UBIYearlySnapshot {
  year: number;
  fundBalance: number;
  population: number;
  eligiblePopulation: number;
  totalPayout: number;
  investmentReturn: number;
  withdrawalRate: number;
  perCapitaFund: number;
  ubiAmount: number; // Monthly UBI that year
}

export interface UBISimulationResult {
  params: UBISimulationParams;
  snapshots: UBIYearlySnapshot[];
  ruinYear: number | null;
  finalFund: number;
  peakPopulation: number;
}

export interface UBIAggregateResults {
  params: UBISimulationParams;
  successRate: number;
  medianRuinYear: number | null;
  percentileResults: {
    p5: UBIYearlySnapshot[];
    p25: UBIYearlySnapshot[];
    p50: UBIYearlySnapshot[];
    p75: UBIYearlySnapshot[];
    p95: UBIYearlySnapshot[];
  };
  allResults: UBISimulationResult[];
}

export interface UBIParamConfig {
  min: number;
  max: number;
  step: number;
  label: string;
  format: (v: number) => string;
}

const formatLargeCurrency = (v: number) => {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(0)}B`;
  return `$${(v / 1e6).toFixed(0)}M`;
};

const formatPopulation = (v: number) => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
  return `${(v / 1e3).toFixed(0)}K`;
};

const formatPercent = (v: number) => `${(v * 100).toFixed(1)}%`;
const formatInt = (v: number) => v.toFixed(0);
const formatUBI = (v: number) => `$${v.toLocaleString()}/mo`;

export const UBI_PARAM_CONFIGS: Partial<Record<keyof UBISimulationParams, UBIParamConfig>> = {
  initialPopulation: {
    min: 1_000_000,
    max: 500_000_000,
    step: 1_000_000,
    label: 'Population',
    format: formatPopulation,
  },
  populationGrowthRate: {
    min: -0.01,
    max: 0.03,
    step: 0.001,
    label: 'Population Growth',
    format: formatPercent,
  },
  lifeExpectancy: {
    min: 70,
    max: 95,
    step: 1,
    label: 'Life Expectancy',
    format: formatInt,
  },
  initialFund: {
    min: 100_000_000_000, // $100B
    max: 20_000_000_000_000, // $20T
    step: 100_000_000_000, // $100B steps
    label: 'Initial Fund',
    format: formatLargeCurrency,
  },
  realReturnRate: {
    min: 0.02,
    max: 0.12,
    step: 0.005,
    label: 'Real Return Rate',
    format: formatPercent,
  },
  returnVolatility: {
    min: 0.05,
    max: 0.30,
    step: 0.01,
    label: 'Return Volatility',
    format: formatPercent,
  },
  ubiMonthlyAmount: {
    min: 200,
    max: 3000,
    step: 50,
    label: 'UBI Amount',
    format: formatUBI,
  },
  eligibilityAge: {
    min: 0,
    max: 25,
    step: 1,
    label: 'Eligibility Age',
    format: formatInt,
  },
  ubiRealGrowth: {
    min: 0,
    max: 0.02,
    step: 0.001,
    label: 'UBI Real Growth',
    format: formatPercent,
  },
  maxYears: {
    min: 25,
    max: 200,
    step: 5,
    label: 'Years to Simulate',
    format: formatInt,
  },
};

export const UBI_DEFAULT_PARAMS: UBISimulationParams = {
  // Population parameters
  initialPopulation: 50_000_000, // 50M (medium-sized country)
  populationGrowthRate: 0.005, // 0.5% annual growth
  lifeExpectancy: 80,

  // Fund parameters
  initialFund: 2_000_000_000_000, // $2T
  realReturnRate: 0.05, // 5% real return
  returnVolatility: 0.12, // 12% volatility

  // UBI parameters
  ubiMonthlyAmount: 1000, // $1000/month
  eligibilityAge: 18,
  ubiRealGrowth: 0.005, // 0.5% real growth

  // Simulation settings
  startYear: 2025,
  maxYears: 75,
  numSimulations: 100,
};

// Utility function for formatting large numbers in charts
export const formatAxisValue = (v: number): string => {
  if (Math.abs(v) >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(0)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toLocaleString()}`;
};
