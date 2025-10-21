import { Button } from "@chakra-ui/react"
import { UilArrowRight } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"

import { ProposalMetadata } from "../../../../../api/contracts/governance/getProposalsEvents"
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
      variant="info"
      title={t("ACTIVE PROPOSAL")}
      description={proposalMetadata?.data?.title ? `"${proposalMetadata.data.title}"` : `---`}
      illustration="/assets/icons/vote-icon.webp"
      cta={
        <Button variant="primary" onClick={goToProposalPage}>
          {t("Vote now")}
          <UilArrowRight color="white" />
        </Button>
      }
    />
  )
}
