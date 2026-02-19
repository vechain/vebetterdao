"use client"

import { Button, Card, Heading, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { STARGATE_URL } from "@/constants/links"

export const NoNodesCtaCard = () => {
  const { t } = useTranslation()

  return (
    <Card.Root variant="primary" w="full">
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <Heading textStyle="xl" fontWeight="bold">
            {t("Nodes & Endorsement")}
          </Heading>
          <Text textStyle="sm" color="text.subtle">
            {t(
              "You don't have any Stargate nodes yet. Nodes let you endorse apps and help them join allocation rounds. As a node holder you can attach a GM NFT for reward multipliers and use your endorsement points to support apps.",
            )}
          </Text>
          <Button asChild variant="primary" size="md" alignSelf="start">
            <a href={STARGATE_URL} target="_blank" rel="noopener noreferrer">
              {t("Get a node on Stargate")}
            </a>
          </Button>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
