import { Button, Card, Flex, Heading, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuArrowRight } from "react-icons/lu"

import { useGetUserGMs } from "@/api/contracts/galaxyMember/hooks/useGetUserGMs"
import { useGMRequiredByProposalType } from "@/api/contracts/governance/hooks/useGMRequiredByProposalType"
import { gmNfts } from "@/constants/gmNfts"
import { useBreakpoints } from "@/hooks/useBreakpoints"
import { ProposalType } from "@/types/proposals"

export const InsufficientGMBanner = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { isMobile } = useBreakpoints()
  const { data: gmRequired } = useGMRequiredByProposalType(ProposalType.GRANT)
  const { data: userGMs } = useGetUserGMs()

  const userHighestGm = useMemo(() => {
    if (!userGMs?.length) return null
    return userGMs.reduce((highest, gm) => (Number(gm.tokenLevel) > Number(highest.tokenLevel) ? gm : highest))
  }, [userGMs])

  const requiredGmInfo = useMemo(() => {
    const level = gmRequired ?? 1
    return gmNfts[Math.max(level - 1, 0)]
  }, [gmRequired])

  const userGmInfo = useMemo(() => {
    if (!userHighestGm) return null
    const level = Number(userHighestGm.tokenLevel)
    return gmNfts[Math.max(level - 1, 0)]
  }, [userHighestGm])

  const handleUpgrade = useCallback(() => {
    if (userHighestGm) {
      router.push(`/galaxy-member/${userHighestGm.tokenId}`)
    } else {
      router.push("/allocations/round")
    }
  }, [router, userHighestGm])

  const buttonText = userHighestGm ? t("Upgrade GM") : t("Get GM NFT")

  if (isMobile) {
    return (
      <Card.Root variant="primary" w="full" p={4}>
        <VStack gap={4} align="stretch">
          <HStack gap={3}>
            <Image
              src={requiredGmInfo?.image ?? "/assets/images/nft-levels/0.webp"}
              alt="GM NFT"
              width={60}
              height={60}
              style={{ borderRadius: "10px" }}
            />
            <VStack align="start" gap={1} flex={1}>
              <Heading size="sm" textStyle="heading">
                {t("GM Level Required")}
              </Heading>
              <Text textStyle="sm" color="text.subtle">
                {t("Level {{level}} ({{name}}) needed to apply", {
                  level: gmRequired ?? 1,
                  name: requiredGmInfo?.name ?? "Earth",
                })}
              </Text>
            </VStack>
          </HStack>
          {userGmInfo && (
            <Text textStyle="xs" color="text.subtle">
              {t("Your current level: {{level}} ({{name}})", {
                level: userHighestGm?.tokenLevel,
                name: userGmInfo.name,
              })}
            </Text>
          )}
          <Button variant="primary" size="sm" onClick={handleUpgrade} w="full">
            {buttonText}
            <Icon as={LuArrowRight} ml={1} />
          </Button>
        </VStack>
      </Card.Root>
    )
  }

  return (
    <Card.Root variant="primary" w="full" borderRadius="xl" overflow="hidden">
      <Flex h="full">
        <VStack flex="1" p={8} alignItems="flex-start" gap={4}>
          <VStack alignItems="flex-start" gap={2}>
            <Text textStyle="sm" fontWeight="bold" color="text.subtle">
              {t("Requirement")}
            </Text>
            <Heading size="xl" textStyle="heading">
              {t("Upgrade your GM Level to apply")}
            </Heading>
            <Text textStyle="sm" color="text.subtle">
              {t("To apply for a grant, you need a Galaxy Member NFT at level {{level}} ({{name}}) or higher.", {
                level: gmRequired ?? 1,
                name: requiredGmInfo?.name ?? "Earth",
              })}
            </Text>
            {userGmInfo && (
              <Text textStyle="sm" color="text.subtle">
                {t("Your current level: {{level}} ({{name}})", {
                  level: userHighestGm?.tokenLevel,
                  name: userGmInfo.name,
                })}
              </Text>
            )}
          </VStack>
          <Button variant="primary" onClick={handleUpgrade}>
            {buttonText}
            <Icon as={LuArrowRight} ml={1} />
          </Button>
        </VStack>
        <Flex bg="b3tr-balance-bg" w="25%" alignItems="center" justifyContent="center" p={6}>
          <Image
            src={requiredGmInfo?.image ?? "/assets/images/nft-levels/0.webp"}
            alt="Required GM Level"
            width={140}
            height={140}
            style={{ borderRadius: "10px" }}
          />
        </Flex>
      </Flex>
    </Card.Root>
  )
}
