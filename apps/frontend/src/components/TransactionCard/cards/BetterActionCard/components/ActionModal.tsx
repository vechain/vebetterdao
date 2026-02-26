/* eslint-disable react/jsx-no-literals */
import { VStack, HStack, Text, Card, Heading, Image, Link, UseDisclosureProps } from "@chakra-ui/react"
import { UilArrowUpRight } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useTweet } from "react-tweet"

import { ThemedTweet } from "@/app/apps/[appId]/components/AppTweets/components/ThemedTweet"
import { BaseModal } from "@/components/BaseModal"
import { getExplorerTxLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"

import { useXApps } from "../../../../../api/contracts/xApps/hooks/useXApps"
import { UserB3trActions } from "../../../../../api/indexer/actions/useUsersB3trActions"

const compactFormatter = getCompactFormatter(2)
type Props = {
  actionModal: UseDisclosureProps
  proof?: UserB3trActions[number]["proof"]
  appId?: string
  blockTimestamp?: number
  blockNumber?: number
  b3trAmount?: number
  txId?: string
}
export const ActionModal = ({ actionModal, proof, appId, blockTimestamp, blockNumber, b3trAmount, txId }: Props) => {
  const { data: apps } = useXApps()
  const { t } = useTranslation()
  const app = useMemo(() => {
    return apps?.allApps.find(app => app.id === (appId ?? ""))
  }, [apps, appId])
  const isTweet = useMemo(() => {
    try {
      const url = new URL(proof?.proof?.link ?? "")
      const allowedHosts = ["twitter.com", "x.com"]
      return allowedHosts.includes(url.host)
    } catch {
      return false
    }
  }, [proof?.proof?.link])
  const tweetId = useMemo(() => {
    if (isTweet) {
      const match = proof?.proof?.link?.match(/\/status\/(\d+)/)
      return match ? match[1] : null
    }
    return null
  }, [isTweet, proof?.proof?.link])

  const { data: tweet } = useTweet(tweetId ?? undefined)

  const isProof = useMemo(() => {
    if (!proof || typeof proof !== "object") {
      return false
    }

    return Object.keys(proof).length > 0
  }, [proof])

  const renderProof = useMemo(() => {
    if (isTweet && tweet) {
      return <ThemedTweet tweet={tweet} />
    }
    if (proof?.proof?.image)
      return (
        <Image src={proof.proof.image} alt="proof-image" borderRadius="md" w={["auto", "50%"]} objectFit={"contain"} />
      )

    if (proof?.proof?.video)
      return (
        <video width="320" height="240" controls>
          <source src={proof.proof.video} type="video/mp4" />
          {"Your browser does not support the video tag."}
        </video>
      )

    if (proof?.proof?.text) return <Text textStyle="sm">{proof?.proof?.text}</Text>

    return (
      <Link href={proof?.proof?.link} target="_blank" rel="noopener noreferrer">
        <Text textStyle="sm">{proof?.proof?.link}</Text>
      </Link>
    )
  }, [proof, isTweet, tweet])

  return (
    <BaseModal
      isOpen={actionModal.open ?? false}
      onClose={actionModal.onClose ?? (() => {})}
      ariaTitle="ActionModal"
      ariaDescription="ActionModal"
      showCloseButton>
      <VStack align="stretch" gap={4}>
        <Text textStyle="sm" color="black" bg="#F8F8F8" py={1} px={3} borderRadius="full" alignSelf="flex-start">
          {dayjs.unix(blockTimestamp ?? 0).fromNow()}
        </Text>
        {b3trAmount && (
          <Card.Root variant="primary">
            <Card.Body p={4}>
              <VStack align="stretch" gap={1}>
                <HStack>
                  <Heading textStyle="3xl">{compactFormatter.format(Number(b3trAmount ?? 0))}</Heading>
                  <Image h="30px" w="30px" src="/assets/tokens/b3tr-token.svg" alt="b3tr-token" />
                </HStack>
                <HStack gap={1}>
                  <Heading textStyle="md">{t("Better action on")}</Heading>
                  <Heading textStyle="md" fontWeight="semibold">
                    {app?.name}
                  </Heading>
                </HStack>
              </VStack>
            </Card.Body>
          </Card.Root>
        )}
        {isProof && (
          <VStack align="stretch" gap={2}>
            <Heading textStyle="lg">{t("Sustainability proof")}</Heading>
            <VStack align="stretch" gap={2}>
              <Text textStyle="sm">{proof?.description}</Text>
              {renderProof}
            </VStack>
          </VStack>
        )}
        <VStack align="stretch" gap={4}>
          <Heading textStyle="lg">{t("Transaction information")}</Heading>
          <HStack justify="space-between">
            <Text fontWeight="semibold">{t("Block")}</Text>
            <Text color="text.subtle">{blockNumber}</Text>
          </HStack>
        </VStack>
        {txId && (
          <Link
            display="flex"
            justifyContent={"center"}
            variant="plain"
            target="_blank"
            rel="noopener noreferrer"
            href={getExplorerTxLink(txId)}
            gap={4}
            w={"full"}
            alignItems={"center"}
            mt={4}
            color="brand.primary"
            cursor={"pointer"}>
            <Text textStyle="md" fontWeight="semibold">
              {t("See more details on")} Vechain Stats
            </Text>
            <UilArrowUpRight size={16} />
          </Link>
        )}
      </VStack>
    </BaseModal>
  )
}
