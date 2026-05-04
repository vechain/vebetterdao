"use client"

import { Box, Heading, Text, VStack, Skeleton } from "@chakra-ui/react"
import MDEditor from "@uiw/react-md-editor"
import { useTranslation } from "react-i18next"

import { useIpfsMetadata } from "@/api/ipfs/hooks/useIpfsMetadata"
import { BaseModal } from "@/components/BaseModal"
import { LinkPreview } from "@/components/LinkPreview/LinkPreview"

type ReportData = {
  link?: string
  text?: string
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
          <VStack gap={3} align="stretch">
            <Skeleton h="4" w="40%" />
            <Skeleton h="120px" w="full" borderRadius="lg" />
            <Skeleton h="60px" w="full" />
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

            {report.link && <LinkPreview url={report.link} />}

            {report.text && (
              <Box
                css={{
                  "& .wmde-markdown": {
                    backgroundColor: "transparent",
                    color: "inherit",
                    fontSize: "var(--chakra-font-sizes-sm)",
                  },
                  "& .wmde-markdown pre": {
                    backgroundColor: "var(--chakra-colors-bg-subtle)",
                    borderRadius: "var(--chakra-radii-md)",
                  },
                }}>
                <MDEditor.Markdown
                  source={report.text}
                  style={{
                    maxWidth: "100%",
                    wordBreak: "break-word",
                    backgroundColor: "transparent",
                    overflow: "auto",
                  }}
                />
              </Box>
            )}
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
