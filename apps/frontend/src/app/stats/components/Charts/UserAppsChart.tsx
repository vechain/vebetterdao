import React, { useCallback } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts"
import { Box, Text, useToast } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { Trans, useTranslation } from "react-i18next"
import { AppUsersData } from "@/api"

interface Props {
  userId: string
  appActions: AppUsersData[]
  type: "actions" | "rewards"
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F"]

export const UserAppsChart: React.FC<Props> = ({ userId, appActions, type }) => {
  const toast = useToast()

  const { t } = useTranslation()

  const onAddressClick = useCallback(() => {
    navigator.clipboard.writeText(userId)

    toast({
      title: "Address copied to clipboard",
      status: "success",
      duration: 2000,
      isClosable: true,
    })
  }, [toast, userId])

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
          <Bar dataKey={type == "actions" ? "totalActions" : "totalRewardAmount"} fill="#8884d8">
            <LabelList dataKey={type == "actions" ? "totalActions" : "totalRewardAmount"} position="insideRight" />
            {appActions.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
