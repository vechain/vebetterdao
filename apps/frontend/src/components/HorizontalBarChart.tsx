import { useColorModeValue } from "@chakra-ui/react"
import React from "react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from "recharts"

const blues = [
  ["#457AA6"],
  ["#457AA6", "#E3EBF2"],
  ["#264F73", "#457AA6", "#E3EBF2"],
  ["#264F73", "#457AA6", "#A2BBD2", "#E3EBF2"],
  ["#1A334A", "#264F73", "#457AA6", "#A2BBD2", "#E3EBF2"],
]

const getColor = (length: number, index: number) => {
  if (length <= blues.length) {
    return blues[length - 1]?.[index]
  }

  return blues[blues.length - 1]?.[index % blues.length]
}

type Props = {
  data: { [key: string]: string }[]
  xKey: string
  yKey: string
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
})

export const HorizontalChartBar: React.FC<Props> = ({ data, xKey, yKey }) => {
  const textColor = useColorModeValue("black", "white")
  return (
    <ResponsiveContainer width={"100%"} height={100 * data.length}>
      <BarChart data={data} layout="vertical" barGap={0} barCategoryGap={0}>
        <XAxis hide axisLine={false} type="number" />
        <YAxis
          yAxisId={0}
          dataKey={xKey}
          type="category"
          axisLine={false}
          tickLine={false}
          tick={{ stroke: textColor, strokeWidth: 0.5, fontSize: "1rem" }}
        />
        <YAxis
          orientation="right"
          yAxisId={1}
          dataKey={yKey}
          type="category"
          axisLine={false}
          tickLine={false}
          tickFormatter={value => compactFormatter.format(Number(value))}
          mirror
          tick={{ stroke: textColor, strokeWidth: 1, fontSize: "1.5rem", color: textColor }}
        />
        <Bar isAnimationActive={false} dataKey={yKey} minPointSize={2} radius={[0, 20, 20, 0]}>
          {/* <LabelList
            dataKey={xKey}
            position="insideLeft"
            angle={0}
            offset={10}
            fill="black"
            content={props => <FormatAppName {...props} />}
          /> */}

          {/* <LabelList dataKey={yKey} position="insideRight" angle={0} offset={10} fill="black" /> */}
          {data.map((d, idx) => {
            return <Cell height={80} key={idx} fill={getColor(data.length, idx)} spacing={0} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
