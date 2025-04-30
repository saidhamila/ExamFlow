"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

// Define the expected data structure for props
interface ChartDataPoint {
  name: string; // Invigilator name
  value: number; // Total hours
}

interface InvigilatorWorkloadChartProps {
  data: ChartDataPoint[];
}

// Define consistent colors for the chart segments
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6", "#ef4444", "#f97316"];

// Removed internal mock data

export function InvigilatorWorkloadChart({ data }: InvigilatorWorkloadChartProps) { // Accept data prop
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data} // Use data from props
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8" // Default fill, overridden by Cell
          dataKey="value" // Use 'value' which represents hours
          nameKey="name"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            // Use consistent colors based on index
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} hours`, "Workload"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
