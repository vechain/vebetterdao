import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

interface Props {
  pieData: { name: string; value: number; color: string }[]
}

export const RewardsAllowancePieChart: React.FC<Props> = ({ pieData }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} innerRadius={60}>
          {pieData.map(entry => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: any) => `${value}%`} />
      </PieChart>
    </ResponsiveContainer>
  )
}
