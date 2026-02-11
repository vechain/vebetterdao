import { Text, Button, Image, Flex, VStack, Heading, Alert, HStack, NumberInput, IconButton, Box, Icon } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { ClockSolid, Minus, Plus } from "iconoir-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useCanUnendorse } from "@/api/contracts/xApps/hooks/endorsement/useCanUnendorse"
import { useXAppMetadata } from "@/api/contracts/xApps/hooks/useXAppMetadata"
import { BaseModal } from "@/components/BaseModal"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { useGetUserNodes, UserNode } from "../../../api/contracts/xNodes/useGetUserNodes"
import { useUnendorseApp } from "../../../hooks/xApp/useUnendorseApp"
import { convertUriToUrl } from "../../../utils/uri"

type Props = {
  appId: string
  nodeId: string
  isOpen: boolean
  onClose: () => void
}

export const UnendorseAppModal = ({ appId, nodeId, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { isTxModalOpen } = useTransactionModal()
  const { data: userNodesInfo } = useGetUserNodes()
  const node = userNodesInfo?.nodesManagedByUser?.find((n: UserNode) => n.id.toString() === nodeId)
  const { data: appMetadata } = useXAppMetadata(appId)
  const { data: canUnendorse } = useCanUnendorse(nodeId, appId)

  const currentPoints = useMemo(() => {
    return node?.activeEndorsements.find(e => e.appId === appId)?.points ?? BigInt(0)
  }, [node, appId])

  const [points, setPoints] = useState<string>("0")

  const handleSuccess = useCallback(() => {
    setPoints("0")
    onClose()
  }, [onClose])

  const unendorseAppMutation = useUnendorseApp({
    appId,
    nodeId,
    points,
    userAddress: account?.address ?? "",
    onSuccess: handleSuccess,
  })

  const handleUnendorsement = useCallback(() => {
    unendorseAppMutation.sendTransaction()
  }, [unendorseAppMutation])

  const handleMaxPoints = useCallback(() => {
    setPoints(currentPoints.toString())
  }, [currentPoints])

  const handlePointsChange = useCallback((details: { value: string; valueAsNumber: number }) => {
    setPoints(details.value || "0")
  }, [])

  const handleClose = useCallback(() => {
    setPoints("0")
    onClose()
  }, [onClose])

  const isDisabled = Number(points) <= 0 || canUnendorse === false

  return (
    <BaseModal isOpen={isOpen && !isTxModalOpen} onClose={handleClose} modalProps={{ size: "lg" }}>
      <VStack gap={6} align="flex-start" w="full">
        <Heading textStyle="2xl">{t("Remove endorsement")}</Heading>

        <Flex position="relative" alignSelf="center">
          <Image
            src={appMetadata?.logo ? convertUriToUrl(appMetadata.logo) : ""}
            alt={appMetadata?.name ?? ""}
            w="28"
            h="28"
            rounded="md"
          />
          <Text
            position="absolute"
            top={"-4"}
            right={"-4"}
            px={2}
            py={0.5}
            bg="white"
            borderRadius="full"
            textStyle="2xl"
            color="status.negative.primary">
            {"-"}
            {currentPoints.toString()}
          </Text>
        </Flex>

        <VStack gap={2} align="stretch" w="full">
          <HStack justify="space-between">
            <Text textStyle="sm" fontWeight="semibold" color="text.subtle">
              {t("Remove points")}
            </Text>
            <Text textStyle="md" fontWeight="semibold">
              {currentPoints.toString()} {t("pts endorsed")}
            </Text>
          </HStack>

          <NumberInput.Root
            value={points}
            onValueChange={handlePointsChange}
            min={0}
            max={Number(currentPoints)}
            step={1}
            clampValueOnBlur>
            <HStack gap={3}>
              <NumberInput.DecrementTrigger asChild>
                <IconButton
                  aria-label={t("Decrease points")}
                  rounded="full"
                  color="actions.secondary.text"
                  bg="actions.secondary.default"
                  _hover={{ bg: "actions.secondary.hover" }}
                  size="xs"
                  boxSize={9}
                  p={1}
                  flexShrink={0}>
                  <Minus strokeWidth={2} />
                </IconButton>
              </NumberInput.DecrementTrigger>
              <Box flex={1} position="relative">
                <NumberInput.Input
                  placeholder="0"
                  textAlign="center"
                  borderRadius="xl"
                  h={9}
                  bg="bg.primary"
                  borderColor="border.primary"
                  borderWidth="1px"
                  pl={3}
                  pr={10}
                />
                <Box position="absolute" right={2.5} top="50%" transform="translateY(-50%)" pointerEvents="none">
                  <Text color="text.default" textStyle="md">
                    {t("pts")}
                  </Text>
                </Box>
              </Box>
              <NumberInput.IncrementTrigger asChild>
                <IconButton
                  aria-label={t("Increase points")}
                  rounded="full"
                  color="actions.secondary.text"
                  bg="actions.secondary.default"
                  _hover={{ bg: "actions.secondary.hover" }}
                  size="xs"
                  boxSize={9}
                  p={1}
                  flexShrink={0}>
                  <Plus strokeWidth={2} />
                </IconButton>
              </NumberInput.IncrementTrigger>
            </HStack>
          </NumberInput.Root>

          <Button variant="plain" size="sm" color="actions.primary.default" onClick={handleMaxPoints} mx="auto">
            {t("Max points")}
          </Button>
        </VStack>

        {canUnendorse === false && (
          <Alert.Root status="warning" borderRadius="lg">
            <Alert.Indicator asChild>
              <Icon as={ClockSolid} color="status.warning.primary" />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Title>{t("You cannot unendorse this app yet. Cooldown period is active.")}</Alert.Title>
            </Alert.Content>
          </Alert.Root>
        )}

        <Alert.Root status="error" borderRadius="lg">
          <Alert.Indicator asChild>
            <Icon as={ClockSolid} color="status.negative.primary" />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Title>
              {t("Removing your endorsement from an app may result in it no longer being selected for allocations.")}
            </Alert.Title>
          </Alert.Content>
        </Alert.Root>

        <VStack align="stretch" w="full">
          <Button colorPalette="red" w="full" onClick={handleUnendorsement} disabled={isDisabled}>
            {t("Unendorse now")}
          </Button>
          <Button variant="ghost" color="status.negative.primary" w="full" onClick={handleClose}>
            {t("Cancel")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}
