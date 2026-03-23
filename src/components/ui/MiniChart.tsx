import React from 'react';
// Simple inline sparkline - no external library needed
interface MiniChartProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export default function MiniChart({ data, color, height = 40, width = 100 }: MiniChartProps) {
  if (!data || data.length < 2) return <div style={{ width, height }} className="bg-dark-400 rounded opacity-30" />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const isPositive = data[data.length - 1] >= data[0];
  const lineColor = color || (isPositive ? '#10b981' : '#ef4444');

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const polyPoints = points.join(' ');

  // Fill area
  const first = points[0];
  const last = points[points.length - 1];
  const areaPoints = `${first} ${polyPoints} ${last.split(',')[0]},${height} 0,${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`fill-${lineColor}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.2} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#fill-${lineColor})`}
      />
      <polyline
        points={polyPoints}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
