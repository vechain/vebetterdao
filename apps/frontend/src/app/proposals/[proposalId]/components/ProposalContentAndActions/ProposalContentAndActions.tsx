import { CollapsibleSection } from "@/app/components/CollapsibleSection"
import { ProposalExecutableActions } from "@/components/ProposalExecutableActions"
import { getActionsFromTargetsAndCalldatas, GovernanceFeaturedContractsWithFunctions } from "@/constants"
import { GrantProposalEnriched, ProposalEnriched, ProposalType } from "@/hooks/proposals/grants/types"
// import { Heading, HStack, Icon, Image, Link, Text, VStack } from "@/constants"
import { ProposalFormAction } from "@/store"
import { useMemo, useState } from "react"
import { VStack, Text, Heading, HStack, Icon, Link, Image, Box, Alert } from "@chakra-ui/react"
import { UilGithub, UilGlobe, UilTelegram, UilTwitter } from "@iconscout/react-unicons"
import MDEditor from "@uiw/react-md-editor"
import { useTranslation } from "react-i18next"
import { FaTelegram } from "react-icons/fa"
import { FiMail } from "react-icons/fi"

const isGrantProposal = (proposal?: ProposalEnriched | GrantProposalEnriched): proposal is GrantProposalEnriched => {
  return proposal?.type === ProposalType.Grant
}

const isStandardProposal = (proposal?: ProposalEnriched | GrantProposalEnriched): proposal is ProposalEnriched => {
  return proposal?.type === ProposalType.Standard
}

type Props = {
  proposal?: ProposalEnriched | GrantProposalEnriched
}

export const ProposalContentAndActions: React.FC<Props> = ({ proposal }) => {
  const { t } = useTranslation()
  const [proposalDecodeError, setProposalDecodeError] = useState<string | null>(null)
  const actions: ProposalFormAction[] = useMemo(() => {
    try {
      setProposalDecodeError(null)
      return getActionsFromTargetsAndCalldatas(
        proposal?.targets as string[],
        proposal?.calldatas as string[],
        GovernanceFeaturedContractsWithFunctions,
      )
    } catch (e: unknown) {
      if (e instanceof Error) setProposalDecodeError(e.message)
      else {
        setProposalDecodeError("Error decoding proposal")
      }
      return []
    }
  }, [proposal])

  return (
    <VStack gap={4} align="flex-start" w="full">
      {isGrantProposal(proposal) && (
        <VStack gap={4} align="flex-start" w="full">
          <Heading size="xl">{t("Company details")}</Heading>
          <VStack gap={1} align="flex-start" w="full" pb={4} borderBottom="1px solid #D5D5D5">
            <VStack gap={2} align="flex-start" w="full">
              <Text fontWeight="semibold">{proposal?.companyName}</Text>
              <Text>{proposal?.companyRegisteredNumber}</Text>
            </VStack>
            <HStack>
              <Icon color="#2D3748" as={FiMail} />
              <Text> {proposal?.companyEmail || t("unknown")}</Text>
            </HStack>
            <HStack>
              <Icon color="#2D3748" as={FaTelegram} />
              <Text>{proposal?.companyTelegram || t("unknown")}</Text>
            </HStack>
            <Text>
              <Text fontWeight="semibold">{t("Intro")}</Text>
              {proposal?.companyIntro}
            </Text>
          </VStack>

          <CollapsibleSection title={t("Grant details")} defaultOpen={true}>
            <VStack gap={3} align="flex-start" w="full" pb={4}>
              <VStack align="flex-start" gap={0}>
                <Text fontWeight="semibold">{t("Problem")}</Text>
                <Text>{proposal?.problemDescription}</Text>
              </VStack>
              <VStack align="flex-start" gap={0}>
                <Text fontWeight="semibold">{t("Solution")}</Text>
                <Text>{proposal?.solutionDescription}</Text>
              </VStack>
              <VStack align="flex-start" gap={0}>
                <Text fontWeight="semibold">{t("Key points")}</Text>
                <Text>{t("TBD")}</Text>
              </VStack>
              <VStack align="flex-start" gap={0}>
                <Text fontWeight="semibold">{t("Execution plan")}</Text>
                <Text>{proposal?.highLevelRoadmap}</Text>
              </VStack>
              <VStack align="flex-start" gap={0}>
                <Text fontWeight="semibold">{t("Target user")}</Text>
                <Text>{proposal?.targetUsers}</Text>
              </VStack>
              <VStack align="flex-start" gap={0}>
                <Text fontWeight="semibold">{t("Competitive edge / Differentiation factor")}</Text>
                <Text>{proposal?.competitiveEdge}</Text>
              </VStack>
            </VStack>
          </CollapsibleSection>

          <CollapsibleSection title={t("Outcomes")}>
            <VStack gap={1} align="flex-start" w="full" pb={4}>
              <VStack align="flex-start" gap={0}>
                <Text fontWeight="semibold">{t("Benefits to users")}</Text>
                <Text>{proposal?.benefitsToUsers}</Text>
              </VStack>
              <VStack align="flex-start" gap={0}>
                <Text fontWeight="semibold">{t("Benefits to dApps")}</Text>
                <Text>{proposal?.benefitsToDApps}</Text>
              </VStack>
              <VStack align="flex-start" gap={0}>
                <Text fontWeight="semibold">{t("Benefits to VeChain ecosystem")}</Text>
                <Text>{proposal?.benefitsToVeChainEcosystem}</Text>
              </VStack>
              <VStack align="flex-start" gap={0}>
                <Text fontWeight="semibold">{t("X2E model")}</Text>
                <Text>{proposal?.x2EModel}</Text>
              </VStack>
            </VStack>
          </CollapsibleSection>

          <CollapsibleSection title={t("Sources and additional")}>
            <VStack gap={1} align="flex-start" w="full" pb={4}>
              {/* Discourse thread (only standard proposal) */}
              <HStack>
                <Image alt="Discourse thread" boxSize="24px" src="/assets/icons/discourse.svg" />
                {/* // TODO(Proposal): Add discourse thread in the new inputs form */}
                {/* <Link color="#004CFC" href={proposal?.discourseThread} target="_blank" rel="noopener noreferrer">
                {"Discourse thread"}
              </Link> */}
              </HStack>

              <HStack>
                <Icon color="#2D3748" as={UilGithub} />
                <Link
                  color="#004CFC"
                  href={`https://github.com/${proposal?.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer">
                  {"Github"}
                </Link>
              </HStack>

              <HStack>
                <Icon color="#2D3748" as={UilTelegram} />
                <Link color="#004CFC" href={proposal?.companyTelegram} target="_blank" rel="noopener noreferrer">
                  {"Telegram"}
                </Link>
              </HStack>

              <HStack>
                <Icon color="#2D3748" as={UilGlobe} />
                <Link color="#004CFC" href={proposal?.projectWebsite} target="_blank" rel="noopener noreferrer">
                  {"Project website"}
                </Link>
              </HStack>

              <HStack>
                <Icon color="#2D3748" as={UilTwitter} />
                <Link
                  color="#004CFC"
                  href={`https://twitter.com/${proposal?.twitterUsername}`}
                  target="_blank"
                  rel="noopener noreferrer">
                  {"Twitter"}
                </Link>
              </HStack>
            </VStack>
          </CollapsibleSection>
        </VStack>
      )}

      {isStandardProposal(proposal) && (
        <VStack gap={8} align="flex-start" w="full">
          <MDEditor.Markdown
            source={proposal?.markdownDescription}
            style={{
              width: "100%",
              wordBreak: "break-word",
              borderRadius: "12px",
              backgroundColor: "contrast-on-dark-bg",
              color: "contrast-bg-strong-hover",
              padding: "20px",
              border: "1px solid #D5D5D5",
            }}
          />
          {proposalDecodeError && (
            <Alert.Root status="error" borderRadius={"lg"}>
              <Alert.Indicator />
              <Box>
                <Alert.Title>{t("Error decoding the proposal calldatas")}</Alert.Title>
                <Alert.Description>{proposalDecodeError}</Alert.Description>
              </Box>
            </Alert.Root>
          )}
          {!!actions.length && <ProposalExecutableActions actions={actions} />}
        </VStack>
        // TODO : Finish the standard proposal
        //   <VStack gap={4} align="flex-start" w="full">
        //     <Heading size="lg">{t("Summary")}</Heading>
        //     <Text>{proposal?.title}</Text>
        // {/* ============================== STANDARD PROPOSAL ============================== */}
        // {/* Summary (Description) */}
        // {/* ABout apllicant */}
        // {/* Name */}
        // {/* Roles */}
        // {/* email */}
        // {/* User address = proposerAddress */}

        // {/* Proposal details */}
        // {/* Motivation and goals */}
        // {/* Detailed description */}
        // {/* KeyPoints  */}
        // {/* Execution Plan */}
        // {/* Expected Impact */}
        // {/* Outcomes */}
        // {/* New features */}
        // {/* Features to change or remove */}

        // {/* Sources and additional for grants */}
        // {/* Discourse thread */}
        // {/* Github */}
        // {/* Telegram */}
        //     {proposalDecodeError && (
        //       <Alert.Root status="error" borderRadius={"lg"}>
        //         <Alert.Indicator />
        //         <Box>
        //           <Alert.Title>{t("Error decoding the proposal calldatas")}</Alert.Title>
        //           <Alert.Description>{proposalDecodeError}</Alert.Description>
        //         </Box>
        //       </Alert.Root>
        //     )}
        //     {!!actions.length && <ProposalExecutableActions actions={actions} />}
        //   </VStack>
      )}
    </VStack>
  )
}
