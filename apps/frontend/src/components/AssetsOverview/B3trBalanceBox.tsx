"use client"

import { Text, Skeleton } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import B3TRIcon from "@/components/Icons/svg/b3tr.svg"
import { useGetB3trBalance } from "@/hooks/useGetB3trBalance"

import { StatCard } from "./StatCard"

export const B3trBalanceBox = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: b3trBalance, isLoading } = useGetB3trBalance(account?.address)

  return (
    <StatCard
      variant="info"
      title={t("Your B3TR balance")}
      icon={<B3TRIcon />}
      subtitle={
        <Skeleton asChild loading={isLoading}>
          <Text textStyle={{ base: "sm", md: "2xl" }} fontWeight="semibold">
            {b3trBalance?.formatted ?? "-"}
          </Text>
        </Skeleton>
      }
    />
  )
}
