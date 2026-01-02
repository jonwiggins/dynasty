import { runMultipleSimulations, runSingleSimulation } from './simulation';
import type { SimulationParams } from './types';

self.onmessage = (e: MessageEvent<{ type: string; params: SimulationParams }>) => {
  const { type, params } = e.data;

  if (type === 'run') {
    const results = runMultipleSimulations(params);
    const singleResult = runSingleSimulation(params);

    self.postMessage({
      type: 'results',
      results,
      singleResult,
    });
  }
};
