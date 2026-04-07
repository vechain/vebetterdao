import { Card, HStack, Icon, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { LuUsers } from "react-icons/lu"

import { useNavigatorCitizens } from "@/api/indexer/navigators/useNavigatorCitizens"
import { AddressWithProfilePicture } from "@/app/components/AddressWithProfilePicture/AddressWithProfilePicture"
import { EmptyState } from "@/components/ui/empty-state"

const formatter = getCompactFormatter(2)

type Props = {
  address: string
}

export const NavigatorCitizensTab = ({ address }: Props) => {
  const { t } = useTranslation()
  const { data: citizens, isLoading } = useNavigatorCitizens(address)

  if (isLoading) {
    return (
      <VStack gap={3} align="stretch" pt={4}>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} h="60px" borderRadius="xl" />
        ))}
      </VStack>
    )
  }

  if (!citizens || citizens.length === 0) {
    return (
      <Card.Root variant="primary" w="full" mt={4}>
        <Card.Title textStyle="xl">{t("Citizens")}</Card.Title>
        <Card.Body asChild>
          <EmptyState
            title={t("No citizens yet")}
            description={t("No one has delegated to this navigator yet.")}
            icon={
              <Icon boxSize={10} color="actions.secondary.text-lighter">
                <LuUsers />
              </Icon>
            }
          />
        </Card.Body>
      </Card.Root>
    )
  }

  return (
    <Card.Root variant="primary" w="full" mt={4}>
      <Card.Title textStyle="xl">
        <HStack gap={2}>
          <LuUsers size={18} />
          {t("Citizens")}
          <Text textStyle="sm" color="fg.muted" fontWeight="normal">
            {"("}
            {citizens.length}
            {")"}
          </Text>
        </HStack>
      </Card.Title>
      <Card.Body>
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
              <HStack gap={4}>
                <VStack gap={0} align="end">
                  <Text textStyle="sm" fontWeight="semibold">
                    {formatter.format(Number(citizen.amountFormatted))} {t("VOT3")}
                  </Text>
                  <Text textStyle="xs" color="fg.muted">
                    {t("Since {{date}}", {
                      date: new Date(citizen.delegatedAt * 1000).toLocaleDateString(),
                    })}
                  </Text>
                </VStack>
              </HStack>
            </HStack>
          ))}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
