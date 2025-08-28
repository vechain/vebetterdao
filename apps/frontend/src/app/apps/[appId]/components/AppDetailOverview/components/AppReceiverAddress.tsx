import { HStack, Text, VStack } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { useCurrentAppInfo } from "../../../hooks/useCurrentAppInfo"
import { UilCheck, UilCopy } from "@iconscout/react-unicons"
import { useCallback, useState } from "react"

export const AppReceiverAddress = () => {
  const { t } = useTranslation()
  const { app } = useCurrentAppInfo()

  const [showCopiedLink, setShowCopiedLink] = useState(false)

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(app?.teamWalletAddress || "")
    setShowCopiedLink(true)
    setTimeout(() => {
      setShowCopiedLink(false)
    }, 2000)
  }, [app?.teamWalletAddress])

  return (
    <VStack align={"stretch"}>
      <Text textStyle={"sm"} color="#6A6A6A">
        {t("Treasury address")}
      </Text>
      <HStack>
        {showCopiedLink ? (
          <UilCheck size={"18px"} color="#6DCB09" />
        ) : (
          <UilCopy size={"18px"} color="#6A6A6A" onClick={handleCopyLink} cursor="pointer" />
        )}
        <Text textStyle={"sm"}>{humanAddress(app?.teamWalletAddress || "", 4, 6)}</Text>
      </HStack>
    </VStack>
  )
}
