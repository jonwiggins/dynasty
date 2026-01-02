import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { SensitivityResult } from './useSensitivityAnalysis';
import { PARAM_CONFIGS } from './types';

interface SensitivityPanelProps {
  sensitivity: SensitivityResult;
  currentValue: number;
  onClose: () => void;
}

export function SensitivityPanel({
  sensitivity,
  currentValue,
  onClose,
}: SensitivityPanelProps) {
  const config = PARAM_CONFIGS[sensitivity.paramKey];
  if (!config) return null;

  const chartData = sensitivity.points.map((point) => ({
    value: point.value,
    successRate: point.successRate,
    formattedValue: config.format(point.value),
  }));

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
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
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
              label={{
                value: 'Success Rate',
                angle: -90,
                position: 'insideLeft',
                fill: '#888',
                fontSize: 11,
              }}
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
            <ReferenceLine
              x={currentValue}
              stroke="#ffd700"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: 'Current',
                fill: '#ffd700',
                fontSize: 10,
                position: 'top',
              }}
            />
            <Line
              type="monotone"
              dataKey="successRate"
              stroke="#2196F3"
              strokeWidth={2}
              dot={{ fill: '#2196F3', r: 3 }}
              activeDot={{ fill: '#2196F3', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="sensitivity-insight">
        {getInsight(sensitivity, currentValue, config)}
      </div>
    </div>
  );
}

function getInsight(
  sensitivity: SensitivityResult,
  currentValue: number,
  _config: { min: number; max: number; format: (v: number) => string }
): string {
  const points = sensitivity.points;
  const minSuccess = Math.min(...points.map((p) => p.successRate));
  const maxSuccess = Math.max(...points.map((p) => p.successRate));
  const range = maxSuccess - minSuccess;

  // Find current success rate
  const currentPoint = points.reduce((prev, curr) =>
    Math.abs(curr.value - currentValue) < Math.abs(prev.value - currentValue) ? curr : prev
  );

  if (range < 5) {
    return `This parameter has minimal impact on success rate (varies by only ${range.toFixed(0)}% across the range).`;
  }

  // Determine if increasing the parameter helps or hurts
  const firstHalf = points.slice(0, Math.floor(points.length / 2));
  const secondHalf = points.slice(Math.floor(points.length / 2));
  const avgFirst = firstHalf.reduce((sum, p) => sum + p.successRate, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, p) => sum + p.successRate, 0) / secondHalf.length;

  const trend = avgSecond > avgFirst ? 'increases' : 'decreases';
  const impactLevel = range > 50 ? 'dramatic' : range > 20 ? 'significant' : 'moderate';

  return `This parameter has ${impactLevel} impact. Success rate ${trend} as ${sensitivity.label.toLowerCase()} rises. Currently at ${currentPoint.successRate.toFixed(0)}% success.`;
}
