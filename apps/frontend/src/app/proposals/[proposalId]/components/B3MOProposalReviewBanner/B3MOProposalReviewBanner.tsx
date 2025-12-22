import { Box, Flex, HStack, Image, Spinner, Text } from "@chakra-ui/react"
import { UilArrowRight } from "@iconscout/react-unicons"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { useColorModeValue } from "@/components/ui/color-mode"
import { buttonClicked, buttonClickActions, ButtonClickProperties } from "@/constants/AnalyticsEvents"
import * as AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"

type B3MOProposalReviewBannerProps = {
  proposalId?: string
  status?: "pending" | "active"
}

export const B3MOProposalReviewBanner = ({ proposalId, status }: B3MOProposalReviewBannerProps) => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const borderColor = "brand.secondary-stronger"
  const textColor = "text.default"
  const linkColor = "brand.secondary-stronger"
  const b3moIcon = useColorModeValue("/assets/icons/b3mo.webp", "/assets/icons/b3mo-dark.webp")

  const handleFullAnalysisClick = async () => {
    if (isLoading || !proposalId || !status) {
      return
    }

    setIsLoading(true)
    setHasError(false)

    AnalyticsUtils.trackEvent(buttonClicked, {
      ...buttonClickActions(ButtonClickProperties.VIEW_B3MO_FULL_ANALYSIS),
      proposalId,
      status,
    })

    try {
      // Check if PDF is available before opening new tab
      const pdfUrl = `/api/download-b3mo-pdf?proposalId=${proposalId}&status=${status}`
      const response = await fetch(pdfUrl)

      if (!response.ok) {
        setHasError(true)
        setIsLoading(false)
        return
      }

      // If successful, open in new tab
      window.open(pdfUrl, "_blank", "noopener,noreferrer")
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching B3MO analysis:", error)
      setHasError(true)
      setIsLoading(false)
    }
  }

  return (
    <Flex
      w="full"
      bg="banner.green"
      border="1px solid"
      borderColor={borderColor}
      borderRadius="xl"
      px={{ base: 4, md: 4 }}
      py={{ base: 2, md: 2 }}
      align="center"
      justify="space-between"
      gap={{ base: 2, md: 4 }}>
      <HStack gap={2} flex={1}>
        <Box boxSize={4} flexShrink={0}>
          <Image src={b3moIcon} alt="B3MO" w="full" h="full" objectFit="contain" />
        </Box>

        <Text fontSize="sm" fontWeight="semibold" color={textColor}>
          {t("B3MO Proposal Review")}
        </Text>
      </HStack>

      <HStack
        gap={1}
        flexShrink={0}
        as="button"
        cursor={isLoading ? "not-allowed" : "pointer"}
        opacity={isLoading ? 0.6 : 1}
        onClick={handleFullAnalysisClick}
        transition="opacity 0.2s"
        _hover={{ opacity: isLoading ? 0.6 : 0.8 }}>
        <Text fontSize="sm" fontWeight="semibold" color={hasError ? "red.solid" : linkColor}>
          {hasError ? t("Try again") : t("Full analysis")}
        </Text>
        {isLoading ? (
          <Spinner size="sm" color={linkColor} />
        ) : (
          <Box as={UilArrowRight} boxSize={3.5} color={hasError ? "red.solid" : linkColor} />
        )}
      </HStack>
    </Flex>
  )
}
