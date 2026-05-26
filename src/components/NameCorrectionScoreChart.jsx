import React from 'react';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const fallbackData = [
  { name: 'Current', score: 62 },
  { name: 'Vineet Shrikant', score: 92 },
  { name: 'Vinit S Naik', score: 88 },
  { name: 'Vinit Shrikanth', score: 85 }
];

function normalizeChartData(suggestions) {
  const source = Array.isArray(suggestions) && suggestions.length ? suggestions : fallbackData;
  return source.map((item) => ({
    name: item.name,
    score: Number(item.score) || 0,
    label: item.label || (item.name.includes('Current') ? 'Current' : 'Optimized'),
    originalName: item.originalName || item.name
  }));
}

export default function NameCorrectionScoreChart({ suggestions }) {
  const data = normalizeChartData(suggestions);
  const bestScore = Math.max(...data.map((item) => item.score));

  return (
    <div className="name-score-chart">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 24, right: 16, left: -12, bottom: 44 }}>
          <XAxis dataKey="name" interval={0} angle={-18} textAnchor="end" height={72} tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [`${value}/100`, 'Score']}
            labelFormatter={(label, payload) => {
              const item = payload?.[0]?.payload;
              return item ? `${item.originalName} (${item.label})` : label;
            }}
          />
          <Bar dataKey="score" radius={[8, 8, 0, 0]}>
            <LabelList
              dataKey={(entry) => (entry.score === bestScore ? 'Best' : '')}
              position="top"
              className="chart-best-label"
            />
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.label === 'Current' ? '#be123c' : entry.score === bestScore ? '#0f766e' : '#2563eb'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { fallbackData as fallbackNameCorrectionData };
