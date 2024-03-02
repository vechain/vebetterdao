import { Stack, VStack } from "@chakra-ui/react"
import { motion } from "framer-motion"

type Props = {
  children: React.ReactNode
}

export const MotionVStack = ({ children }: Props) => {
  const MotionVStack = motion(VStack)

  return (
    <MotionVStack
      w="full"
      spacing={12}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 1,
        delay: 0.1,
        ease: [0, 0.71, 0.2, 1.01],
      }}>
      <Stack
        direction={["column-reverse", "column-reverse", "row"]}
        w="full"
        justify="space-between"
        align={["stretch", "stretch", "flex-start"]}
        spacing={12}>
        {children}
      </Stack>
    </MotionVStack>
  )
}
