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

const b3moDomain = "https://d1px0i9vqvp8ud.cloudfront.net" // TODO: To be updated once the AI team provides the correct domain

export const B3MOProposalReviewBanner = ({ proposalId, status }: B3MOProposalReviewBannerProps) => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const borderColor = "brand.secondary-stronger"
  const textColor = "text.default"
  const linkColor = "brand.secondary-stronger"
  const b3moIcon = useColorModeValue("/assets/icons/b3mo.webp", "/assets/icons/b3mo-dark.webp")

  const handleFullAnalysisClick = () => {
    if (isLoading || !proposalId) {
      return
    }

    setIsLoading(true)

    AnalyticsUtils.trackEvent(buttonClicked, {
      ...buttonClickActions(ButtonClickProperties.VIEW_B3MO_FULL_ANALYSIS),
      proposalId,
      status,
    })

    const pdfUrl = `${b3moDomain}/proposal_summaries/${proposalId}/${status}/outputs/07_phase1_support_summary.pdf`

    // Open PDF in new tab - browser will handle download/display
    window.open(pdfUrl, "_blank", "noopener,noreferrer")

    // Reset loading state after a brief moment
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
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
        <Text fontSize="sm" fontWeight="semibold" color={linkColor}>
          {t("Full analysis")}
        </Text>
        {isLoading ? (
          <Spinner size="sm" color={linkColor} />
        ) : (
          <Box as={UilArrowRight} boxSize={3.5} color={linkColor} />
        )}
      </HStack>
    </Flex>
  )
}
