import React from "react"
import { Box, HStack, Text } from "@chakra-ui/react"

type BadgeComponentProps = {
  bgColor: string
  textColor: string
  icon: JSX.Element
  text: string
}

const ProposalBadge: React.FC<BadgeComponentProps> = ({ bgColor, textColor, icon, text }) => (
  <Box backgroundColor={bgColor} borderRadius="full" px={3} py={1}>
    <HStack spacing={2}>
      {icon}
      <Text fontWeight="600" lineHeight="19.6px" fontSize="14px" color={textColor}>
        {text}
      </Text>
    </HStack>
  </Box>
)

export default ProposalBadge
