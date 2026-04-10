import { Button, Collapsible, HStack, Separator, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { LuChevronDown, LuChevronUp } from "react-icons/lu"

import { NavigatorMetadata } from "@/api/indexer/navigators/useNavigatorMetadata"

type Props = {
  metadata: NavigatorMetadata | undefined
  metadataLoading: boolean
  registeredAt: number
}

export const NavigatorAboutSection = ({ metadata, metadataLoading, registeredAt }: Props) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible.Root open={isOpen} onOpenChange={e => setIsOpen(e.open)}>
      <Collapsible.Content>
        <VStack gap={4} align="stretch" pt={2}>
          <Separator />

          <Text textStyle="sm" fontWeight="semibold">
            {t("Motivation")}
          </Text>
          <Skeleton loading={metadataLoading}>
            <Text textStyle="sm">{metadata?.motivation || t("No motivation provided")}</Text>
          </Skeleton>

          <Separator />

          <Text textStyle="sm" fontWeight="semibold">
            {t("Qualifications")}
          </Text>
          <Skeleton loading={metadataLoading}>
            <Text textStyle="sm">{metadata?.qualifications || t("No qualifications provided")}</Text>
          </Skeleton>

          {metadata?.votingStrategy && (
            <>
              <Separator />
              <Text textStyle="sm" fontWeight="semibold">
                {t("Voting Strategy")}
              </Text>
              <Text textStyle="sm">{metadata.votingStrategy}</Text>
            </>
          )}

          {metadata?.disclosures && (
            <>
              <Separator />
              <Text textStyle="sm" fontWeight="semibold">
                {t("Disclosures")}
              </Text>

              <HStack justify="space-between">
                <Text textStyle="sm" color="fg.muted">
                  {t("App affiliated")}
                </Text>
                <Text textStyle="sm" fontWeight="semibold">
                  {metadata.disclosures.isAppAffiliated ? metadata.disclosures.affiliatedAppNames || t("Yes") : t("No")}
                </Text>
              </HStack>

              <HStack justify="space-between">
                <Text textStyle="sm" color="fg.muted">
                  {t("Foundation member")}
                </Text>
                <Text textStyle="sm" fontWeight="semibold">
                  {metadata.disclosures.isFoundationMember ? metadata.disclosures.foundationRole || t("Yes") : t("No")}
                </Text>
              </HStack>

              <HStack justify="space-between">
                <Text textStyle="sm" color="fg.muted">
                  {t("Conflicts of interest")}
                </Text>
                <Text textStyle="sm" fontWeight="semibold">
                  {metadata.disclosures.hasConflictsOfInterest ? t("Yes") : t("No")}
                </Text>
              </HStack>

              {metadata.disclosures.hasConflictsOfInterest && metadata.disclosures.conflictsDescription && (
                <Text textStyle="xs" color="fg.muted">
                  {metadata.disclosures.conflictsDescription}
                </Text>
              )}
            </>
          )}

          {registeredAt > 0 && (
            <>
              <Separator />
              <Text textStyle="xs" color="fg.muted">
                {t("Navigator since {{date}}", {
                  date: new Date(registeredAt * 1000).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }),
                })}
              </Text>
            </>
          )}
        </VStack>
      </Collapsible.Content>

      <Collapsible.Trigger asChild>
        <Button variant="plain" size="xs" w="full" mt={2} color="fg.muted">
          {isOpen ? t("Read less") : t("Read more")}
          {isOpen ? <LuChevronUp /> : <LuChevronDown />}
        </Button>
      </Collapsible.Trigger>
    </Collapsible.Root>
  )
}
