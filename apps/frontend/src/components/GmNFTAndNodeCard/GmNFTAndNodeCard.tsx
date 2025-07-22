import {
  Card,
  Heading,
  HStack,
  Stack,
  useMediaQuery,
  VStack,
  Flex,
  Box,
  Text,
  Image,
  CardBody,
  LinkOverlay,
  CardFooter,
  LinkBox,
} from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { NotConnectedWallet } from "./components/NotConnectedWallet"
import { useWallet } from "@vechain/vechain-kit"
import { SwapB3trVot3 } from "./components/SwapB3trVot3"
import { FeatureFlagWrapper } from "../FeatureFlagWrapper"
import { FeatureFlag } from "@/constants"
import { useRetrieveProfilIdentity } from "@/app/profile/components/utils"
import { useMemo } from "react"
import { useDomainOrAddress } from "@/hooks"
import { FaChevronRight } from "react-icons/fa6"
import NextLink from "next/link"
import { useGetUserGMs, useParticipatedInGovernance, useGetUserNodes } from "@/api"

export const GmNFTAndNodeCard = () => {
  const { account } = useWallet()
  const { t } = useTranslation()
  const { isConnectedUser, domain, profile, isOnProfilePage, viewMode } = useRetrieveProfilIdentity()
  const domainOrAddress = useDomainOrAddress({ domain: domain ?? "", address: profile ?? "" })
  const { data: userGMs } = useGetUserGMs()
  const { data: nodes } = useGetUserNodes()

  const selectedGmMultiplier = useMemo(() => userGMs?.find(gm => gm.isSelected)?.multiplier || 0, [userGMs])
  const totalPoints = useMemo(() => {
    return nodes?.allNodes?.reduce((acc, node) => acc + node.xNodePoints, 0) || 0
  }, [nodes])

  const { data: hasUserVoted } = useParticipatedInGovernance(profile ?? "")
  const isGMOwned = userGMs && userGMs?.length > 0

  const [isAbove1200] = useMediaQuery("(min-width: 1200px)")
  const [isAbove800] = useMediaQuery("(min-width: 800px)")

  const headingText = useMemo(() => {
    if (!isGMOwned) {
      if (!hasUserVoted) {
        return t(
          isConnectedUser || !isOnProfilePage
            ? "Vote to be a galaxy member"
            : "{{value}} needs to vote to be a galaxy member",
          {
            value: domainOrAddress,
          },
        )
      } else {
        return isConnectedUser
          ? t("Mint GM to be a galaxy member")
          : t("{{value}} needs to mint GM to be a galaxy member", {
              value: domainOrAddress,
            })
      }
    }

    return isConnectedUser || !isOnProfilePage
      ? t("Your galaxy member")
      : t("{{value}} is a galaxy member", { value: domainOrAddress })
  }, [isGMOwned, hasUserVoted, t, isConnectedUser, isOnProfilePage, domainOrAddress])

  if (!account?.address && !viewMode) {
    return <NotConnectedWallet />
  }

  return (
    <Card
      bg="#004CFC"
      rounded="12px"
      p="24px"
      color="white"
      position="relative"
      overflow={"hidden"}
      bgImage="url('/assets/backgrounds/cloud-background.webp')"
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat">
      <Stack gap={8} align="stretch" justify={"stretch"} direction={isAbove1200 ? "row" : "column-reverse"}>
        <VStack flex="3" align={"stretch"} gap="24px">
          <HStack gap="40px" align={"baseline"} justify={"space-between"}>
            <FeatureFlagWrapper
              feature={FeatureFlag.GALAXY_MEMBER_UPGRADES}
              fallback={
                <Heading fontSize="xl" fontWeight={600}>
                  {t("Your Galaxy Member")}
                </Heading>
              }>
              <Heading fontSize="xl" fontWeight={600}>
                {headingText}
              </Heading>
            </FeatureFlagWrapper>
          </HStack>

          <Stack
            gap="2"
            direction={isAbove800 ? "row" : "column"}
            align={isAbove800 ? "center" : "stretch"}
            justify="center">
            <LinkBox flex={1}>
              <Card
                direction={"row"}
                gap="8px"
                border="none"
                bg="#FFFFFF26"
                borderColor={"#FFFFFF33"}
                p="12px 16px"
                rounded="8px">
                <CardBody p="0">
                  <LinkOverlay href={`/profile?tab=gm`} as={NextLink}>
                    <Text fontSize="sm" color="#FFFFFFB2">
                      {t("NFTs")}
                    </Text>
                  </LinkOverlay>
                  <Heading fontSize="1.75rem" textColor="white">
                    {userGMs?.length || 0}
                  </Heading>
                  {selectedGmMultiplier !== undefined && (
                    <Box display="inline-block" p="4px 8px" rounded="8px" bg="#F2F2F269">
                      <Text fontSize="xs" color="#FFFFFFB2" textColor="white" noOfLines={1}>
                        {t("Active NFT {{gmName}}: {{multiplier}}x multiplier", {
                          gmName: userGMs?.find(gm => gm.isSelected)?.metadata?.name,
                          multiplier: selectedGmMultiplier,
                        })}
                      </Text>
                    </Box>
                  )}
                </CardBody>
                <CardFooter alignItems="center" p="0">
                  <FaChevronRight color="white" />
                </CardFooter>
              </Card>
            </LinkBox>
            <Image
              src="/assets/icons/arrow-connection.svg"
              boxSize={"24px"}
              color="#757575"
              alt="arrow connection"
              alignSelf="center"
            />
            <LinkBox flex={1}>
              <Card
                direction={"row"}
                flex={1}
                gap="8px"
                border="none"
                bg="#FFFFFF26"
                borderColor={"#FFFFFF33"}
                p="12px 16px"
                rounded="8px">
                <CardBody p="0">
                  <LinkOverlay href={`/profile?tab=nodes`} as={NextLink}>
                    <Text fontSize="sm" color="#FFFFFFB2">
                      {t("Nodes")}
                    </Text>
                  </LinkOverlay>
                  <Heading fontSize="1.75rem" textColor="white">
                    {nodes?.allNodes?.length}
                  </Heading>
                  <Box display="inline-block" p="4px 8px" rounded="8px" bg="#F2F2F269">
                    <Text fontSize="xs" color="#FFFFFFB2" textColor="white">
                      {t("Total: {{value}} points", { value: totalPoints })}
                    </Text>
                  </Box>
                </CardBody>
                <CardFooter alignItems="center" p="0">
                  <FaChevronRight color="white" />
                </CardFooter>
              </Card>
            </LinkBox>
          </Stack>
        </VStack>
        {!isOnProfilePage && <Flex w={isAbove800 ? "1px" : "auto"} h={isAbove800 ? "auto" : "1px"} bg="#FFFFFF80" />}
        {account?.address && !isOnProfilePage && <SwapB3trVot3 address={account?.address} />}
      </Stack>
    </Card>
  )
}
