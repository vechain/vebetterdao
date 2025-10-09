import { HStack, Text, VStack } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { useCurrentAppInfo } from "../../../hooks/useCurrentAppInfo"
import { Clipboard } from "@/components/ui/clipboard"

export const AppReceiverAddress = () => {
  const { t } = useTranslation()
  const { app } = useCurrentAppInfo()

  return (
    <VStack align={"stretch"}>
      <Text textStyle={"sm"} color="text.subtle">
        {t("Treasury address")}
      </Text>
      <HStack>
        <Clipboard value={app?.teamWalletAddress || ""} />
        <Text textStyle={"sm"}>{humanAddress(app?.teamWalletAddress || "", 4, 6)}</Text>
      </HStack>
    </VStack>
  )
}
