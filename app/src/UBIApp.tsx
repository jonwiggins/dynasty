import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  Line,
} from 'recharts';
import type { UBISimulationParams, UBIAggregateResults } from './ubi-types';
import { UBI_DEFAULT_PARAMS, UBI_PARAM_CONFIGS, formatAxisValue } from './ubi-types';
import type { UBISimulationResult } from './ubi-simulation';
import { calculateUBIMetrics } from './ubi-simulation';
import { Nav } from './Nav';
import UBISimulationWorker from './ubi-simulation.worker?worker';
import './UBIApp.css';

function formatLargeCurrency(value: number): string {
  if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatPopulation(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M`;
  return `${(value / 1e3).toFixed(0)}K`;
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

interface SensitivityResult {
  points: { value: number; successRate: number; medianFundBalance: number }[];
  paramKey: keyof UBISimulationParams;
  label: string;
}

function UBISensitivityPanel({
  sensitivity,
  currentValue,
  onClose,
}: {
  sensitivity: SensitivityResult;
  currentValue: number;
  onClose: () => void;
}) {
  const config = UBI_PARAM_CONFIGS[sensitivity.paramKey];
  if (!config) return null;

  const chartData = sensitivity.points.map((point) => ({
    value: point.value,
    successRate: point.successRate,
    formattedValue: config.format(point.value),
  }));

  // Determine insight
  const points = sensitivity.points;
  const minSuccess = Math.min(...points.map((p) => p.successRate));
  const maxSuccess = Math.max(...points.map((p) => p.successRate));
  const range = maxSuccess - minSuccess;

  const currentPoint = points.reduce((prev, curr) =>
    Math.abs(curr.value - currentValue) < Math.abs(prev.value - currentValue) ? curr : prev
  );

  let insight: string;
  if (range < 5) {
    insight = `This parameter has minimal impact on success rate (varies by only ${range.toFixed(0)}% across the range).`;
  } else {
    const firstHalf = points.slice(0, Math.floor(points.length / 2));
    const secondHalf = points.slice(Math.floor(points.length / 2));
    const avgFirst = firstHalf.reduce((sum, p) => sum + p.successRate, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, p) => sum + p.successRate, 0) / secondHalf.length;
    const trend = avgSecond > avgFirst ? 'increases' : 'decreases';
    const impactLevel = range > 50 ? 'dramatic' : range > 20 ? 'significant' : 'moderate';
    insight = `This parameter has ${impactLevel} impact. Success rate ${trend} as ${sensitivity.label.toLowerCase()} rises. Currently at ${currentPoint.successRate.toFixed(0)}% success.`;
  }

  return (
    <div className="sensitivity-panel">
      <div className="sensitivity-header">
        <h3>Sensitivity: {sensitivity.label}</h3>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
      </div>
      <p className="sensitivity-description">
        Shows how success rate changes as you vary {sensitivity.label.toLowerCase()} from{' '}
        {config.format(config.min)} to {config.format(config.max)}
      </p>
      <div className="sensitivity-chart">
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis
              dataKey="value"
              tickFormatter={(v) => config.format(v)}
              stroke="#888"
              tick={{ fill: '#888', fontSize: 11 }}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              stroke="#888"
              tick={{ fill: '#888', fontSize: 11 }}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Success Rate']}
              labelFormatter={(value) => config.format(Number(value))}
              contentStyle={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #333',
                borderRadius: '4px',
              }}
            />
            <Line
              type="monotone"
              dataKey="successRate"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 3 }}
              activeDot={{ fill: '#10b981', r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="sensitivity-insight">{insight}</div>
    </div>
  );
}

function UBIApp() {
  const [params, setParams] = useState<UBISimulationParams>(UBI_DEFAULT_PARAMS);
  const [results, setResults] = useState<UBIAggregateResults | null>(null);
  const [singleResult, setSingleResult] = useState<UBISimulationResult | null>(null);
  const [sensitivity, setSensitivity] = useState<SensitivityResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showSingleRun, setShowSingleRun] = useState(false);
  const [selectedParam, setSelectedParam] = useState<keyof UBISimulationParams | null>(null);

  const workerRef = useRef<Worker | null>(null);

  const updateParam = useCallback(
    <K extends keyof UBISimulationParams>(key: K, value: UBISimulationParams[K]) => {
      setParams((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Run simulation when params or selectedParam change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }

      const worker = new UBISimulationWorker();
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

    return singleResult.snapshots.map((snapshot) => ({
      year: snapshot.year,
      fundBalance: snapshot.fundBalance,
      population: snapshot.population,
      eligiblePopulation: snapshot.eligiblePopulation,
      totalPayout: snapshot.totalPayout,
      withdrawalRate: snapshot.withdrawalRate,
      perCapitaFund: snapshot.perCapitaFund,
    }));
  }, [singleResult]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    if (!results) return null;

    const calculated = calculateUBIMetrics(params);

    return {
      successRate: results.successRate,
      medianRuinYear: results.medianRuinYear,
      ...calculated,
    };
  }, [results, params]);

  return (
    <div className="app ubi-app">
      <Nav currentPage="ubi" />
      <header>
        <h1>UBI Sovereign Wealth Fund Simulator</h1>
        <p>Model a national fund that provides Universal Basic Income to a country's population</p>
      </header>

      <div className="main-content">
        <aside className="controls">
          <h2>Parameters</h2>

          <section>
            <h3>Population</h3>
            <ParameterSlider
              label="Initial Population"
              value={params.initialPopulation}
              min={1_000_000}
              max={500_000_000}
              step={1_000_000}
              format={formatPopulation}
              onChange={(v) => updateParam('initialPopulation', v)}
              onSelect={() => setSelectedParam('initialPopulation')}
              isSelected={selectedParam === 'initialPopulation'}
            />
            <ParameterSlider
              label="Population Growth"
              value={params.populationGrowthRate}
              min={-0.01}
              max={0.03}
              step={0.001}
              format={formatPercent}
              onChange={(v) => updateParam('populationGrowthRate', v)}
              onSelect={() => setSelectedParam('populationGrowthRate')}
              isSelected={selectedParam === 'populationGrowthRate'}
            />
            <ParameterSlider
              label="Life Expectancy"
              value={params.lifeExpectancy}
              min={70}
              max={95}
              step={1}
              format={(v) => `${v} years`}
              onChange={(v) => updateParam('lifeExpectancy', v)}
              onSelect={() => setSelectedParam('lifeExpectancy')}
              isSelected={selectedParam === 'lifeExpectancy'}
            />
          </section>

          <section>
            <h3>Sovereign Wealth Fund</h3>
            <ParameterSlider
              label="Initial Fund"
              value={params.initialFund}
              min={100_000_000_000}
              max={20_000_000_000_000}
              step={100_000_000_000}
              format={formatLargeCurrency}
              onChange={(v) => updateParam('initialFund', v)}
              onSelect={() => setSelectedParam('initialFund')}
              isSelected={selectedParam === 'initialFund'}
            />
            <ParameterSlider
              label="Real Return Rate"
              value={params.realReturnRate}
              min={0.02}
              max={0.12}
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
            <h3>UBI Payment</h3>
            <ParameterSlider
              label="Monthly UBI"
              value={params.ubiMonthlyAmount}
              min={200}
              max={3000}
              step={50}
              format={(v) => `$${v.toLocaleString()}/mo`}
              onChange={(v) => updateParam('ubiMonthlyAmount', v)}
              onSelect={() => setSelectedParam('ubiMonthlyAmount')}
              isSelected={selectedParam === 'ubiMonthlyAmount'}
            />
            <ParameterSlider
              label="Eligibility Age"
              value={params.eligibilityAge}
              min={0}
              max={25}
              step={1}
              format={(v) => `${v} years`}
              onChange={(v) => updateParam('eligibilityAge', v)}
              onSelect={() => setSelectedParam('eligibilityAge')}
              isSelected={selectedParam === 'eligibilityAge'}
            />
            <ParameterSlider
              label="UBI Real Growth"
              value={params.ubiRealGrowth}
              min={0}
              max={0.02}
              step={0.001}
              format={formatPercent}
              onChange={(v) => updateParam('ubiRealGrowth', v)}
              onSelect={() => setSelectedParam('ubiRealGrowth')}
              isSelected={selectedParam === 'ubiRealGrowth'}
            />
          </section>

          <section>
            <h3>Simulation</h3>
            <ParameterSlider
              label="Years to Simulate"
              value={params.maxYears}
              min={25}
              max={200}
              step={5}
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
              <h2>Welcome to the UBI Fund Simulator</h2>
              <p>
                Adjust the parameters on the left to see how a sovereign wealth fund
                could sustain Universal Basic Income payments to an entire population.
              </p>
              <div className="concept-explanation">
                <h3>How it works:</h3>
                <ul>
                  <li>A sovereign wealth fund is invested in diversified assets</li>
                  <li>Each month, eligible citizens receive a UBI payment</li>
                  <li>The fund grows through investment returns</li>
                  <li>Population grows or shrinks based on demographics</li>
                  <li>Sustainability depends on returns exceeding payouts + population growth</li>
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
                  <h3>Withdrawal Rate</h3>
                  <div className="metric-value">
                    {formatPercent(metrics!.initialWithdrawalRate)}
                  </div>
                  <p>Annual UBI cost / Fund balance</p>
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
                  <h3>Per Capita Fund</h3>
                  <div className="metric-value">
                    {formatLargeCurrency(metrics!.perCapitaFund)}
                  </div>
                  <p>Fund / Total population</p>
                </div>
                <div className="metric-card">
                  <h3>Annual UBI</h3>
                  <div className="metric-value">
                    ${metrics!.annualUBI.toLocaleString()}
                  </div>
                  <p>{formatPercent(metrics!.ubiAsPercentOfMedian)} of median income</p>
                </div>
                <div className="metric-card">
                  <h3>Annual UBI Cost</h3>
                  <div className="metric-value">
                    {formatLargeCurrency(metrics!.annualUBICost)}
                  </div>
                  <p>{formatPopulation(metrics!.eligiblePopulation)} eligible recipients</p>
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
                    <YAxis tickFormatter={formatAxisValue} />
                    <Tooltip
                      formatter={(value) => formatLargeCurrency(value as number)}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="p75"
                      stackId="2"
                      stroke="#34d399"
                      fill="#34d399"
                      fillOpacity={0.3}
                      name="75th percentile"
                    />
                    <Area
                      type="monotone"
                      dataKey="p50"
                      stackId="3"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.4}
                      name="Median"
                    />
                    <Area
                      type="monotone"
                      dataKey="p25"
                      stackId="4"
                      stroke="#fbbf24"
                      fill="#fbbf24"
                      fillOpacity={0.3}
                      name="25th percentile"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {sensitivity && selectedParam && (
                <UBISensitivityPanel
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
                    <h3>Single Run: Fund Balance & Population</h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <ComposedChart data={singleRunChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis
                          yAxisId="left"
                          tickFormatter={formatAxisValue}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tickFormatter={formatPopulation}
                        />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === 'Fund Balance' || name === 'Total Payout') {
                              return formatLargeCurrency(value as number);
                            }
                            if (name === 'Population' || name === 'Eligible Population') {
                              return formatPopulation(value as number);
                            }
                            return value;
                          }}
                        />
                        <Legend />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="fundBalance"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.3}
                          name="Fund Balance"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="eligiblePopulation"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={false}
                          name="Eligible Population"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={`chart-container ${isRunning ? 'loading' : ''}`}>
                    <h3>Single Run: Per Capita Fund Value</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <ComposedChart data={singleRunChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={formatLargeCurrency} />
                        <Tooltip formatter={(value) => formatLargeCurrency(value as number)} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="perCapitaFund"
                          stroke="#06b6d4"
                          fill="#06b6d4"
                          fillOpacity={0.3}
                          name="Per Capita Fund"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="single-run-stats">
                    <h3>Single Run Statistics</h3>
                    <div className="stats-grid">
                      <div className="stat">
                        <span className="stat-label">Final Population</span>
                        <span className="stat-value">
                          {formatPopulation(singleResult.snapshots[singleResult.snapshots.length - 1]?.population || 0)}
                        </span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Peak Population</span>
                        <span className="stat-value">{formatPopulation(singleResult.peakPopulation)}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Final Fund</span>
                        <span className="stat-value">
                          {formatLargeCurrency(singleResult.finalFund)}
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
                    {formatPercent(metrics!.initialWithdrawalRate)}.
                    For perpetual sustainability, this should typically be below 4-5%.
                    {metrics!.initialWithdrawalRate > 0.05 &&
                      ' Current rate is above recommended levels.'}
                  </p>
                  <p>
                    <strong>UBI Level:</strong> At ${params.ubiMonthlyAmount}/month (${metrics!.annualUBI.toLocaleString()}/year),
                    recipients receive {formatPercent(metrics!.ubiAsPercentOfMedian)} of the U.S. median individual income.
                    {metrics!.ubiAsPercentOfMedian > 0.5
                      ? ' This provides meaningful income support.'
                      : ' This provides partial income supplementation.'}
                  </p>
                  <p>
                    <strong>Population Dynamics:</strong> With {formatPercent(params.populationGrowthRate)} annual growth,
                    the population is {params.populationGrowthRate > 0 ? 'expanding' : params.populationGrowthRate < 0 ? 'shrinking' : 'stable'}.
                    {params.populationGrowthRate > 0.01
                      ? ' Rapid population growth puts significant strain on the fund.'
                      : params.populationGrowthRate < 0
                        ? ' Population decline reduces pressure on the fund.'
                        : ' Stable population provides predictable payout growth.'}
                  </p>
                  <p>
                    <strong>Real-World Context:</strong> For comparison, Norway's Government Pension Fund holds ~$1.4T for 5.5M people
                    (~$255K per capita). Alaska's Permanent Fund pays ~$1,600/year per resident.
                  </p>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <footer>
        <p>
          UBI Sovereign Wealth Fund Simulator - Explore universal basic income sustainability
        </p>
        <p className="disclaimer">
          This is a simplified model for educational purposes. Real-world sovereign funds involve
          complex political, economic, and administrative considerations not captured here.
        </p>
      </footer>
    </div>
  );
}

export default UBIApp;
