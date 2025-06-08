import { ProposalCreatedEvent, ProposalMetadata } from "@/api"
import { useIpfsMetadata } from "@/api/ipfs"
import { ProposalExecutableActions } from "@/components/ProposalExecutableActions"
import { GovernanceFeaturedContractsWithFunctions, getActionsFromTargetsAndCalldatas } from "@/constants"
import { ProposalFormAction } from "@/store"
import { toIPFSURL } from "@/utils"
import {
  Card,
  CardBody,
  Heading,
  Alert,
  AlertIcon,
  AlertDescription,
  AlertTitle,
  Box,
  VStack,
  useColorMode,
} from "@chakra-ui/react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import "@uiw/react-md-editor/markdown-editor.css"
import MDEditor from "@uiw/react-md-editor"

type Props = {
  proposal: ProposalCreatedEvent
}
export const ProposalContentAndActions: React.FC<Props> = ({ proposal }) => {
  const metadata = useIpfsMetadata<ProposalMetadata>(toIPFSURL(proposal.description))
  const { colorMode } = useColorMode()

  const { t } = useTranslation()

  const [proposalDecodeError, setProposalDecodeError] = useState<string | null>(null)

  const actions: ProposalFormAction[] = useMemo(() => {
    try {
      setProposalDecodeError(null)
      return getActionsFromTargetsAndCalldatas(
        proposal.targets,
        proposal.callDatas,
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
    <Card w="full" variant="baseWithBorder">
      <CardBody py={8}>
        <VStack spacing={8} align="flex-start">
          <Heading fontSize={"24px"} fontWeight={700}>
            {t("About the proposal")}
          </Heading>
          <Box
            w="full"
            sx={{
              "& .w-md-editor-text-area .token.title .anchor": {
                color: colorMode === "dark" ? "#FFFFFF !important" : undefined,
              },
              "& .w-md-editor-preview .anchor": {
                color: colorMode === "dark" ? "#FFFFFF !important" : undefined,
              },
              "& .wmde-markdown a::before": {
                color: colorMode === "dark" ? "#FFFFFF !important" : undefined,
              },
              "& .wmde-markdown .anchor": {
                color: colorMode === "dark" ? "#FFFFFF !important" : undefined,
              },
              "& .octicon": {
                fill: colorMode === "dark" ? "#FFFFFF !important" : undefined,
              },
              "& .octicon-link": {
                fill: colorMode === "dark" ? "#FFFFFF !important" : undefined,
              },
            }}>
            <MDEditor.Markdown
              source={metadata?.data?.markdownDescription}
              style={{
                width: "100%",
                wordBreak: "break-word",
                borderRadius: "12px",
              }}
            />
          </Box>
          {proposalDecodeError && (
            <Alert status="error" borderRadius={"lg"}>
              <AlertIcon />
              <Box>
                <AlertTitle>{t("Error decoding the proposal calldatas")}</AlertTitle>
                <AlertDescription>{proposalDecodeError}</AlertDescription>
              </Box>
            </Alert>
          )}
          {!!actions.length && <ProposalExecutableActions actions={actions} />}
        </VStack>
      </CardBody>
    </Card>
  )
}
