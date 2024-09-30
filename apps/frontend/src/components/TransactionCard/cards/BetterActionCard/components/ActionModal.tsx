import { SustainabilityActionsResponse, useXApps } from "@/api"
import { Box, Heading, Image, Link, ModalBody, ModalCloseButton, UseDisclosureProps } from "@chakra-ui/react"
import { Modal, ModalOverlay, VStack, HStack, Text, Card, CardBody } from "@chakra-ui/react"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { EmbeddedTweet, useTweet } from "react-tweet"
import { CustomModalContent } from "@/components/CustomModalContent"

const compactFormatter = getCompactFormatter(2)

type Props = {
  actionModal: UseDisclosureProps
  action: SustainabilityActionsResponse["data"][number]
}
export const ActionModal = ({ actionModal, action }: Props) => {
  const { data: apps } = useXApps()
  const { t } = useTranslation()

  const app = useMemo(() => {
    return apps?.find(app => app.id === action?.appId ?? "")
  }, [apps, action?.appId])

  const isTweet = useMemo(() => {
    return action?.proof?.proof?.link?.includes("x.com") || action?.proof?.proof?.link?.includes("twitter.com")
  }, [action?.proof?.proof?.link])

  const tweetId = useMemo(() => {
    if (isTweet) {
      const match = action?.proof?.proof?.link?.match(/\/status\/(\d+)/)
      return match ? match[1] : null
    }
    return null
  }, [action?.proof?.proof?.link, isTweet])

  const { data: tweet } = useTweet(tweetId ?? undefined)

  const proof = useMemo(() => {
    if (isTweet && tweet) {
      return (
        <Box>
          <EmbeddedTweet key={tweet?.id_str} tweet={tweet} />
        </Box>
      )
    }
    return (
      <Link href={action?.proof?.proof?.link} isExternal>
        <Text fontSize="sm">{action?.proof?.proof?.link}</Text>
      </Link>
    )
  }, [action?.proof?.proof?.link, isTweet, tweet])

  return (
    <Modal isOpen={actionModal.isOpen ?? false} onClose={actionModal.onClose ?? (() => {})}>
      <ModalOverlay />
      <CustomModalContent>
        <ModalBody p={6}>
          <ModalCloseButton />
          <VStack align="stretch" spacing={4}>
            <Text fontSize="sm" color="black" bg="#F8F8F8" py={1} px={3} borderRadius="full" alignSelf="flex-start">
              {dayjs.unix(action?.blockTimestamp ?? 0).fromNow()}
            </Text>
            <Card variant="filled">
              <CardBody p={4}>
                <VStack align="stretch" spacing={1}>
                  <HStack>
                    <Text fontSize="3xl" fontWeight="bold">
                      {"+"}
                      {compactFormatter.format(Number(action.amount))}
                    </Text>
                    <Image h="30px" w="30px" src="/images/b3tr-token.png" alt="b3tr-token" />
                  </HStack>
                  <HStack gap={1}>
                    <Text fontSize="md">{t("Better action on")}</Text>
                    <Text fontSize="md" fontWeight="600">
                      {app?.name}
                    </Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
            <VStack align="stretch" spacing={2}>
              <Heading fontSize="lg">{t("Sustainability proof")}</Heading>
              <VStack align="stretch" spacing={0}>
                <Text fontSize="sm">{action?.proof?.proof?.text}</Text>
                {proof}
              </VStack>
            </VStack>
            <VStack align="stretch" spacing={4}>
              <Heading fontSize="lg">{t("Transaction information")}</Heading>
              <HStack justify="space-between">
                <Text fontWeight="600">{t("Block")}</Text>
                <Text color="#6A6A6A">{action?.blockNumber}</Text>
              </HStack>
            </VStack>
          </VStack>
        </ModalBody>
      </CustomModalContent>
    </Modal>
  )
}
