import { Flex, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { InfoCircle } from "iconoir-react"
import { useTranslation } from "react-i18next"

import { Clipboard } from "@/components/ui/clipboard"
import { Tooltip } from "@/components/ui/tooltip"

export const TeamWalletAddress = ({ teamWalletAddress }: { teamWalletAddress: string }) => {
  const { t } = useTranslation()
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
          <Clipboard value={teamWalletAddress} />
          <Text textStyle={"xl"}>{humanAddress(teamWalletAddress, 6, 6)}</Text>
        </HStack>
      </VStack>
    </VStack>
  )
}
