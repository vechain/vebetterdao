"use client"

import { Heading, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { useIpfsMetadata } from "@/api/ipfs/hooks/useIpfsMetadata"
import { BaseModal } from "@/components/BaseModal"

type ReportData = {
  content: string
  submittedAt: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  reportURI: string | null
}

export const ViewReportModal = ({ isOpen, onClose, reportURI }: Props) => {
  const { t } = useTranslation()
  const { data: report, isLoading } = useIpfsMetadata<ReportData>(reportURI ?? undefined)

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} ariaTitle={t("Navigator Report")} showCloseButton>
      <VStack gap={4} align="stretch" py={4} px={2}>
        <Heading size="md">{t("Navigator Report")}</Heading>

        {isLoading ? (
          <VStack gap={2} align="stretch">
            <Skeleton h="4" w="40%" />
            <Skeleton h="20" w="full" />
          </VStack>
        ) : report ? (
          <>
            {report.submittedAt && (
              <Text textStyle="xs" color="text.subtle">
                {new Date(report.submittedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            )}
            <Text textStyle="sm" whiteSpace="pre-wrap">
              {report.content}
            </Text>
          </>
        ) : (
          <Text textStyle="sm" color="text.subtle">
            {t("Unable to load report content.")}
          </Text>
        )}
      </VStack>
    </BaseModal>
  )
}
