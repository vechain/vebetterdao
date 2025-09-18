import { Alert, Box, Grid, GridItem, VStack } from "@chakra-ui/react"
import { UilGithub, UilGlobe } from "@iconscout/react-unicons"
import MDEditor from "@uiw/react-md-editor"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { AiOutlineDiscord } from "react-icons/ai"
import { FaXTwitter } from "react-icons/fa6"
import { LuMail } from "react-icons/lu"
import { RiTelegram2Line } from "react-icons/ri"

import { CollapsibleSection } from "@/app/components/CollapsibleSection"
import { CollapsibleSectionItem } from "@/app/components/CollapsibleSectionItem"
import { FileAttachmentPreview } from "@/app/proposals/grants/components"
import { ProposalExecutableActions } from "@/components/ProposalExecutableActions"
import { useColorModeValue } from "@/components/ui/color-mode"
import { getActionsFromTargetsAndCalldatas, GovernanceFeaturedContractsWithFunctions } from "@/constants"
import { AttachmentFile, GrantProposalEnriched, ProposalEnriched, ProposalType } from "@/hooks/proposals/grants/types"
import { ProposalFormAction } from "@/store"
import { removeTitleHeading } from "@/utils"

import { SocialLink } from "../SocialLink"

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
  // ==========================================
  // HOOKS
  // ==========================================
  const { t } = useTranslation()
  const [proposalDecodeError, setProposalDecodeError] = useState<string | null>(null)
  const markdownPreviewTextColor = useColorModeValue("#2D3748", "#E4E4E4")

  // ==========================================
  // COMPUTED VALUES & CONSTANTS
  // ==========================================
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

  const hasAttachments = useMemo(() => {
    if (proposal?.type === ProposalType.Standard) return false
    const typedProposal = proposal as GrantProposalEnriched
    return typedProposal?.outcomesAttachment?.length && typedProposal?.outcomesAttachment?.length > 0
  }, [proposal])

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <VStack gap={4} align="flex-start" w="full">
      {/* Grant proposal content */}
      {isGrantProposal(proposal) && (
        <VStack gap={"40px"} align="flex-start" w="full">
          {/* Company details section */}
          <CollapsibleSection title={t("Company details")} defaultOpen={true}>
            <CollapsibleSectionItem
              title={proposal?.companyName}
              value={proposal?.companyRegisteredNumber ?? " --- "}
            />
            <VStack py={2} align="flex-start" w="full">
              {proposal?.companyEmail ? (
                <SocialLink
                  icon={LuMail}
                  href={`mailto:${proposal.companyEmail}`}
                  label="Email"
                  value={proposal.companyEmail}
                />
              ) : null}

              {proposal?.companyTelegram ? (
                <SocialLink
                  icon={RiTelegram2Line}
                  href={proposal.companyTelegram}
                  label="Telegram"
                  value={proposal.companyTelegram}
                />
              ) : null}
            </VStack>

            <CollapsibleSectionItem title={t("Intro")} value={proposal?.companyIntro} />
          </CollapsibleSection>

          {/* Grant details section */}
          <CollapsibleSection title={t("Grant details")} defaultOpen={true}>
            <VStack align="flex-start" textAlign="flex-start" w="full">
              <CollapsibleSectionItem title={t("Problem")} value={proposal?.problemDescription} />
              <CollapsibleSectionItem title={t("Solution")} value={proposal?.solutionDescription} />
              <CollapsibleSectionItem title={t("Execution plan")} value={proposal?.highLevelRoadmap} />
              <CollapsibleSectionItem title={t("Target user")} value={proposal?.targetUsers} />
              <CollapsibleSectionItem
                title={t("Competitive edge / Differentiation factor")}
                value={proposal?.competitiveEdge}
              />
            </VStack>
          </CollapsibleSection>

          {/* Outcomes section */}
          <CollapsibleSection title={t("Outcomes")}>
            <VStack align="flex-start" w="full">
              <CollapsibleSectionItem title={t("Benefits to users")} value={proposal?.benefitsToUsers} />

              <CollapsibleSectionItem title={t("Benefits to dApps")} value={proposal?.benefitsToDApps} />

              <CollapsibleSectionItem
                title={t("Benefits to VeChain ecosystem")}
                value={proposal?.benefitsToVeChainEcosystem}
              />

              <CollapsibleSectionItem title={t("X2E model")} value={proposal?.x2EModel} />
            </VStack>
          </CollapsibleSection>

          {/* Sources and additional information section */}
          <CollapsibleSection title={t("Sources and additional")}>
            <VStack gap={"16px"} align="flex-start" w="full">
              {proposal?.discordUsername ? (
                <SocialLink
                  icon={AiOutlineDiscord}
                  href={`https://discord.com/users/${proposal.discordUsername}`}
                  label="Discord"
                />
              ) : null}
              {proposal?.githubUsername ? (
                <SocialLink icon={UilGithub} href={`https://github.com/${proposal.githubUsername}`} label="Github" />
              ) : null}
              {proposal?.companyTelegram ? (
                <SocialLink icon={RiTelegram2Line} href={proposal.companyTelegram} label="Telegram" />
              ) : null}
              {proposal?.projectWebsite ? (
                <SocialLink icon={UilGlobe} href={proposal.projectWebsite} label="Project website" />
              ) : null}
              {proposal?.twitterUsername ? (
                <SocialLink icon={FaXTwitter} href={`https://x.com/${proposal.twitterUsername}`} label="Twitter" />
              ) : null}
            </VStack>

            {/* File attachments */}
            {hasAttachments ? (
              <VStack align="flex-start" w="full" gap={4} pt={10}>
                <Grid templateColumns="repeat(2, 1fr)" w="full" gap={4}>
                  {proposal?.outcomesAttachment?.map((attachment: AttachmentFile, index: number) => (
                    <GridItem key={attachment.ipfs} colSpan={1}>
                      <FileAttachmentPreview attachment={attachment} uniqueKey={index} />
                    </GridItem>
                  ))}
                </Grid>
              </VStack>
            ) : null}
          </CollapsibleSection>
        </VStack>
      )}

      {/* Standard proposal content */}
      {isStandardProposal(proposal) && (
        <VStack gap={8} align="flex-start" w="full">
          {/* Markdown content */}
          <MDEditor.Markdown
            source={removeTitleHeading(proposal?.markdownDescription, proposal?.title)}
            style={{
              width: "100%",
              wordBreak: "break-word",
              backgroundColor: "transparent",
              color: markdownPreviewTextColor,
              padding: "20px",
            }}
          />

          {/* Error display */}
          {proposalDecodeError && (
            <Alert.Root status="error" borderRadius={"lg"}>
              <Alert.Indicator />
              <Box>
                <Alert.Title>{t("Error decoding the proposal calldatas")}</Alert.Title>
                <Alert.Description>{proposalDecodeError}</Alert.Description>
              </Box>
            </Alert.Root>
          )}

          {/* Executable actions */}
          {!!actions.length && <ProposalExecutableActions actions={actions} />}
        </VStack>
      )}
    </VStack>
  )
}
