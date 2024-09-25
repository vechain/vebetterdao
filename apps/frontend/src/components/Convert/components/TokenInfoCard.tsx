import { VStack, Image, Text, Button } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

type Props = {
  isB3TRToVOT3: boolean
  setIsB3TRToVOT3: (isB3TRToVOT3: boolean) => void
}

export const TokenInfoCard: React.FC<Props> = ({ isB3TRToVOT3, setIsB3TRToVOT3 }) => {
  const { t } = useTranslation()
  const bgColor = useMemo(() => {
    return isB3TRToVOT3 ? "rgba(177, 241, 108, 1)" : "rgba(12, 37, 88, 1)"
  }, [isB3TRToVOT3])

  const title = useMemo(() => {
    return isB3TRToVOT3 ? t("Turn your B3TR into VOT3") : t("Turn your VOT3 into B3TR")
  }, [isB3TRToVOT3, t])

  const description = useMemo(() => {
    return isB3TRToVOT3 ? (
      <Text fontSize={{ base: 14, md: 16 }} fontWeight={400}>
        {t("The more VOT3 in your balance, the more ")}
        <b>{t("voting power")}</b>
        {t(" you’ll have. Use it to vote on proposals and allocation rounds.")}
      </Text>
    ) : (
      <Text fontSize={{ base: 14, md: 16 }} fontWeight={400}>
        {t("B3TR are the tokens that you earn through the dApps and by participating on the voting sessions.")}
      </Text>
    )
  }, [isB3TRToVOT3, t])

  const color = useMemo(() => {
    return isB3TRToVOT3 ? "#252525" : "#ffffff"
  }, [isB3TRToVOT3])

  const buttonText = useMemo(() => {
    return isB3TRToVOT3 ? t("Get VOT3") : t("Get B3TR")
  }, [isB3TRToVOT3, t])

  const handleButtonClick = useCallback(() => {
    setIsB3TRToVOT3(isB3TRToVOT3)
  }, [isB3TRToVOT3, setIsB3TRToVOT3])

  const dataTestId = useMemo(() => {
    return isB3TRToVOT3 ? "get-VOT3-button" : "get-B3TR-button"
  }, [isB3TRToVOT3])

  return (
    <VStack
      bg={bgColor}
      alignItems={"flex-start"}
      px={5}
      py={{ base: 3, md: 5 }}
      spacing={{ base: 2, md: 5 }}
      maxW={"360px"}
      textColor={color}
      borderRadius={"8px"}>
      <Image src="/images/vot3-to-b3tr.svg" alt="VOT3 to B3TR" boxSize={"87px"} />
      <Text fontSize={{ base: 16, md: 20 }} fontWeight={700} fontFamily={"Instrument Sans, sans-serif"}>
        {title}
      </Text>
      {description}
      <Button
        mt={2}
        type="submit"
        variant={"primaryAction"}
        rounded={"full"}
        size={{ base: "md", md: "lg" }}
        w={{ base: "full", md: "auto" }}
        onClick={handleButtonClick}
        data-testid={dataTestId}>
        {buttonText}
      </Button>
    </VStack>
  )
}
