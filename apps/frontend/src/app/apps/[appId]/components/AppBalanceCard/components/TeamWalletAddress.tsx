import { Flex, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { UilCheck, UilCopy } from "@iconscout/react-unicons"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { InfoCircle } from "iconoir-react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { Tooltip } from "@/components/ui/tooltip"

export const TeamWalletAddress = ({ teamWalletAddress }: { teamWalletAddress: string }) => {
  const { t } = useTranslation()
  const [showCopiedLink, setShowCopiedLink] = useState(false)
  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(teamWalletAddress)
    setShowCopiedLink(true)
    setTimeout(() => {
      setShowCopiedLink(false)
    }, 2000)
  }, [teamWalletAddress])
  return (
    <VStack w={"full"} gap={4} align={"flex-start"}>
      <VStack align={"stretch"} w={"full"} justify={"start"} css={{ "--tooltip-bg": "lightgray" }}>
        <Tooltip
          contentProps={{ css: { "--tooltip-bg": "var(--vbd-colors-bg-inverted)" } }}
          content={
            "This is the wallet address where the funds will be sent. You can change this address in the app settings."
          }>
          <Flex w={"fit-content"} justifyContent={"center"} mt={1}>
            <HStack alignSelf={"center"} w={"fit-content"}>
              <Text textStyle={"sm"} color="text.subtle" w={"full"}>
                {t("Treasury address")}
              </Text>
              <Icon as={InfoCircle} color="icon.default" />
            </HStack>
          </Flex>
        </Tooltip>
        <HStack>
          {showCopiedLink ? (
            <UilCheck size={"18px"} color="status.positive.primary" />
          ) : (
            <UilCopy size={"18px"} color="text.subtle" onClick={handleCopyLink} cursor="pointer" />
          )}
          <Text textStyle={"xl"}>{humanAddress(teamWalletAddress, 6, 6)}</Text>
        </HStack>
      </VStack>
    </VStack>
  )
}
