import { useMemo } from 'react';
import type { SimulationParams } from './types';
import { PARAM_CONFIGS } from './types';
import { runMultipleSimulations } from './simulation';

export interface SensitivityPoint {
  value: number;
  successRate: number;
  medianFundBalance: number;
}

export interface SensitivityResult {
  points: SensitivityPoint[];
  paramKey: keyof SimulationParams;
  label: string;
  isComputing: boolean;
}

const NUM_POINTS = 12;
const SENSITIVITY_SIMULATIONS = 30;

export function useSensitivityAnalysis(
  baseParams: SimulationParams,
  selectedParam: keyof SimulationParams | null
): SensitivityResult | null {
  return useMemo(() => {
    if (!selectedParam) return null;

    const config = PARAM_CONFIGS[selectedParam];
    if (!config) return null;

    const points: SensitivityPoint[] = [];
    const range = config.max - config.min;
    const stepSize = range / (NUM_POINTS - 1);

    // Run simulations across the parameter range
    for (let i = 0; i < NUM_POINTS; i++) {
      const value = config.min + i * stepSize;

      // Create modified params with reduced simulation count for speed
      const testParams: SimulationParams = {
        ...baseParams,
        [selectedParam]: value,
        numSimulations: SENSITIVITY_SIMULATIONS,
      };

      const results = runMultipleSimulations(testParams);

      // Get median final fund balance from the p50 results
      const finalSnapshot = results.percentileResults.p50[results.percentileResults.p50.length - 1];
      const medianFundBalance = finalSnapshot?.fundBalance || 0;

      points.push({
        value,
        successRate: results.successRate * 100, // Convert to percentage
        medianFundBalance,
      });
    }

    return {
      points,
      paramKey: selectedParam,
      label: config.label,
      isComputing: false,
    };
  }, [baseParams, selectedParam]);
}
