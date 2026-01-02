import { runUBIMultipleSimulations, runUBISingleSimulation } from './ubi-simulation';
import type { UBISimulationParams } from './ubi-types';
import { UBI_PARAM_CONFIGS } from './ubi-types';

const NUM_SENSITIVITY_POINTS = 12;
const SENSITIVITY_SIMULATIONS = 30;

interface SensitivityPoint {
  value: number;
  successRate: number;
  medianFundBalance: number;
}

self.onmessage = (e: MessageEvent<{
  type: string;
  params: UBISimulationParams;
  selectedParam?: keyof UBISimulationParams;
}>) => {
  const { type, params, selectedParam } = e.data;

  if (type === 'run') {
    // Run main simulation
    const results = runUBIMultipleSimulations(params);
    const singleResult = runUBISingleSimulation(params);

    // Run sensitivity analysis if a param is selected
    // Skip for maxYears as it's too slow
    let sensitivity = null;
    if (selectedParam && selectedParam !== 'maxYears') {
      const config = UBI_PARAM_CONFIGS[selectedParam];
      if (config) {
        const points: SensitivityPoint[] = [];
        const range = config.max - config.min;
        const stepSize = range / (NUM_SENSITIVITY_POINTS - 1);

        for (let i = 0; i < NUM_SENSITIVITY_POINTS; i++) {
          const value = config.min + i * stepSize;
          const testParams: UBISimulationParams = {
            ...params,
            [selectedParam]: value,
            numSimulations: SENSITIVITY_SIMULATIONS,
          };

          const testResults = runUBIMultipleSimulations(testParams);
          const finalSnapshot = testResults.percentileResults.p50[testResults.percentileResults.p50.length - 1];

          points.push({
            value,
            successRate: testResults.successRate * 100,
            medianFundBalance: finalSnapshot?.fundBalance || 0,
          });
        }

        sensitivity = {
          points,
          paramKey: selectedParam,
          label: config.label,
        };
      }
    }

    self.postMessage({
      type: 'results',
      results,
      singleResult,
      sensitivity,
    });
  }
};
