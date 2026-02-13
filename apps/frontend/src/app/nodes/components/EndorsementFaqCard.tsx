"use client"

import { Button, Card, Heading, Icon, Text, VStack } from "@chakra-ui/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { LuCircleHelp } from "react-icons/lu"

import { EndorsementExplanationModal } from "../../apps/[appId]/components/AppEndorsementInfoCard/EndorsementExplanationModal"

export const EndorsementFaqCard = () => {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Card.Root variant="outline" w="full">
        <Card.Body>
          <VStack align="stretch" gap={4}>
            <Icon fontSize="2xl" color="text.subtle">
              <LuCircleHelp />
            </Icon>
            <VStack align="stretch" gap={1}>
              <Heading size="md">{t("How does endorsement work?")}</Heading>
              <Text textStyle="sm" color="text.subtle">
                {t(
                  "Learn how node holders can endorse apps, how scoring works, and what happens during grace periods.",
                )}
              </Text>
            </VStack>
            <Button variant="outline" size="sm" w="fit-content" onClick={() => setIsModalOpen(true)}>
              {t("Learn more")}
            </Button>
          </VStack>
        </Card.Body>
      </Card.Root>

      <EndorsementExplanationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
