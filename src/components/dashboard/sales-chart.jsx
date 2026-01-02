"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  sales: {
    label: 'Sales',
    color: 'hsl(var(--primary))',
  },
};

export default function SalesChart({ data }) {
  // Use provided data or show empty state
  const chartData = (data && data.length > 0) 
    ? data 
    : [
        { month: 'Jan', sales: 0 },
        { month: 'Feb', sales: 0 },
        { month: 'Mar', sales: 0 },
      ];

  return (
    <ChartContainer config={chartConfig} className="min-h-[350px] w-full">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${value / 1000}k`}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--accent) / 0.2)' }}
          content={<ChartTooltipContent indicator="dot" />}
          formatter={(value) => `₹${value.toLocaleString()}`}
        />
        <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
