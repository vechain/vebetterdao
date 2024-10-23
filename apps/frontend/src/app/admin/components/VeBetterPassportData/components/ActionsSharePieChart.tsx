import React, { useMemo } from "react"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface Props {
  data: { name: string; appId: string; actions: number }[]
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28FD0", "#FF6666"]

export const ActionsSharePieChart: React.FC<Props> = ({ data }) => {
  const totalActions = data.reduce((sum, item) => sum + item.actions, 0)

  const pieData = useMemo(() => {
    return data
      .map(item => {
        const value = ((item.actions / totalActions) * 100).toFixed(2)

        if (Number(value) > 0) {
          return {
            name: item.name,
            value: Number(value),
          }
        }
        return null
      })
      .filter(Boolean)
  }, [data, totalActions])

  console.log({ pieData })

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={pieData} dataKey="value" nameKey="name" label>
          {pieData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: any) => `${value}%`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
