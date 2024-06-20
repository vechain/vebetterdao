import { BaseTooltip } from "@/components"
import { Flex, HStack, Text, VStack } from "@chakra-ui/react"
import { UilCheck, UilCopy } from "@iconscout/react-unicons"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { FiInfo } from "react-icons/fi"

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
    <VStack w={"full"} spacing={4} align={"flex-start"}>
      <VStack align={"stretch"} w={"full"} justify={"start"}>
        <BaseTooltip
          text={
            "This is the wallet address where the funds will be sent. You can change this address in the app settings."
          }>
          <Flex w={"fit-content"} justifyContent={"center"} mt={1}>
            <HStack alignSelf={"center"} w={"fit-content"}>
              <Text fontSize={"14px"} fontWeight={400} color="#6A6A6A" w={"full"}>
                {t("Team wallet address")}
              </Text>
              <FiInfo color="rgba(0, 76, 252, 1)" size={14} />
            </HStack>
          </Flex>
        </BaseTooltip>

        <HStack>
          {showCopiedLink ? (
            <UilCheck size={"18px"} color="#6DCB09" />
          ) : (
            <UilCopy size={"18px"} color="#6A6A6A" onClick={handleCopyLink} cursor="pointer" />
          )}
          <Text fontSize={"20px"} fontWeight={400}>
            {humanAddress(teamWalletAddress, 6, 6)}
          </Text>
        </HStack>
      </VStack>
    </VStack>
  )
}
