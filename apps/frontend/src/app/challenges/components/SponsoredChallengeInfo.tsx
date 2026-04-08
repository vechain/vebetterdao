"use client"

import { Box, HStack, Icon, Text, type TextProps } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FiInfo } from "react-icons/fi"

import { Tooltip } from "@/components/ui/tooltip"

type SponsoredChallengeInfoProps = {
  textProps?: TextProps
  iconSize?: string
}

export const SponsoredChallengeInfo = ({ textProps, iconSize = "4" }: SponsoredChallengeInfoProps) => {
  const { t } = useTranslation()

  return (
    <HStack align="center" gap="1.5" w="fit-content" position="relative" zIndex={1}>
      <Text lineHeight="1.15" {...textProps}>
        {t("Sponsored")}
      </Text>
      <Tooltip
        content={t("No bet required to participate")}
        contentProps={{ maxW: "xs" }}
        positioning={{ placement: "top" }}>
        <Box
          as="button"
          type="button"
          aria-label={t("No bet required to participate")}
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          color="text.subtle"
          flexShrink={0}
          position="relative"
          zIndex={1}
          bg="transparent"
          borderWidth="0"
          p="0"
          lineHeight="0">
          <Icon as={FiInfo} boxSize={iconSize} />
        </Box>
      </Tooltip>
    </HStack>
  )
}
