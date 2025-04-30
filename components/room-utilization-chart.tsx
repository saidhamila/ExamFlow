"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

// Define the expected data structure for props
interface ChartDataPoint {
  name: string; // Room name
  value: number; // Number of exams held in the room
}

interface RoomUtilizationChartProps {
  data: ChartDataPoint[];
}

// Removed internal mock data

export function RoomUtilizationChart({ data }: RoomUtilizationChartProps) { // Accept data prop
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data} // Use data from props
        margin={{
          top: 5,
          right: 5,
          left: -20, // Adjust left margin if Y-axis labels are cut off
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
        <XAxis
          dataKey="name"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
          allowDecimals={false} // Ensure whole numbers for exam counts
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
          contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
          formatter={(value) => [`${value} exams`, "Count"]} // Update tooltip formatter
        />
        {/* <Legend /> */} {/* Legend might be redundant */}
        {/* Use 'value' which represents exam count */}
        <Bar dataKey="value" name="Number of Exams" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        {/* Removed second bar for utilization as data is not available */}
      </BarChart>
    </ResponsiveContainer>
  )
}
