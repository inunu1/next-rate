'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ★ これが必要（TrendClient とは別ファイルなので）
type RatePoint = {
  date: string;
  rate: number;
};

export default function RateChart({ data }: { data: RatePoint[] }) {
  return (
    <div style={{ width: '100%', height: 300, marginTop: 20 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="#3182ce"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}