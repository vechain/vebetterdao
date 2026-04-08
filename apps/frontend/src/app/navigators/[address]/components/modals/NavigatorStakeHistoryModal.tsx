import { Badge, HStack, Icon, Link, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { LuArrowDownLeft, LuArrowUpRight, LuExternalLink, LuShield } from "react-icons/lu"

import { useNavigatorStakeHistory } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorStakeHistory"
import { AddressWithProfilePicture } from "@/app/components/AddressWithProfilePicture/AddressWithProfilePicture"
import { BaseModal } from "@/components/BaseModal"
import { EmptyState } from "@/components/ui/empty-state"
import { getExplorerTxLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"

const formatter = getCompactFormatter(2)

type Props = {
  address?: string
  isOpen: boolean
  onClose: () => void
}

export const NavigatorStakeHistoryModal = ({ address, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { data, isLoading } = useNavigatorStakeHistory(address)

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} ariaTitle={t("Stake History")} showCloseButton>
      <VStack gap={4} align="stretch" py={4} px={2}>
        <Text textStyle="lg" fontWeight="semibold">
          {t("Stake History")}
        </Text>

        {isLoading && (
          <VStack gap={3} align="stretch">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} h="60px" borderRadius="xl" />
            ))}
          </VStack>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <EmptyState
            title={t("No stake activity")}
            description={t("No stake deposits or withdrawals found.")}
            icon={
              <Icon boxSize={10} color="actions.secondary.text-lighter">
                <LuShield />
              </Icon>
            }
          />
        )}

        {!isLoading && data && data.length > 0 && (
          <VStack maxH="60vh" overflowY="auto" gap={0} align="stretch">
            {data.map((entry, i) => {
              const isDeposit = entry.type === "registered" || entry.type === "deposit"
              return (
                <HStack
                  key={`${entry.txId}-${i}`}
                  justify="space-between"
                  py={3}
                  borderBottomWidth="1px"
                  borderColor="border.primary"
                  _last={{ borderBottomWidth: 0 }}
                  flexWrap="wrap"
                  gap={2}>
                  <HStack gap={3}>
                    <HStack
                      justify="center"
                      align="center"
                      w="8"
                      h="8"
                      rounded="full"
                      bg={isDeposit ? "status.positive.subtle" : "status.negative.subtle"}
                      color={isDeposit ? "status.positive.primary" : "status.negative.primary"}
                      flexShrink={0}>
                      {isDeposit ? <LuArrowDownLeft size={16} /> : <LuArrowUpRight size={16} />}
                    </HStack>
                    <VStack gap={0} align="start">
                      <HStack gap={2}>
                        <Text textStyle="sm" fontWeight="semibold">
                          {entry.type === "registered"
                            ? t("Initial Stake")
                            : isDeposit
                              ? t("Deposit")
                              : t("Withdrawal")}
                        </Text>
                        {entry.type === "registered" && (
                          <Badge size="xs" colorPalette="blue">
                            {t("Registration")}
                          </Badge>
                        )}
                      </HStack>
                      {!address && entry.navigator && <AddressWithProfilePicture address={entry.navigator} />}
                      <HStack gap={1}>
                        <Text textStyle="xs" color="fg.muted">
                          {new Date(entry.timestamp * 1000).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Text>
                        <Link href={getExplorerTxLink(entry.txId)} target="_blank" rel="noopener noreferrer">
                          <LuExternalLink size={10} />
                        </Link>
                      </HStack>
                    </VStack>
                  </HStack>

                  <VStack gap={0} align="end">
                    <Text
                      textStyle="sm"
                      fontWeight="semibold"
                      color={isDeposit ? "status.positive.primary" : "status.negative.primary"}>
                      {isDeposit ? "+" : "-"}
                      {formatter.format(Number(entry.amount))} {"B3TR"}
                    </Text>
                    <Text textStyle="xs" color="fg.muted">
                      {t("Balance")}
                      {": "}
                      {formatter.format(Number(entry.newTotal))} {"B3TR"}
                    </Text>
                  </VStack>
                </HStack>
              )
            })}
          </VStack>
        )}
      </VStack>
    </BaseModal>
  )
}
