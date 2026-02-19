"use client"

import { Box, Button, Flex, HStack, Icon, Image, Text, VStack } from "@chakra-ui/react"
import { UilExternalLinkAlt } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

import { STARGATE_URL } from "@/constants/links"

export const NoNodesCtaCard = () => {
  const { t } = useTranslation()

  return (
    <Box position="relative" overflow="hidden" w="full" borderRadius="2xl" border="sm" borderColor="border.secondary">
      <Image
        src="/assets/images/B3MO_Rewards.png"
        alt=""
        position="absolute"
        right={{ base: "-30px", md: "-10px" }}
        top="50%"
        transform="translateY(-50%)"
        h={{ base: "140px", md: "180px" }}
        objectFit="contain"
        opacity={0.15}
        pointerEvents="none"
        zIndex={0}
      />
      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "stretch", md: "center" }}
        gap={4}
        p={6}
        bg="status.info.subtle"
        position="relative"
        zIndex={1}>
        <Flex direction={{ base: "column", md: "row" }} align="center" gap={{ base: 4, md: 6 }}>
          <Image
            src="/assets/images/B3MO_Rewards.png"
            alt="star-gate-node"
            boxSize={{ base: "250px", md: "220px" }}
            objectFit="contain"
            flexShrink={0}
          />
          <VStack align="start" gap={2} flex={1}>
            <Text textStyle="lg" fontWeight="bold">
              {t("Get a StarGate Node")}
            </Text>
            <Text textStyle="sm" color="text.subtle">
              {t(
                "Nodes let you endorse apps and help them join allocation rounds. Attach a GM NFT for reward multipliers and use your endorsement points to support apps.",
              )}
            </Text>
            <Button
              asChild
              mt={4}
              variant="primary"
              w={{ base: "full", md: "auto" }}
              size={{ md: "md" }}
              flexShrink={0}>
              <a href={STARGATE_URL} target="_blank" rel="noopener noreferrer">
                <HStack gap={1}>
                  {t("Get a node")}
                  <Icon as={UilExternalLinkAlt} boxSize={4} />
                </HStack>
              </a>
            </Button>
          </VStack>
        </Flex>
      </Flex>
    </Box>
  )
}
