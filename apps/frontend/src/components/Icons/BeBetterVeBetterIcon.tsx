import { VStack, Icon } from "@chakra-ui/react"
import React from "react"

import BeBetter from "@/components/Icons/svg/be-better.svg"
import VBDLogo from "@/components/Icons/svg/vebetter-dao-logo.svg"

export const BeBetterVeBetterIcon = () => (
  <VStack gap={2} align="flex-start" w="full">
    <Icon as={BeBetter} w={48} color="icon.default" />
    <Icon as={VBDLogo} w={56} color="icon.default" />
  </VStack>
)
