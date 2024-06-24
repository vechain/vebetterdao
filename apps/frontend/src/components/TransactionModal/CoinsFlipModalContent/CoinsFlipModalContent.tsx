import { coinFlipAnimation } from "@/constants"
import { Text, VStack, Image } from "@chakra-ui/react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"

const MotionImage = motion(Image)
export const CoinsFlipModalContent = () => {
  const { t } = useTranslation()
  return (
    <VStack alignItems={"center"}>
      <MotionImage {...coinFlipAnimation} src="/images/b3tr-token-3d.png" maxH="250px" />
      <Text fontWeight={400} lineHeight="22px" fontSize={{ base: "16px", md: "16px" }} align={"center"}>
        {t("Please confirm the transaction in your wallet")}
      </Text>
    </VStack>
  )
}
