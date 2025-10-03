import { CollapsibleSection } from "@/app/components/CollapsibleSection"
import { CollapsibleSectionItem } from "@/app/components/CollapsibleSectionItem"
import { FileAttachmentPreview } from "@/app/grants/components"
import { ProposalExecutableActions } from "@/components/ProposalExecutableActions"
import { useColorModeValue } from "@/components/ui/color-mode"
import { getActionsFromTargetsAndCalldatas, GovernanceFeaturedContractsWithFunctions } from "@/constants"
import { AttachmentFile, GrantProposalEnriched, ProposalEnriched, ProposalType } from "@/hooks/proposals/grants/types"
import { ProposalFormAction } from "@/store"
import { removeTitleHeading } from "@/utils"
import { Alert, Box, Grid, GridItem, IconButton, Image, VStack } from "@chakra-ui/react"
import { UilGithub } from "@iconscout/react-unicons"
import { getConfig } from "@repo/config"
import MDEditor from "@uiw/react-md-editor"
import { Link, Linkedin } from "iconoir-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { AiOutlineDiscord } from "react-icons/ai"
import { FaArrowLeft, FaArrowRight } from "react-icons/fa"
import { FaXTwitter } from "react-icons/fa6"
import { LuMail } from "react-icons/lu"
import { RiTelegram2Line } from "react-icons/ri"
import { A11y, Navigation, Pagination } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"

import { SocialLink } from "../SocialLink"

import "@/app/theme/swiper-custom.css"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"

const isGrantProposal = (proposal?: ProposalEnriched | GrantProposalEnriched): proposal is GrantProposalEnriched => {
  return proposal?.type === ProposalType.Grant
}

const isStandardProposal = (proposal?: ProposalEnriched | GrantProposalEnriched): proposal is ProposalEnriched => {
  return proposal?.type === ProposalType.Standard
}

type Props = {
  proposal?: ProposalEnriched | GrantProposalEnriched
}

const ipfs = getConfig().ipfsFetchingService

export const ProposalContentAndActions: React.FC<Props> = ({ proposal }) => {
  // ==========================================
  // HOOKS
  // ==========================================
  const { t } = useTranslation()
  const [proposalDecodeError, setProposalDecodeError] = useState<string | null>(null)
  const markdownPreviewTextColor = useColorModeValue("#2D3748", "#E4E4E4")
  const markdownPreviewBackgroundColor = useColorModeValue("#F8F8F8", "#2D2D2F")
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

  const hasSocials = useMemo(() => {
    if (proposal?.type === ProposalType.Standard) return false
    const typedProposal = proposal as GrantProposalEnriched
    return (
      typedProposal?.githubUsername ||
      typedProposal?.discordUserId ||
      typedProposal?.companyTelegram ||
      typedProposal?.projectWebsite ||
      typedProposal?.twitterUsername
    )
  }, [proposal])

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <VStack gap={7} align="flex-start" w="full">
      {/* Grant proposal content */}
      {isGrantProposal(proposal) && (
        <VStack gap={7} align="flex-start" w="full">
          {/* Company details section */}
          <CollapsibleSection title={t("Company details")} defaultOpen={true}>
            <CollapsibleSectionItem title={t("Name")} value={proposal?.companyName} />
            <CollapsibleSectionItem title={t("Registration number / VAT")} value={proposal?.companyRegisteredNumber} />
            {proposal?.companyEmail || proposal?.companyTelegram ? (
              <VStack py={2} align="flex-start" w="full">
                {proposal?.companyEmail ? (
                  <SocialLink
                    icon={LuMail}
                    href={`mailto:${proposal.companyEmail}`}
                    label="Email"
                    value={proposal.companyEmail}
                  />
                ) : null}

                {proposal?.companyLinkedin ? (
                  <SocialLink
                    icon={Linkedin}
                    href={proposal.companyLinkedin}
                    label="Linkedin"
                    value={proposal.companyLinkedin}
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
            ) : null}

            <CollapsibleSectionItem title={t("Project Intro")} value={proposal?.projectIntro} />
            <CollapsibleSectionItem title={t("Team Overview")} value={proposal?.teamOverview} />
          </CollapsibleSection>

          {/* Grant details section */}
          <CollapsibleSection title={t("Grant details")} defaultOpen={true}>
            <VStack gap={4} align="flex-start" textAlign="flex-start" w="full">
              <CollapsibleSectionItem title={t("Problem")} value={proposal?.problemDescription} />
              <CollapsibleSectionItem title={t("Solution")} value={proposal?.solutionDescription} />
              <CollapsibleSectionItem title={t("Execution plan")} value={proposal?.highLevelRoadmap} />
              <CollapsibleSectionItem title={t("Target user")} value={proposal?.targetUsers} />
              <CollapsibleSectionItem title={t("Revenue model")} value={proposal?.revenueModel} />
              <CollapsibleSectionItem
                title={t("Competitive edge / Differentiation factor")}
                value={proposal?.competitiveEdge}
              />
            </VStack>
          </CollapsibleSection>

          {/* Outcomes section */}
          <CollapsibleSection title={t("Outcomes")}>
            <VStack gap={4} align="flex-start" w="full">
              <CollapsibleSectionItem title={t("Benefits to users")} value={proposal?.benefitsToUsers} />

              <CollapsibleSectionItem title={t("Benefits to apps")} value={proposal?.benefitsToDApps} />

              <CollapsibleSectionItem
                title={t("Benefits to VeChain ecosystem")}
                value={proposal?.benefitsToVeChainEcosystem}
              />

              <CollapsibleSectionItem title={t("X2E model")} value={proposal?.x2EModel} />
            </VStack>
          </CollapsibleSection>

          {/* Sources and additional information section */}
          {hasSocials || hasAttachments ? (
            <CollapsibleSection title={t("Sources and additional")} showSeparator={false}>
              <VStack gap={4} align="flex-start" w="full">
                {proposal?.discordUserId ? (
                  <SocialLink
                    icon={AiOutlineDiscord}
                    href={`https://discord.com/users/${proposal.discordUserId}`}
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
                  <SocialLink icon={Link} href={proposal.projectWebsite} label="Project website" />
                ) : null}
                {proposal?.appTestnetUrl ? (
                  <SocialLink icon={Link} href={proposal.appTestnetUrl} label="App Testnet URL" />
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
                      <GridItem key={attachment.ipfs} colSpan={{ base: 2, md: 1 }}>
                        <FileAttachmentPreview attachment={attachment} uniqueKey={index} />
                      </GridItem>
                    ))}

                    <GridItem colSpan={2} px={1}>
                      <Swiper
                        modules={[A11y, Navigation, Pagination]}
                        slidesPerView={1}
                        navigation={{
                          prevEl: ".custom-swiper-button-prev",
                          nextEl: ".custom-swiper-button-next",
                        }}
                        pagination>
                        {proposal?.outcomesAttachment
                          ?.filter(attachment => attachment.type.startsWith("image"))
                          .map(attachment => (
                            <SwiperSlide
                              key={`slide-${attachment.ipfs}`}
                              className="slide"
                              style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                width: "100%",
                                height: "100%",
                                position: "relative",
                              }}>
                              <Image alt={attachment.name || "Attachment image"} src={`${ipfs}/${attachment.ipfs}`} />
                            </SwiperSlide>
                          ))}

                        <IconButton
                          hideBelow="md"
                          className="custom-swiper-button-prev"
                          pos={"absolute"}
                          zIndex={2}
                          rounded="full"
                          left={0}
                          top={"50%"}
                          transform={"translateY(-50%)"}
                          aria-label="Previous app">
                          <FaArrowLeft />
                        </IconButton>
                        <IconButton
                          hideBelow="md"
                          className="custom-swiper-button-next"
                          pos={"absolute"}
                          zIndex={2}
                          rounded="full"
                          right={0}
                          top={"50%"}
                          transform={"translateY(-50%)"}
                          aria-label="Next app">
                          <FaArrowRight />
                        </IconButton>
                      </Swiper>
                    </GridItem>
                  </Grid>
                </VStack>
              ) : null}
            </CollapsibleSection>
          ) : null}
        </VStack>
      )}

      {/* Standard proposal content */}
      {isStandardProposal(proposal) && (
        <VStack gap={8} align="flex-start" w="full">
          {/* Markdown content */}
          <Box
            px={0}
            m={0}
            gap={0}
            w="full"
            css={{
              "& .w-md-editor-text": {
                backgroundColor: "transparent !important",
              },
              "& table, & table tr, & table th, & table td, & table thead, & table tbody, & table tfoot": {
                backgroundColor: "transparent !important",
              },
              "& code, & pre, & pre code, & .token": {
                backgroundColor: `${markdownPreviewBackgroundColor} !important`,
              },
              "& blockquote": {
                color: `${markdownPreviewTextColor} !important`,
                backgroundColor: `${markdownPreviewBackgroundColor} !important`,
              },
            }}>
            <MDEditor.Markdown
              source={removeTitleHeading(proposal?.markdownDescription, proposal?.title)}
              style={{
                maxWidth: "100%",
                wordBreak: "break-word",
                backgroundColor: "transparent",
                color: markdownPreviewTextColor,
              }}
            />
          </Box>

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
