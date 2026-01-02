import { runMultipleSimulations, runSingleSimulation } from './simulation';
import type { SimulationParams } from './types';
import { PARAM_CONFIGS } from './types';

const NUM_SENSITIVITY_POINTS = 12;
const SENSITIVITY_SIMULATIONS = 30;

interface SensitivityPoint {
  value: number;
  successRate: number;
  medianFundBalance: number;
}

self.onmessage = (e: MessageEvent<{
  type: string;
  params: SimulationParams;
  selectedParam?: keyof SimulationParams;
}>) => {
  const { type, params, selectedParam } = e.data;

  if (type === 'run') {
    // Run main simulation
    const results = runMultipleSimulations(params);
    const singleResult = runSingleSimulation(params);

    // Run sensitivity analysis if a param is selected
    // Skip for maxYears as it's too slow (each point runs a longer simulation)
    let sensitivity = null;
    if (selectedParam && selectedParam !== 'maxYears') {
      const config = PARAM_CONFIGS[selectedParam];
      if (config) {
        const points: SensitivityPoint[] = [];
        const range = config.max - config.min;
        const stepSize = range / (NUM_SENSITIVITY_POINTS - 1);

        for (let i = 0; i < NUM_SENSITIVITY_POINTS; i++) {
          const value = config.min + i * stepSize;
          const testParams: SimulationParams = {
            ...params,
            [selectedParam]: value,
            numSimulations: SENSITIVITY_SIMULATIONS,
          };

          const testResults = runMultipleSimulations(testParams);
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
