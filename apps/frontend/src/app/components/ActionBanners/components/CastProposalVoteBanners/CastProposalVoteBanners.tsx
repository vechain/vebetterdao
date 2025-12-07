import { Button } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"

import { ProposalMetadata } from "../../../../../api/contracts/governance/types"
import { useIpfsMetadata } from "../../../../../api/ipfs/hooks/useIpfsMetadata"
import { toIPFSURL } from "../../../../../utils/ipfs"

type Props = {
  id: string
  description: string
}
export const CastProposalVoteBanners = ({ id, description }: Props) => {
  const { t } = useTranslation()
  const proposalMetadata = useIpfsMetadata<ProposalMetadata>(toIPFSURL(description))
  const router = useRouter()
  const goToProposalPage = useCallback(() => {
    if (!id) return router.push("/proposals")
    router.push(`/proposals/${id}`)
  }, [router, id])
  return (
    <GenericBanner
      title={t("Active proposal")}
      description={proposalMetadata?.data?.title ? `"${proposalMetadata.data.title}"` : `---`}
      illustration="/assets/icons/vote-icon.webp"
      cta={
        <Button size={{ base: "sm", md: "md" }} variant="primary" onClick={goToProposalPage}>
          {t("Vote now")}
        </Button>
      }
    />
  )
}
