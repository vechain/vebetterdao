"use client"
import { Stack, StackProps, VStack } from "@chakra-ui/react"
import { motion } from "framer-motion"

type Props = {
  children: React.ReactNode
  renderInnerStack?: boolean
} & StackProps

export const MotionVStack = ({ children, renderInnerStack = true, ...otherProps }: Props) => {
  const MotionVStack = motion(VStack)

  if (renderInnerStack)
    return (
      <MotionVStack
        w="full"
        gap={12}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.5,
          delay: 0.2,
          ease: [0, 0.71, 0.2, 1.01],
        }}
        {...otherProps}>
        <Stack
          direction={["column-reverse", "column-reverse", "row"]}
          w="full"
          justify="space-between"
          align={["stretch", "stretch", "flex-start"]}
          gap={12}>
          {children}
        </Stack>
      </MotionVStack>
    )

  return (
    <MotionVStack
      w="full"
      gap={12}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.5,
        delay: 0.2,
        ease: [0, 0.71, 0.2, 1.01],
      }}
      {...otherProps}>
      {children}
    </MotionVStack>
  )
}
