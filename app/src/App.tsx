import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  Bar,
} from 'recharts';
import type { SimulationParams, AggregateResults } from './types';
import { DEFAULT_PARAMS } from './types';
import type { SimulationResult } from './simulation';
import type { SensitivityResult } from './useSensitivityAnalysis';
import { SensitivityPanel } from './SensitivityPanel';
import { Nav } from './Nav';
import SimulationWorker from './simulation.worker?worker';
import './App.css';

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

interface ParameterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (value: number) => void;
  onSelect?: () => void;
  isSelected?: boolean;
}

function ParameterSlider({
  label,
  value,
  min,
  max,
  step,
  format = (v) => v.toString(),
  onChange,
  onSelect,
  isSelected,
}: ParameterSliderProps) {
  return (
    <div
      className={`parameter-slider ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <label>
        <span className="param-label">{label}</span>
        <span className="param-value">{format(value)}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onFocus={onSelect}
      />
    </div>
  );
}

function App() {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [results, setResults] = useState<AggregateResults | null>(null);
  const [singleResult, setSingleResult] = useState<SimulationResult | null>(null);
  const [sensitivity, setSensitivity] = useState<SensitivityResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showSingleRun, setShowSingleRun] = useState(false);
  const [selectedParam, setSelectedParam] = useState<keyof SimulationParams | null>(null);

  const workerRef = useRef<Worker | null>(null);

  const updateParam = useCallback(
    <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => {
      setParams((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Run simulation when params or selectedParam change
  // Cancel any in-progress work by terminating and recreating the worker
  useEffect(() => {
    const timer = setTimeout(() => {
      // Terminate existing worker to cancel in-progress work
      if (workerRef.current) {
        workerRef.current.terminate();
      }

      // Create new worker
      const worker = new SimulationWorker();
      workerRef.current = worker;

      worker.onmessage = (e) => {
        const { type, results: newResults, singleResult: newSingle, sensitivity: newSensitivity } = e.data;
        if (type === 'results') {
          setResults(newResults);
          setSingleResult(newSingle);
          setSensitivity(newSensitivity);
          setIsRunning(false);
        }
      };

      setIsRunning(true);
      worker.postMessage({ type: 'run', params, selectedParam });
    }, 150);

    return () => clearTimeout(timer);
  }, [params, selectedParam]);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Prepare chart data
  const fundChartData = useMemo(() => {
    if (!results) return [];

    return results.percentileResults.p50.map((snapshot, idx) => ({
      year: snapshot.year,
      p25: results.percentileResults.p25[idx]?.fundBalance || 0,
      p50: snapshot.fundBalance,
      p75: results.percentileResults.p75[idx]?.fundBalance || 0,
    }));
  }, [results]);

  const singleRunChartData = useMemo(() => {
    if (!singleResult) return [];

    return singleResult.snapshots.map((snapshot: { year: number; fundBalance: number; numEligible: number; totalPayout: number; withdrawalRate: number; births: number; deaths: number }) => ({
      year: snapshot.year,
      fundBalance: snapshot.fundBalance,
      numEligible: snapshot.numEligible,
      totalPayout: snapshot.totalPayout,
      withdrawalRate: snapshot.withdrawalRate,
      births: snapshot.births,
      deaths: snapshot.deaths,
    }));
  }, [singleResult]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    if (!results) return null;

    const initialPayout = params.initialMedianIncome;
    const fundMultiple = params.initialFund / initialPayout;

    return {
      successRate: results.successRate,
      medianRuinYear: results.medianRuinYear,
      fundMultiple,
      requiredForPerpetual:
        initialPayout / (params.realReturnRate - params.realIncomeGrowth - 0.02),
    };
  }, [results, params]);

  return (
    <div className="app">
      <Nav currentPage="dynasty" />
      <header>
        <h1>Dynasty Fund Simulator</h1>
        <p>Model a perpetual fund that pays median U.S. income to a growing family lineage</p>
      </header>

      <div className="main-content">
        <aside className="controls">
          <h2>Parameters</h2>

          <section>
            <h3>Initial Conditions</h3>
            <ParameterSlider
              label="Initial Fund"
              value={params.initialFund}
              min={500_000}
              max={10_000_000}
              step={100_000}
              format={formatCurrency}
              onChange={(v) => updateParam('initialFund', v)}
              onSelect={() => setSelectedParam('initialFund')}
              isSelected={selectedParam === 'initialFund'}
            />
            <ParameterSlider
              label="Founder Age"
              value={params.founderAge}
              min={1}
              max={50}
              step={1}
              format={(v) => `${v} years`}
              onChange={(v) => updateParam('founderAge', v)}
              onSelect={() => setSelectedParam('founderAge')}
              isSelected={selectedParam === 'founderAge'}
            />
          </section>

          <section>
            <h3>Investment</h3>
            <ParameterSlider
              label="Real Return Rate"
              value={params.realReturnRate}
              min={0.02}
              max={0.15}
              step={0.005}
              format={formatPercent}
              onChange={(v) => updateParam('realReturnRate', v)}
              onSelect={() => setSelectedParam('realReturnRate')}
              isSelected={selectedParam === 'realReturnRate'}
            />
            <ParameterSlider
              label="Return Volatility"
              value={params.returnVolatility}
              min={0.05}
              max={0.30}
              step={0.01}
              format={formatPercent}
              onChange={(v) => updateParam('returnVolatility', v)}
              onSelect={() => setSelectedParam('returnVolatility')}
              isSelected={selectedParam === 'returnVolatility'}
            />
          </section>

          <section>
            <h3>Income</h3>
            <ParameterSlider
              label="Initial Median Income"
              value={params.initialMedianIncome}
              min={40_000}
              max={150_000}
              step={2_000}
              format={formatCurrency}
              onChange={(v) => updateParam('initialMedianIncome', v)}
              onSelect={() => setSelectedParam('initialMedianIncome')}
              isSelected={selectedParam === 'initialMedianIncome'}
            />
            <ParameterSlider
              label="Real Income Growth"
              value={params.realIncomeGrowth}
              min={0}
              max={0.03}
              step={0.001}
              format={formatPercent}
              onChange={(v) => updateParam('realIncomeGrowth', v)}
              onSelect={() => setSelectedParam('realIncomeGrowth')}
              isSelected={selectedParam === 'realIncomeGrowth'}
            />
          </section>

          <section>
            <h3>Demographics</h3>
            <ParameterSlider
              label="Fertility Rate (TFR)"
              value={params.totalFertilityRate}
              min={0.5}
              max={4.0}
              step={0.1}
              format={(v) => `${v.toFixed(1)} children`}
              onChange={(v) => updateParam('totalFertilityRate', v)}
              onSelect={() => setSelectedParam('totalFertilityRate')}
              isSelected={selectedParam === 'totalFertilityRate'}
            />
            <ParameterSlider
              label="Marriage Age"
              value={params.medianMarriageAge}
              min={20}
              max={40}
              step={1}
              format={(v) => `${v} years`}
              onChange={(v) => updateParam('medianMarriageAge', v)}
              onSelect={() => setSelectedParam('medianMarriageAge')}
              isSelected={selectedParam === 'medianMarriageAge'}
            />
            <ParameterSlider
              label="Life Expectancy"
              value={params.baseLifeExpectancy}
              min={60}
              max={120}
              step={1}
              format={(v) => `${v} years`}
              onChange={(v) => updateParam('baseLifeExpectancy', v)}
              onSelect={() => setSelectedParam('baseLifeExpectancy')}
              isSelected={selectedParam === 'baseLifeExpectancy'}
            />
            <ParameterSlider
              label="Life Exp. Growth"
              value={params.lifeExpectancyGrowth}
              min={0}
              max={0.5}
              step={0.05}
              format={(v) => `${(v * 10).toFixed(1)} yrs/decade`}
              onChange={(v) => updateParam('lifeExpectancyGrowth', v)}
              onSelect={() => setSelectedParam('lifeExpectancyGrowth')}
              isSelected={selectedParam === 'lifeExpectancyGrowth'}
            />
          </section>

          <section>
            <h3>Simulation</h3>
            <ParameterSlider
              label="Years to Simulate"
              value={params.maxYears}
              min={50}
              max={500}
              step={10}
              format={(v) => `${v} years`}
              onChange={(v) => updateParam('maxYears', v)}
              onSelect={() => setSelectedParam('maxYears')}
              isSelected={selectedParam === 'maxYears'}
            />
          </section>

          {isRunning && (
            <div className="running-indicator">
              <div className="spinner"></div>
              <span>Simulating 100 runs...</span>
            </div>
          )}
        </aside>

        <main className="results">
          {!results ? (
            <div className="placeholder">
              <h2>Welcome to the Dynasty Fund Simulator</h2>
              <p>
                Adjust the parameters on the left and click "Run Simulation" to
                see how your dynasty fund performs over multiple generations.
              </p>
              <div className="concept-explanation">
                <h3>How it works:</h3>
                <ul>
                  <li>The fund starts with one person (the founder)</li>
                  <li>When they marry, their spouse becomes a beneficiary</li>
                  <li>Children become beneficiaries at age 18</li>
                  <li>Each eligible beneficiary receives the median U.S. income annually</li>
                  <li>The fund grows through investment returns</li>
                  <li>Sustainability depends on returns exceeding payouts + family growth</li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              <div className="metrics-grid">
                <div className="metric-card">
                  <h3>Success Rate</h3>
                  <div className="metric-value success">
                    {formatPercent(metrics!.successRate)}
                  </div>
                  <p>Probability fund survives {params.maxYears} years</p>
                </div>
                <div className="metric-card">
                  <h3>Fund Multiple</h3>
                  <div className="metric-value">
                    {metrics!.fundMultiple.toFixed(1)}x
                  </div>
                  <p>Initial fund / first year payout</p>
                </div>
                <div className="metric-card">
                  <h3>Median Ruin Year</h3>
                  <div className="metric-value warning">
                    {metrics!.medianRuinYear
                      ? `Year ${metrics!.medianRuinYear}`
                      : 'Never'}
                  </div>
                  <p>When 50% of failing simulations exhaust funds</p>
                </div>
                <div className="metric-card">
                  <h3>Starting Payout</h3>
                  <div className="metric-value">
                    {formatCurrency(params.initialMedianIncome)}
                  </div>
                  <p>First year income per beneficiary</p>
                </div>
              </div>

              <div className={`chart-container ${isRunning ? 'loading' : ''}`}>
                {isRunning && (
                  <div className="chart-loading-indicator">
                    <div className="spinner"></div>
                    <span>Updating...</span>
                  </div>
                )}
                <h3>Fund Balance Over Time (Percentiles)</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={fundChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="year"
                      tickFormatter={(v) => v.toString()}
                    />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="p75"
                      stackId="2"
                      stroke="#8BC34A"
                      fill="#8BC34A"
                      fillOpacity={0.3}
                      name="75th percentile"
                    />
                    <Area
                      type="monotone"
                      dataKey="p50"
                      stackId="3"
                      stroke="#2196F3"
                      fill="#2196F3"
                      fillOpacity={0.4}
                      name="Median"
                    />
                    <Area
                      type="monotone"
                      dataKey="p25"
                      stackId="4"
                      stroke="#FF9800"
                      fill="#FF9800"
                      fillOpacity={0.3}
                      name="25th percentile"
                    />
                    </AreaChart>
                </ResponsiveContainer>
              </div>

              {sensitivity && selectedParam && (
                <SensitivityPanel
                  sensitivity={sensitivity}
                  currentValue={params[selectedParam] as number}
                  onClose={() => setSelectedParam(null)}
                />
              )}

              <div className="toggle-section">
                <button
                  className={`toggle-button ${showSingleRun ? 'active' : ''}`}
                  onClick={() => setShowSingleRun(!showSingleRun)}
                >
                  {showSingleRun ? 'Hide' : 'Show'} Single Run Details
                </button>
              </div>

              {showSingleRun && singleResult && (
                <>
                  <div className={`chart-container ${isRunning ? 'loading' : ''}`}>
                    <h3>Single Run: Fund Balance & Beneficiaries</h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <ComposedChart data={singleRunChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis
                          yAxisId="left"
                          tickFormatter={formatCurrency}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tickFormatter={(v) => `${v} people`}
                        />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === 'Fund Balance' || name === 'Total Payout') {
                              return formatCurrency(value as number);
                            }
                            return value;
                          }}
                        />
                        <Legend />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="fundBalance"
                          stroke="#2196F3"
                          fill="#2196F3"
                          fillOpacity={0.3}
                          name="Fund Balance"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="numEligible"
                          stroke="#4CAF50"
                          strokeWidth={2}
                          dot={false}
                          name="Eligible Beneficiaries"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={`chart-container ${isRunning ? 'loading' : ''}`}>
                    <h3>Single Run: Births & Deaths</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <ComposedChart data={singleRunChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="births" fill="#4CAF50" name="Births" />
                        <Bar dataKey="deaths" fill="#f44336" name="Deaths" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="single-run-stats">
                    <h3>Single Run Statistics</h3>
                    <div className="stats-grid">
                      <div className="stat">
                        <span className="stat-label">Total Family Members</span>
                        <span className="stat-value">{singleResult.family.length}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Peak Beneficiaries</span>
                        <span className="stat-value">{singleResult.peakPopulation}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Generations</span>
                        <span className="stat-value">{singleResult.totalGenerations}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Final Fund</span>
                        <span className="stat-value">
                          {formatCurrency(singleResult.finalFund)}
                        </span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Ruin Year</span>
                        <span className="stat-value">
                          {singleResult.ruinYear || 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="analysis-section">
                <h3>Analysis</h3>
                <div className="analysis-content">
                  <p>
                    <strong>Withdrawal Rate:</strong> Your initial withdrawal rate is{' '}
                    {formatPercent(params.initialMedianIncome / params.initialFund)}.
                    For perpetual sustainability, this should typically be below 3-4%.
                  </p>
                  <p>
                    <strong>Growth vs. Payout:</strong> With a {formatPercent(params.realReturnRate)}{' '}
                    real return, {formatPercent(params.realIncomeGrowth)} income growth, and
                    fertility rate of {params.totalFertilityRate.toFixed(1)}, the fund needs to
                    generate returns exceeding approximately{' '}
                    {formatPercent(
                      params.realIncomeGrowth +
                        (params.totalFertilityRate > 2 ? 0.02 : params.totalFertilityRate > 1.5 ? 0.01 : 0)
                    )}{' '}
                    just to maintain payout levels per capita.
                  </p>
                  <p>
                    <strong>Family Growth:</strong> With a TFR of {params.totalFertilityRate.toFixed(1)},
                    the family is {params.totalFertilityRate > 2.1 ? 'growing' : 'shrinking'} over
                    generations. {params.totalFertilityRate <= 2.1
                      ? 'This actually helps fund sustainability as fewer beneficiaries means lower payouts.'
                      : 'This creates exponential growth in payouts that can quickly exhaust the fund.'}
                  </p>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <footer>
        <p>
          Dynasty Fund Simulator - A tool for exploring multi-generational wealth sustainability
        </p>
        <p className="disclaimer">
          This is a simplified model for educational purposes. Real-world dynasty trusts involve
          complex tax, legal, and administrative considerations not captured here.
        </p>
      </footer>
    </div>
  );
}

export default App;
