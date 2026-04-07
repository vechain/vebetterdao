"use client"

import { Card, Heading, Image, VStack, Text, Button, Link } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { BaseModal } from "@/components/BaseModal"

interface Props {
  isOpen: boolean
  onClose: () => void
}

export const SnapshotExplanationModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} modalProps={{ closeOnInteractOutside: true }} showCloseButton>
      <VStack gap={4} w="full">
        <Heading size="xl" textAlign="center" fontWeight="bold">
          {t("What is a snapshot?")}
        </Heading>

        <Text textStyle="sm" color="text.subtle" textAlign="center">
          {t(
            "A snapshot is a record of all VOT3 balances taken at the start of each voting round to determine your voting power.",
          )}
        </Text>

        <Text textStyle="sm" color="text.subtle" textAlign="center">
          {t(
            "Convert your B3TR to VOT3 before the snapshot to increase your voting power. You can redeem your B3TR back at any time.",
          )}
        </Text>

        <VStack w="full" gap={2}>
          {[
            { title: t("Convert your B3TR to VOT3"), image: "/assets/tokens/b3tr-to-vot3.webp" },
            { title: t("Cast your vote to your favorite app"), image: "/assets/icons/vote-icon.webp" },
            { title: t("Claim your rewards"), image: "/assets/icons/claim-b3tr-icon.webp" },
          ].map((step, index) => (
            <Card.Root
              key={step.title}
              flexDirection="row"
              w="full"
              alignItems="center"
              p={2}
              bg="card.subtle"
              rounded="lg">
              <Image boxSize="60px" src={step.image} alt={step.title} flexShrink={0} />
              <VStack gap={0} align="start" p={1}>
                <Text textStyle="xs" color="text.subtle">
                  {t("STEP {{value}}", { value: index + 1 })}
                </Text>
                <Text textStyle="sm">{step.title}</Text>
              </VStack>
            </Card.Root>
          ))}
        </VStack>

        <Button asChild variant="outline" w="full" rounded="full" size="lg">
          <Link href="https://docs.vebetterdao.org/vebetterdao/x2earn-allocations" target="_blank" rel="noopener">
            {t("Learn more")}
          </Link>
        </Button>

        <Button variant="ghost" w="full" rounded="full" size="lg" onClick={onClose}>
          {t("Close")}
        </Button>
      </VStack>
    </BaseModal>
  )
}
