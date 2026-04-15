import { Badge, Grid, GridItem, HStack, Icon, Link, Text, VStack } from "@chakra-ui/react"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"
import { PiLinkSimple } from "react-icons/pi"

import { ExpenditureReport } from "@/hooks/proposals/grants/types"

interface ExpenditureReportViewProps {
  report: ExpenditureReport
}

const AchievementBadge = ({ status }: { status: "yes" | "no" | "partially" }) => {
  const colorMap = { yes: "green", no: "red", partially: "orange" }
  const labelMap = { yes: "Yes", no: "No", partially: "Partially" }
  return (
    <Badge colorPalette={colorMap[status]} variant="subtle">
      {labelMap[status]}
    </Badge>
  )
}

export const ExpenditureReportView = ({ report }: ExpenditureReportViewProps) => {
  const { t } = useTranslation()

  return (
    <VStack align="stretch" gap={5} w="full">
      {/* Header */}
      <HStack justify="space-between" w="full">
        <Text textStyle="md" fontWeight="semibold">
          {t("Expenditure Report - Tranche {{current}} of {{total}}", {
            current: report.trancheNumber,
            total: report.totalTranches,
          })}
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {dayjs(report.dateSubmitted * 1000).format("MMM D, YYYY")}
        </Text>
      </HStack>

      {/* Milestone Completion */}
      <VStack align="flex-start" gap={3} p={4} bg="bg.tertiary" borderRadius="xl">
        <Text textStyle="sm" fontWeight="semibold">
          {t("Milestone completion")}
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {report.milestoneGoal}
        </Text>
        <HStack>
          <Text textStyle="sm">
            {t("Achieved")}
            {":"}
          </Text>
          <AchievementBadge status={report.milestoneAchieved} />
        </HStack>
        {report.milestoneAchievedExplanation && (
          <Text textStyle="sm" color="text.subtle">
            {report.milestoneAchievedExplanation}
          </Text>
        )}
      </VStack>

      {/* Evidence Links */}
      {report.evidenceLinks.length > 0 && (
        <VStack align="flex-start" gap={2}>
          <Text textStyle="sm" fontWeight="semibold">
            {t("Evidence of completion")}
          </Text>
          {report.evidenceLinks.map((link, index) => (
            <HStack key={index} gap={2}>
              <Icon as={PiLinkSimple} boxSize={4} color="icon.subtle" />
              <Badge variant="outline" size="sm">
                {link.type}
              </Badge>
              <Link href={link.url} target="_blank" textStyle="sm" color="blue.500" textDecoration="underline">
                {link.label || link.url}
              </Link>
            </HStack>
          ))}
        </VStack>
      )}

      {/* Expenditure Breakdown */}
      <VStack align="flex-start" gap={2}>
        <Text textStyle="sm" fontWeight="semibold">
          {t("Expenditure breakdown")}
        </Text>
        <Grid templateColumns="2fr 1fr 1fr" gap={2} w="full" px={2}>
          <GridItem>
            <Text textStyle="xs" fontWeight="semibold" color="text.subtle">
              {t("Category")}
            </Text>
          </GridItem>
          <GridItem>
            <Text textStyle="xs" fontWeight="semibold" color="text.subtle">
              {t("Description")}
            </Text>
          </GridItem>
          <GridItem textAlign="right">
            <Text textStyle="xs" fontWeight="semibold" color="text.subtle">
              {t("Amount")}
            </Text>
          </GridItem>
          {report.expenditureItems.map((item, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <Grid key={`row-${index}`} templateColumns="2fr 1fr 1fr" gap={2} w="full" px={2}>
              <GridItem>
                <Text textStyle="sm">{item.category}</Text>
              </GridItem>
              <GridItem>
                <Text textStyle="sm" color="text.subtle">
                  {item.description}
                </Text>
              </GridItem>
              <GridItem textAlign="right">
                <Text textStyle="sm">
                  {"$"}
                  {item.amount.toLocaleString()}
                </Text>
              </GridItem>
            </Grid>
          ))}
        </Grid>
      </VStack>

      {/* Totals */}
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={4} p={4} bg="bg.tertiary" borderRadius="xl">
        <VStack align="flex-start" gap={0}>
          <Text textStyle="xs" color="text.subtle">
            {t("Total received")}
          </Text>
          <Text textStyle="sm" fontWeight="semibold">
            {"$"}
            {report.totalReceivedForTranche.toLocaleString()}
          </Text>
        </VStack>
        <VStack align="flex-start" gap={0}>
          <Text textStyle="xs" color="text.subtle">
            {t("Total spent")}
          </Text>
          <Text textStyle="sm" fontWeight="semibold">
            {"$"}
            {report.totalSpent.toLocaleString()}
          </Text>
        </VStack>
        <VStack align="flex-start" gap={0}>
          <Text textStyle="xs" color="text.subtle">
            {t("Unspent")}
          </Text>
          <Text textStyle="sm" fontWeight="semibold" color={report.unspentAmount < 0 ? "red.500" : "text.default"}>
            {"$"}
            {report.unspentAmount.toLocaleString()}
          </Text>
        </VStack>
      </Grid>

      {/* Notes */}
      {report.notes && (
        <VStack align="flex-start" gap={1}>
          <Text textStyle="sm" fontWeight="semibold">
            {t("Notes")}
          </Text>
          <Text textStyle="sm" color="text.subtle" whiteSpace="pre-wrap">
            {report.notes}
          </Text>
        </VStack>
      )}
    </VStack>
  )
}
