import { Button, Heading, Link, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { UilExternalLinkAlt } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

import { BaseModal } from "@/components/BaseModal"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const EndorsementExplanationModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} showCloseButton>
      <VStack alignItems="flex-start" gap={5}>
        <Heading size="2xl">{t("How does endorsement work?")}</Heading>

        <VStack alignItems="flex-start" gap={2}>
          <Heading size="md">{t("What is endorsement?")}</Heading>
          <Text textStyle={["sm", "md"]}>
            {t(
              "An app needs to be endorsed in order to participate in weekly allocation rounds and receive B3TR rewards.",
            )}
          </Text>
        </VStack>

        <VStack alignItems="flex-start" gap={2}>
          <Heading size="md">{t("Who can endorse?")}</Heading>
          <Text textStyle={["sm", "md"]}>
            {t(
              "Users owning StarGate Nodes can endorse apps. To get a StarGate Node, users must stake VET on the StarGate app. A user can hold multiple nodes.",
            )}
          </Text>
        </VStack>

        <VStack alignItems="flex-start" gap={2}>
          <Heading size="md">{t("How does it work?")}</Heading>
          <Text textStyle={["sm", "md"]}>
            {t(
              "Each StarGate Node type has a different endorsement score. An app is endorsed once it reaches 100 points. A node can endorse multiple apps but with a maximum of 49 points per app. An app can receive a maximum of 110 points.",
            )}
          </Text>
        </VStack>

        <VStack alignItems="flex-start" gap={2}>
          <Heading size="md">{t("Cooldown and grace period")}</Heading>
          <Text textStyle={["sm", "md"]}>
            {t(
              "Once a node endorses an app, it must wait 1 round before removing its endorsement, but it can still add more endorsements in the same round. If an app drops below 100 points it enters a grace period and must get back above 100 points within 2 weeks, otherwise it will stop participating in rounds.",
            )}
          </Text>
        </VStack>

        <VStack alignItems="flex-start" gap={2}>
          <Heading size="md">{t("Deals with endorsers")}</Heading>
          <Text textStyle={["sm", "md"]}>
            {t(
              "Users can get in contact with app owners and negotiate private deals such as participation in the company, early access to features, dedicated features, or other bonuses and perks.",
            )}
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={2} w="full" pt={4}>
          <Button asChild variant="secondary">
            <Link
              href="https://docs.vebetterdao.org/vechain-node-and-staking-guides/legacy-vechain-node-guides-pre-stargate/endorsement-guide-for-vechain-node-holders"
              target="_blank"
              rel="noopener noreferrer">
              {t("Learn more")}
              <UilExternalLinkAlt size="16px" />
            </Link>
          </Button>
          <Button asChild variant="primary">
            <Link href="https://app.stargate.vechain.org" target="_blank" rel="noopener noreferrer">
              {t("Get a node")}
              <UilExternalLinkAlt color="white" size="16px" />
            </Link>
          </Button>
        </SimpleGrid>
      </VStack>
    </BaseModal>
  )
}
