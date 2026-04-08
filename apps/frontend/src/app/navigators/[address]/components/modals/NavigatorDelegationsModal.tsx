import { HStack, Icon, Link, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { LuArrowDownLeft, LuArrowRight, LuArrowUpRight, LuExternalLink } from "react-icons/lu"

import { DelegationEventFormatted, useNavigatorDelegations } from "@/api/indexer/navigators/useNavigatorDelegations"
import { AddressWithProfilePicture } from "@/app/components/AddressWithProfilePicture/AddressWithProfilePicture"
import { BaseModal } from "@/components/BaseModal"
import Vot3Svg from "@/components/Icons/svg/vot3-icon.svg"
import { EmptyState } from "@/components/ui/empty-state"
import { getExplorerTxLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"

const formatter = getCompactFormatter(2)

const getEventLabel = (eventType: DelegationEventFormatted["eventType"], isPositive: boolean) => {
  if (eventType === "B3TR_DelegationCreated") return "Created new delegation"
  if (eventType === "B3TR_DelegationRemoved") return "Exited delegation"
  return isPositive ? "Increased delegation" : "Decreased delegation"
}

type Props = {
  address?: string
  isOpen: boolean
  onClose: () => void
}

export const NavigatorDelegationsModal = ({ address, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { data, isLoading } = useNavigatorDelegations(address ? { navigator: address } : {})

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} ariaTitle={t("Delegation History")} showCloseButton>
      <VStack gap={4} align="stretch" py={4} px={2}>
        <Text textStyle="lg" fontWeight="semibold">
          {t("Delegation History")}
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
            title={t("No delegation activity")}
            description={t("No delegation events found for this navigator.")}
            icon={
              <Icon boxSize={10} color="actions.secondary.text-lighter">
                <Vot3Svg />
              </Icon>
            }
          />
        )}

        {!isLoading && data && data.length > 0 && (
          <VStack gap={0} align="stretch">
            {data.map((event, i) => {
              const deltaNum = Number(event.deltaFormatted)
              const isPositive = deltaNum >= 0
              const label = getEventLabel(event.eventType, isPositive)

              return (
                <HStack
                  key={`${event.txId}-${i}`}
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
                      bg={isPositive ? "status.positive.subtle" : "status.negative.subtle"}
                      color={isPositive ? "status.positive.primary" : "status.negative.primary"}
                      flexShrink={0}>
                      {isPositive ? <LuArrowDownLeft size={16} /> : <LuArrowUpRight size={16} />}
                    </HStack>
                    <VStack gap={0} align="start">
                      <Text textStyle="sm" fontWeight="semibold">
                        {t(label)}
                      </Text>
                      <HStack gap={2} flexWrap="wrap">
                        <AddressWithProfilePicture address={event.citizen} />
                        {!address && (
                          <>
                            <LuArrowRight size={12} />
                            <AddressWithProfilePicture address={event.navigator} />
                          </>
                        )}
                        <Link href={getExplorerTxLink(event.txId)} target="_blank" rel="noopener noreferrer">
                          <LuExternalLink size={10} />
                        </Link>
                      </HStack>
                    </VStack>
                  </HStack>

                  <VStack gap={0} align="end">
                    <Text
                      textStyle="sm"
                      fontWeight="semibold"
                      color={isPositive ? "status.positive.primary" : "status.negative.primary"}>
                      {isPositive ? "+" : "-"}
                      {formatter.format(Math.abs(deltaNum))} {"VOT3"}
                    </Text>
                    <Text textStyle="xs" color="fg.muted">
                      {new Date(event.blockTimestamp * 1000).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
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
