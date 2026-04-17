import { Box, Card, Heading, HStack, Icon, Skeleton, VStack } from "@chakra-ui/react"
import { Activity } from "iconoir-react"
import { useTranslation } from "react-i18next"

import { type ChallengeDetail } from "@/api/challenges/types"
import { useChallengeActivityLog } from "@/api/challenges/useChallengeActivityLog"
import { EmptyState } from "@/components/ui/empty-state"

import { ChallengeActivityRow } from "./ChallengeActivityRow"

interface ChallengeActivityCardProps {
  challenge: ChallengeDetail
}

export const ChallengeActivityCard = ({ challenge }: ChallengeActivityCardProps) => {
  const { t } = useTranslation()
  const { entries, isLoading } = useChallengeActivityLog(challenge)

  return (
    <Card.Root
      variant="primary"
      p={{ base: "4", md: "6" }}
      height={{ base: "max-content", md: "auto" }}
      minHeight={{ base: "fit-content", md: "350px" }}>
      <Card.Header as={HStack} gap="2" pb={{ base: "5", md: "6" }}>
        <Icon as={Activity} boxSize="5" color="icon.default" />
        <Heading size={{ base: "md", md: "lg" }} fontWeight="semibold">
          {t("Activity")}
        </Heading>
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <VStack gap="4">
            {Array.from({ length: 4 }).map((_, i) => (
              <HStack key={i} w="full" gap="3">
                <Skeleton boxSize="8" borderRadius="full" />
                <VStack flex={1} align="stretch" gap="1">
                  <Skeleton h="3" w="70%" />
                  <Skeleton h="2.5" w="40%" />
                </VStack>
              </HStack>
            ))}
          </VStack>
        ) : entries.length === 0 ? (
          <EmptyState bg="transparent" flex={1} display="flex" justifyContent="center" title={t("No activity yet")} />
        ) : (
          <Box overflowY="auto" maxH={{ md: "400px" }}>
            <VStack align="stretch" gap="0">
              {entries.map(entry => (
                <ChallengeActivityRow key={entry.id} entry={entry} />
              ))}
            </VStack>
          </Box>
        )}
      </Card.Body>
    </Card.Root>
  )
}
