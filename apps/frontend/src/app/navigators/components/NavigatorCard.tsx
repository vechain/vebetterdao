import { Badge, Button, Card, HStack, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter, humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { LuUsers } from "react-icons/lu"

import { NavigatorEntityFormatted } from "@/api/indexer/navigators/useNavigators"
import { AddressIcon } from "@/components/AddressIcon"

const formatter = getCompactFormatter(2)

type Props = {
  navigator: NavigatorEntityFormatted
  onDelegate?: () => void
}

export const NavigatorCard = ({ navigator: nav, onDelegate }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: domainData, isLoading: domainLoading } = useVechainDomain(nav.address)
  const isActive = nav.status === "ACTIVE"

  const displayName = domainData?.domain ? humanDomain(domainData.domain, 15, 10) : humanAddress(nav.address, 8, 6)

  return (
    <Card.Root
      variant="outline"
      w="full"
      borderRadius="xl"
      cursor="pointer"
      _hover={{ borderColor: "border.emphasized" }}
      onClick={() => router.push(`/navigators/${nav.address}`)}>
      <Card.Body>
        <VStack gap={3} align="stretch">
          <HStack justify="space-between" align="start">
            <HStack gap={2}>
              <AddressIcon address={nav.address} boxSize={10} borderRadius="full" />
              <VStack gap={0} align="start">
                <Skeleton loading={domainLoading}>
                  <Text textStyle="sm" fontWeight="semibold">
                    {displayName}
                  </Text>
                </Skeleton>
                {!isActive && (
                  <Badge colorPalette={nav.status === "EXITING" ? "yellow" : "red"} size="xs">
                    {nav.status}
                  </Badge>
                )}
              </VStack>
            </HStack>
            <VStack gap={0} align="end">
              <Text textStyle="sm" fontWeight="bold">
                {formatter.format(Number(nav.stakeFormatted))}
              </Text>
              <Text textStyle="xs" color="fg.muted">
                {t("B3TR")}
              </Text>
            </VStack>
          </HStack>

          <Text textStyle="xs" color="fg.muted" lineClamp={2} minH="32px">
            {nav.metadataURI || t("No description provided")}
          </Text>

          <HStack justify="space-between" align="center">
            <HStack gap={1}>
              <LuUsers size={14} />
              <Text textStyle="xs" color="fg.muted">
                {t("{{count}} citizens", { count: nav.citizenCount })}
              </Text>
            </HStack>
            {isActive && (
              <Button
                size="xs"
                variant="outline"
                onClick={e => {
                  e.stopPropagation()
                  onDelegate?.()
                }}>
                {t("Delegate")}
              </Button>
            )}
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
