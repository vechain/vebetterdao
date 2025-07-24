import React, { useCallback } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts"
import { Box, Text } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { Trans, useTranslation } from "react-i18next"
import { AppUsersData } from "@/api"
import { toaster } from "@/components/ui/toaster"

interface Props {
  userId: string
  appActions: AppUsersData[]
  type: "actions" | "rewards"
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F"]

export const UserAppsChart: React.FC<Props> = ({ userId, appActions, type }) => {
  const { t } = useTranslation()

  const dataType = type == "actions" ? "totalActions" : "totalRewardAmount"

  const onAddressClick = useCallback(() => {
    navigator.clipboard.writeText(userId)

    toaster.success({
      title: "Address copied to clipboard",
      duration: 2000,
      closable: true,
    })
  }, [userId])

  return (
    <Box w="full" mb={8}>
      <Text fontSize="lg" mb={2} onClick={onAddressClick} cursor={"pointer"}>
        <Trans i18nKey={"User: {{user}}"} values={{ user: FormattingUtils.humanAddress(userId, 6, 8) }} t={t} />
      </Text>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={appActions} layout="vertical" margin={{ top: 20, right: 30, bottom: 20 }}>
          <YAxis type="category" dataKey="appName" tick={{ fontSize: 12 }} width={150} />
          <XAxis type="number" />
          <Tooltip />
          <Bar dataKey={dataType} fill="#8884d8">
            <LabelList dataKey={dataType} position="insideRight" />
            {appActions.map((action, index) => (
              <Cell key={`${dataType}-cell-${action.appName}-${action.user}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
