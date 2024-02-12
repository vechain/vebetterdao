import { Heading } from "@chakra-ui/react"
import React, { useMemo } from "react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Text, LabelList } from "recharts"
import { Props as LabelProps } from "recharts/types/component/Label"

const blues = [
  ["#457AA6"],
  ["#457AA6", "#E3EBF2"],
  ["#264F73", "#457AA6", "#E3EBF2"],
  ["#264F73", "#457AA6", "#A2BBD2", "#E3EBF2"],
  ["#1A334A", "#264F73", "#457AA6", "#A2BBD2", "#E3EBF2"],
]

const getColor = (length, index) => {
  if (length <= blues.length) {
    return blues[length - 1][index]
  }

  return blues[blues.length - 1][index % blues.length]
}

const BAR_AXIS_SPACE = 10

type Props = {
  data: { [key: string]: string }[]
  xKey: string
  yKey: string
}

const FormatAppName = (props: LabelProps) => {
  return <Heading size="sm">{props.value}</Heading>
}
export const HorizontalChartBar: React.FC<Props> = ({ data, xKey, yKey }) => {
  return (
    <ResponsiveContainer width={"100%"} height={100 * data.length}>
      <BarChart data={data} layout="vertical" barGap={0} barCategoryGap={0}>
        <XAxis hide axisLine={false} type="number" />
        <YAxis hide dataKey={xKey} type="category" />
        {/* <YAxis yAxisId={0} dataKey={xKey} type="category" axisLine={false} tickLine={false} tick={YAxisLeftTick} /> 
        <YAxis
          orientation="right"
          yAxisId={1}
          dataKey={yKey}
          type="category"
          axisLine={false}
          tickLine={false}
          tickFormatter={value => value.toLocaleString()}
          mirror
          tick={{
            transform: `translate(${maxTextWidth + BAR_AXIS_SPACE}, 0)`,
          }}
        /> */}
        <Bar dataKey={yKey} minPointSize={2} radius={[0, 20, 20, 0]}>
          <LabelList dataKey={xKey} position="insideLeft" angle={0} offset={10} fill="black" content={FormatAppName} />
          <LabelList dataKey={yKey} position="insideRight" angle={0} offset={10} fill="black" />
          {data.map((d, idx) => {
            return <Cell height={80} key={idx} fill={getColor(data.length, idx)} spacing={0} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
