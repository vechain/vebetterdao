"use client"

import { Button, Card, Heading, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { STARGATE_URL } from "@/constants/links"

export const NoNodesEmptyState = () => {
  const { t } = useTranslation()

  return (
    <Card.Root variant="outline" w="full" maxW="breakpoint-md" mx="auto">
      <Card.Body>
        <VStack align="stretch" gap={6} py={8}>
          <Heading textStyle="xl" size="xl">
            {t("Nodes & Endorsement")}
          </Heading>
          <Text textStyle="md" color="text.subtle">
            {t(
              "You don't have any Stargate nodes yet. Nodes let you endorse apps and help them join allocation rounds. As a node holder you can attach a GM NFT for reward multipliers and use your endorsement points to support apps.",
            )}
          </Text>
          <Button asChild variant="primary" size="md">
            <a href={STARGATE_URL} target="_blank" rel="noopener noreferrer">
              {t("Get a node on Stargate")}
            </a>
          </Button>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
