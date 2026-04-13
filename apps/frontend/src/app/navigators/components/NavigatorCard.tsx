import { Badge, Button, Card, HStack, Icon, Separator, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter, humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useGetTextRecords, useVechainDomain, useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { FaXTwitter } from "react-icons/fa6"
import { LuSettings, LuUsers } from "react-icons/lu"

import { useIsNavigator } from "@/api/contracts/navigatorRegistry/hooks/useIsNavigator"
import { NavigatorEntityFormatted } from "@/api/indexer/navigators/useNavigators"
import { AddressIcon } from "@/components/AddressIcon"
import B3trSvg from "@/components/Icons/svg/b3tr.svg"
import Vot3Svg from "@/components/Icons/svg/vot3-icon.svg"

const formatter = getCompactFormatter(2)

type Props = {
  navigator: NavigatorEntityFormatted
  onDelegate?: (navigator: NavigatorEntityFormatted) => void
}

export const NavigatorCard = ({ navigator: nav, onDelegate }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const { data: isNavigator } = useIsNavigator()
  const { data: domainData, isLoading: domainLoading } = useVechainDomain(nav.address)
  const { data: textRecords } = useGetTextRecords(domainData?.domain)
  const isActive = nav.status === "ACTIVE"
  const isOwnCard = account?.address?.toLowerCase() === nav.address.toLowerCase()

  const displayName = domainData?.domain ? humanDomain(domainData.domain, 15, 10) : humanAddress(nav.address, 8, 6)
  const twitterHandle = textRecords?.["com.x"]
  const bio = textRecords?.description

  return (
    <Card.Root
      variant="outline"
      w="full"
      borderRadius="xl"
      cursor="pointer"
      _hover={{ borderColor: "border.emphasized" }}
      onClick={() => router.push(`/navigators/${nav.address}`)}>
      <Card.Body>
        <VStack gap={3} align="stretch" justify="space-between" h="full">
          <VStack gap={6} align="stretch">
            <HStack justify="space-between" align="center">
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
              <HStack gap={2}>
                {twitterHandle && (
                  <HStack
                    gap={1}
                    color="fg.muted"
                    _hover={{ color: "fg" }}
                    onClick={e => {
                      e.stopPropagation()
                      window.open(`https://x.com/${twitterHandle}`, "_blank")
                    }}>
                    <FaXTwitter size={14} />
                  </HStack>
                )}
                {isOwnCard && isNavigator ? (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={e => {
                      e.stopPropagation()
                      router.push(`/navigators/${nav.address}`)
                    }}>
                    <LuSettings />
                    {t("Manage")}
                  </Button>
                ) : (
                  !isNavigator &&
                  isActive &&
                  onDelegate && (
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={e => {
                        e.stopPropagation()
                        onDelegate(nav)
                      }}>
                      {t("Delegate")}
                    </Button>
                  )
                )}
              </HStack>
            </HStack>

            <Text textStyle="xs" color="fg.muted" lineClamp={2}>
              {bio || t("No bio provided")}
            </Text>
          </VStack>

          <VStack gap={3} align="stretch">
            <HStack gap={3}>
              <HStack gap={1}>
                <Icon boxSize={5} ml="-1">
                  <B3trSvg />
                </Icon>
                <Text textStyle="xs" fontWeight="semibold">
                  {formatter.format(Number(nav.stakeFormatted))}
                </Text>
                <Text textStyle="xs" color="fg.muted">
                  {t("B3TR staked")}
                </Text>
              </HStack>
              <Separator orientation="vertical" height="50%" />
              <HStack gap={1}>
                <Icon boxSize={5}>
                  <Vot3Svg />
                </Icon>
                <Text textStyle="xs" fontWeight="semibold">
                  {formatter.format(Number(nav.totalDelegatedFormatted))}
                </Text>
                <Text textStyle="xs" color="fg.muted">
                  {t("VOT3 delegated")}
                </Text>
              </HStack>
            </HStack>

            <HStack gap={1}>
              <LuUsers size={14} color="var(--chakra-colors-fg-muted)" />
              <Text textStyle="xs" color="fg.muted">
                {t("Trusted by {{count}} citizens", { count: nav.citizenCount })}
              </Text>
            </HStack>
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
