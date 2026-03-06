"use client"

import { Text, Skeleton, Mark } from "@chakra-ui/react"
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
      title={t("Your balance")}
      icon={<B3TRIcon />}
      subtitle={
        <Skeleton asChild loading={isLoading}>
          <Text textStyle={{ base: "sm", md: "2xl" }} lineClamp={1}>
            <Mark variant="text" fontWeight="semibold">
              {b3trBalance?.formatted ?? "-"}
            </Mark>
            {" B3TR"}
          </Text>
        </Skeleton>
      }
    />
  )
}
