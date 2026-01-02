"use client";

import { Pie, PieChart, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  value: {
    label: 'Deals',
  },
  prospect: {
    label: 'Prospect',
    color: 'hsl(var(--chart-1))',
  },
  qualified: {
    label: 'Qualified',
    color: 'hsl(var(--chart-2))',
  },
  proposal: {
    label: 'Proposal',
    color: 'hsl(var(--chart-3))',
  },
  negotiation: {
    label: 'Negotiation',
    color: 'hsl(var(--chart-4))',
  },
  won: {
    label: 'Won',
    color: 'hsl(var(--chart-5))',
  },
  lost: {
    label: 'Lost',
    color: 'hsl(var(--destructive))',
  },
};

const colorMap = {
  'Prospect': 'hsl(var(--chart-1))',
  'Qualified': 'hsl(var(--chart-2))',
  'Proposal': 'hsl(var(--chart-3))',
  'Negotiation': 'hsl(var(--chart-4))',
  'Won': 'hsl(var(--chart-5))',
  'Lost': 'hsl(var(--destructive))',
};

export default function DealStageChart({ data }) {
  // Filter out stages with 0 deals
  const chartData = (data || [])
    .map(item => ({
      ...item,
      fill: colorMap[item.name] || 'hsl(var(--chart-1))'
    }))
    .filter(item => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No deal data available
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full max-h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            cursor={{ fill: 'hsl(var(--accent) / 0.2)' }}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={80}
            fill="hsl(var(--primary))"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
