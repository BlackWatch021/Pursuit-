"use client";

import { format } from "date-fns";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function WeeklyChart({ data }: { data: { week: string; count: number }[] }) {
  const chartData = data.map((d) => ({
    label: format(new Date(d.week), "MMM d"),
    count: d.count,
  }));

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
          <XAxis
            dataKey="label"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            stroke="var(--muted-foreground)"
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            stroke="var(--muted-foreground)"
            width={28}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--popover-foreground)",
            }}
            labelStyle={{ color: "var(--popover-foreground)" }}
          />
          <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
