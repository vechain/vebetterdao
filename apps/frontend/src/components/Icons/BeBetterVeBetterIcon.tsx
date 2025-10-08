import React from "react"
import { VStack, Icon } from "@chakra-ui/react"

import VBDLogo from "@/components/Icons/svg/vebetter-dao-logo.svg"
import BeBetter from "@/components/Icons/svg/be-better.svg"

export const BeBetterVeBetterIcon = () => (
  <VStack gap={2} align="flex-start" w="full">
    <Icon as={BeBetter} w={48} color="icon.default" />
    <Icon as={VBDLogo} w={56} color="icon.default" />
  </VStack>
)
