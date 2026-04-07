import { HStack, Icon, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { LuUsers } from "react-icons/lu"

import { useNavigatorCitizens } from "@/api/indexer/navigators/useNavigatorCitizens"
import { AddressWithProfilePicture } from "@/app/components/AddressWithProfilePicture/AddressWithProfilePicture"
import { BaseModal } from "@/components/BaseModal"
import { EmptyState } from "@/components/ui/empty-state"

const formatter = getCompactFormatter(2)

type Props = {
  address: string
  isOpen: boolean
  onClose: () => void
}

export const NavigatorCitizensModal = ({ address, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { data: citizens, isLoading } = useNavigatorCitizens(address)

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} ariaTitle={t("Citizens")} showCloseButton>
      <VStack gap={4} align="stretch" py={4} px={2}>
        <HStack gap={2}>
          <LuUsers size={18} />
          <Text textStyle="lg" fontWeight="semibold">
            {t("Citizens")}
          </Text>
          {citizens && (
            <Text textStyle="sm" color="fg.muted">
              {"(" + citizens.length + ")"}
            </Text>
          )}
        </HStack>

        {isLoading && (
          <VStack gap={3} align="stretch">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} h="60px" borderRadius="xl" />
            ))}
          </VStack>
        )}

        {!isLoading && (!citizens || citizens.length === 0) && (
          <EmptyState
            title={t("No citizens yet")}
            description={t("No one has delegated to this navigator yet.")}
            icon={
              <Icon boxSize={10} color="actions.secondary.text-lighter">
                <LuUsers />
              </Icon>
            }
          />
        )}

        {!isLoading && citizens && citizens.length > 0 && (
          <VStack gap={0} align="stretch">
            {citizens.map(citizen => (
              <HStack
                key={citizen.address}
                justify="space-between"
                py={3}
                borderBottomWidth="1px"
                borderColor="border.primary"
                _last={{ borderBottomWidth: 0 }}
                flexWrap="wrap"
                gap={2}>
                <AddressWithProfilePicture address={citizen.address} />
                <VStack gap={0} align="end">
                  <Text textStyle="sm" fontWeight="semibold">
                    {formatter.format(Number(citizen.amountFormatted))} {t("VOT3")}
                  </Text>
                  <Text textStyle="xs" color="fg.muted">
                    {t("Since {{date}}", {
                      date: new Date(citizen.delegatedAt * 1000).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }),
                    })}
                  </Text>
                </VStack>
              </HStack>
            ))}
          </VStack>
        )}
      </VStack>
    </BaseModal>
  )
}
