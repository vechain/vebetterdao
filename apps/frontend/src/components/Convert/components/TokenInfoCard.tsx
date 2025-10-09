import { VStack, Image, Text, Button } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

import AnalyticsUtils from "../../../utils/AnalyticsUtils/AnalyticsUtils"
import { ButtonClickProperties, buttonClickActions, buttonClicked } from "../../../constants/AnalyticsEvents"

type Props = {
  isB3TRToVOT3: boolean
  setIsB3TRToVOT3: (isB3TRToVOT3: boolean) => void
}
export const TokenInfoCard: React.FC<Props> = ({ isB3TRToVOT3, setIsB3TRToVOT3 }) => {
  const { t } = useTranslation()
  const bgColor = useMemo(() => {
    return isB3TRToVOT3 ? "banner.green" : "banner.blue"
  }, [isB3TRToVOT3])
  const title = useMemo(() => {
    return isB3TRToVOT3 ? t("Turn your B3TR into VOT3") : t("Turn your VOT3 into B3TR")
  }, [isB3TRToVOT3, t])
  const description = useMemo(() => {
    return isB3TRToVOT3 ? (
      <Text textStyle={{ base: "sm", md: "md" }}>
        {t("The more VOT3 in your balance, the more ")}
        <b>{t("voting power")}</b>
        {t(" you’ll have. Use it to vote on proposals and allocation rounds.")}
      </Text>
    ) : (
      <Text textStyle={{ base: "sm", md: "md" }}>
        {t("B3TR are the tokens that you earn through the apps and by participating on the voting sessions.")}
      </Text>
    )
  }, [isB3TRToVOT3, t])
  const buttonText = useMemo(() => {
    return isB3TRToVOT3 ? t("Get VOT3") : t("Get B3TR")
  }, [isB3TRToVOT3, t])
  const handleButtonClick = useCallback(() => {
    setIsB3TRToVOT3(isB3TRToVOT3)
  }, [isB3TRToVOT3, setIsB3TRToVOT3])
  const buttonClickProperties = (isB3TRToVOT3: boolean) => {
    const action = isB3TRToVOT3 ? ButtonClickProperties.GET_VOT3 : ButtonClickProperties.GET_B3TR
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(action))
  }

  const dataTestId = useMemo(() => {
    return isB3TRToVOT3 ? "get-VOT3-button" : "get-B3TR-button"
  }, [isB3TRToVOT3])

  return (
    <VStack
      bg={bgColor}
      alignItems={"flex-start"}
      px={5}
      py={{ base: 3, md: 5 }}
      gap={{ base: 2, md: 5 }}
      maxW={"360px"}
      h={"full"}
      borderRadius={"8px"}>
      {isB3TRToVOT3 ? (
        <Image src="/assets/tokens/b3tr-to-vot3.webp" alt="B3TR to VOT3" h={{ base: "50px", md: "87px" }} w="auto" />
      ) : (
        <Image src="/assets/tokens/vot3-to-b3tr.webp" alt="VOT3 to B3TR" h={{ base: "50px", md: "87px" }} w="auto" />
      )}
      <Text textStyle={{ base: "md", md: "xl" }} fontWeight="bold">
        {title}
      </Text>
      {description}
      <Button
        mt={2}
        type="submit"
        variant={"primary"}
        rounded={"full"}
        size={{ base: "md", md: "lg" }}
        w={{ base: "full", md: "auto" }}
        onClick={() => {
          handleButtonClick()
          buttonClickProperties(isB3TRToVOT3)
        }}
        data-testid={dataTestId}>
        {buttonText}
      </Button>
    </VStack>
  )
}
