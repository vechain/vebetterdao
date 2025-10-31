import { VStack, HStack, Text, Heading, Link, Card, Icon, Stack, Separator, Collapsible } from "@chakra-ui/react"
import { UilExternalLinkAlt, UilTimesCircle, UilExclamationTriangle, UilAngleDown } from "@iconscout/react-unicons"
import { getConfig } from "@repo/config"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { BaseModal } from "@/components/BaseModal"

import { ProofIssue } from "../../utils/validateRewardProof"

type Props = {
  isOpen: boolean
  onClose: () => void
  issues: ProofIssue[]
}

const IssueCard = ({ issue, colorScheme }: { issue: ProofIssue; colorScheme: "red" | "orange" }) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const config = getConfig()
  const explorerUrl = config.network.explorerUrl || "https://explore-testnet.vechain.org"

  const hasExample = issue.exampleProof && issue.exampleProof.trim() !== ""

  return (
    <VStack align="flex-start" w="full" p={3} bg={`${colorScheme}.50`} rounded="md" gap={2}>
      <HStack align="flex-start" w="full">
        <Icon
          as={colorScheme === "red" ? UilTimesCircle : UilExclamationTriangle}
          color={`${colorScheme}.500`}
          boxSize={5}
          mt={0.5}
          flexShrink={0}
        />
        <VStack align="flex-start" flex={1} gap={1}>
          <Text fontWeight="semibold" fontSize="sm" color={`${colorScheme}.700`}>
            {issue.type.replace(/_/g, " ").toUpperCase()}
          </Text>
          <Text fontSize="sm" color={`${colorScheme}.900`}>
            {issue.message}
          </Text>

          {hasExample && (
            <>
              <Collapsible.Root open={isOpen} onOpenChange={e => setIsOpen(e.open)}>
                <Collapsible.Trigger asChild w="full">
                  <HStack
                    cursor="pointer"
                    color={`${colorScheme}.700`}
                    fontSize="xs"
                    fontWeight="semibold"
                    _hover={{ textDecoration: "underline" }}
                    mt={1}>
                    <Icon
                      as={UilAngleDown}
                      boxSize={4}
                      transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
                      transition="transform 0.2s"
                    />
                    <Text color={`${colorScheme}.900`}>{isOpen ? t("Hide proof") : t("View your proof")}</Text>
                  </HStack>
                </Collapsible.Trigger>
                <Collapsible.Content>
                  <VStack align="flex-start" w="full" mt={2} gap={2}>
                    <Card.Root w="full" bg="white" border="1px solid" borderColor={`${colorScheme}.200`}>
                      <Card.Body p={2}>
                        <Text
                          fontFamily="monospace"
                          fontSize="2xs"
                          whiteSpace="pre-wrap"
                          wordBreak="break-all"
                          color="gray.800">
                          {issue.exampleProof}
                        </Text>
                      </Card.Body>
                    </Card.Root>
                    {issue.txId && (
                      <Link
                        href={`${explorerUrl}/transactions/${issue.txId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        color={`${colorScheme}.600`}
                        fontSize="xs"
                        fontWeight="semibold">
                        <HStack>
                          <Text color={`${colorScheme}.900`}>{t("View on explorer")}</Text>
                          <Icon as={UilExternalLinkAlt} boxSize={3} />
                        </HStack>
                      </Link>
                    )}
                  </VStack>
                </Collapsible.Content>
              </Collapsible.Root>
            </>
          )}
        </VStack>
      </HStack>
    </VStack>
  )
}

export const ProofValidationDetailsModal = ({ isOpen, onClose, issues }: Props) => {
  const { t } = useTranslation()

  const errors = issues.filter(i => i.severity === "error")
  const warnings = issues.filter(i => i.severity === "warning")

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} modalProps={{ size: "6xl" }} showCloseButton={true}>
      <VStack gap={6} align="flex-start" w="full">
        <Heading size="2xl">{t("Reward Proof Validation")}</Heading>

        <Stack direction={["column", "column", "row"]} w="full" alignItems="stretch" gap={5}>
          {/* Left Column - Issues */}
          <VStack flex={1} h="full" gap={4} alignItems="stretch">
            <Card.Root variant="primary" p="4" gap={4} w="full">
              <Card.Header p={0}>
                <Heading size="xl">{t("Issues Found")}</Heading>
              </Card.Header>
              <Card.Body p={0}>
                <VStack align="flex-start" gap={3} w="full">
                  {errors.length > 0 && (
                    <VStack align="flex-start" gap={2} w="full">
                      <Text fontWeight="semibold" color="red.600">
                        {t("Errors")} {`(${errors.length})`}
                      </Text>
                      {errors.map(issue => (
                        <IssueCard key={`error-${issue.type}-${issue.message}`} issue={issue} colorScheme="red" />
                      ))}
                    </VStack>
                  )}
                  {warnings.length > 0 && (
                    <VStack align="flex-start" gap={2} w="full">
                      <Text fontWeight="semibold" color="orange.600">
                        {t("Warnings")} {`(${warnings.length})`}
                      </Text>
                      {warnings.map(issue => (
                        <IssueCard key={`warning-${issue.type}-${issue.message}`} issue={issue} colorScheme="orange" />
                      ))}
                    </VStack>
                  )}
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* How to Fix */}
            <Card.Root bg="bg.primary" p={4} rounded="16px">
              <Card.Header p={0}>
                <Heading size="xl">{t("How to Fix")}</Heading>
              </Card.Header>
              <Card.Body p={0} pt={3}>
                <VStack align="flex-start" gap={3}>
                  <Text fontSize="sm">
                    {t("Use the correct method to distribute rewards with proofs")}
                    {":"}
                  </Text>
                  <Card.Root w="full" bg="gray.50" border="1px solid" borderColor="gray.200">
                    <Card.Body p={3}>
                      <Text fontFamily="monospace" fontSize="xs" whiteSpace="pre-wrap" color="gray.900">
                        {`distributeRewardWithProof(
  appId,
  amount,
  receiver,
  ["link", "image"],
  ["https://proof.com", "img.png"],
  ["carbon", "water"],
  [100, 200],
  "Description"
)`}
                      </Text>
                    </Card.Body>
                  </Card.Root>
                </VStack>
              </Card.Body>
            </Card.Root>
          </VStack>

          <Separator hideFrom="md" w="full" />

          {/* Right Column - Information */}
          <VStack flex={1} gap={4} alignItems="stretch">
            {/* Why It Matters */}
            <Card.Root bg="bg.primary" p={4} rounded="16px">
              <Card.Header p={0}>
                <Heading size="xl">{t("Why This Matters")}</Heading>
              </Card.Header>
              <Card.Body p={0} pt={3}>
                <VStack align="flex-start" gap={2}>
                  <Text fontSize="sm">
                    {t(
                      "Properly formatted sustainability proofs are essential for tracking and verifying environmental impact",
                    )}
                    {":"}
                  </Text>
                  <VStack align="flex-start" gap={1} pl={2}>
                    <Text fontSize="sm">
                      {"✓ "}
                      {t("Accurate impact measurement")}
                    </Text>
                    <Text fontSize="sm">
                      {"✓ "}
                      {t("User transparency and trust")}
                    </Text>
                    <Text fontSize="sm">
                      {"✓ "}
                      {t("Proper data indexing")}
                    </Text>
                    <Text fontSize="sm">
                      {"✓ "}
                      {t("Ecosystem compliance")}
                    </Text>
                  </VStack>
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* Documentation Links */}
            <Card.Root bg="bg.primary" p={4} rounded="16px">
              <Card.Header p={0}>
                <Heading size="xl">{t("Documentation")}</Heading>
              </Card.Header>
              <Card.Body p={0} pt={3}>
                <VStack align="flex-start" gap={2} w="full">
                  <Link
                    href="https://docs.vebetterdao.org/developer-guides/sustainability-proof-and-impacts"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="blue.600"
                    fontSize="sm"
                    fontWeight="semibold">
                    <HStack>
                      <Text>
                        {t("Sustainability proof")} {t("Guide")}
                      </Text>
                      <Icon as={UilExternalLinkAlt} boxSize={3.5} />
                    </HStack>
                  </Link>
                  <Link
                    href="https://docs.vebetterdao.org/developer-guides/reward-metadata"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="blue.600"
                    fontSize="sm"
                    fontWeight="semibold">
                    <HStack>
                      <Text>
                        {t("Reward Metadata")} {t("Guide")}
                      </Text>
                      <Icon as={UilExternalLinkAlt} boxSize={3.5} />
                    </HStack>
                  </Link>
                  <Link
                    href="https://docs.vebetterdao.org/developer-guides/reward-distribution"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="blue.600"
                    fontSize="sm"
                    fontWeight="semibold">
                    <HStack>
                      <Text>
                        {t("Reward distribution")} {t("Docs")}
                      </Text>
                      <Icon as={UilExternalLinkAlt} boxSize={3.5} />
                    </HStack>
                  </Link>
                </VStack>
              </Card.Body>
            </Card.Root>
          </VStack>
        </Stack>
      </VStack>
    </BaseModal>
  )
}
