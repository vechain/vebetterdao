import { VStack, Flex } from "@chakra-ui/react"
import { motion } from "framer-motion"
import { TokenInfoCard } from "../../TokenInfoCard"

type Props = {
  setIsB3trToVot3: (isB3trToVot3: boolean) => void
  onSubmit: (e?: React.FormEvent<HTMLFormElement>) => void
}

export const TokenSelectionContent = ({ setIsB3trToVot3, onSubmit }: Props) => {
  return (
    <form onSubmit={onSubmit}>
      <VStack align={"flex-start"}>
        <Flex align={"center"} w="100%" h="100%" direction={{ base: "column", md: "row" }} gap={4}>
          <motion.div initial="hidden" animate="visible">
            <TokenInfoCard isB3TRToVOT3={true} setIsB3TRToVOT3={setIsB3trToVot3} />
          </motion.div>
          <motion.div initial="hidden" animate="visible">
            <TokenInfoCard isB3TRToVOT3={false} setIsB3TRToVOT3={setIsB3trToVot3} />
          </motion.div>
        </Flex>
      </VStack>
    </form>
  )
}
