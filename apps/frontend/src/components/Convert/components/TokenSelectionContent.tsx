import { ModalCloseButton, VStack, Text, Flex } from "@chakra-ui/react"
import { motion, Variants } from "framer-motion"
import { t } from "i18next"
import { TokenInfoCard } from "./TokenInfoCard"

type Props = {
  zoomInVariants: Variants
  setIsB3trToVot3: (isB3trToVot3: boolean) => void
  onSubmit: (e?: React.FormEvent<HTMLFormElement>) => void
}

export const TokenSelectionContent = ({ zoomInVariants, setIsB3trToVot3, onSubmit }: Props) => {
  return (
    <form onSubmit={onSubmit}>
      <ModalCloseButton top={{ base: 5, md: 6 }} right={4} />
      <VStack align={"flex-start"}>
        <Text fontSize={{ base: 18, md: 24 }} fontWeight={700}>
          {t("Convert tokens")}
        </Text>
        <Flex w="100%" direction={{ base: "column", md: "row" }} gap={4}>
          <motion.div variants={zoomInVariants} initial="hidden" animate="visible">
            <TokenInfoCard isB3TRToVOT3={true} setIsB3TRToVOT3={setIsB3trToVot3} />
          </motion.div>
          <motion.div variants={zoomInVariants} initial="hidden" animate="visible">
            <TokenInfoCard isB3TRToVOT3={false} setIsB3TRToVOT3={setIsB3trToVot3} />
          </motion.div>
        </Flex>
      </VStack>
    </form>
  )
}
