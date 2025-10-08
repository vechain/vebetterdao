import { useTranslation } from "react-i18next"
import { UilArrowRight } from "@iconscout/react-unicons"
import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { useIpfsMetadata, ProposalMetadata } from "@/api"
import { toIPFSURL } from "@/utils"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { Button } from "@chakra-ui/react"

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
      variant="warning"
      title={t("ACTIVE PROPOSAL")}
      description={proposalMetadata?.data?.title ? `"${proposalMetadata.data.title}"` : `---`}
      logoSrc="/assets/icons/vote-icon.webp"
      cta={
        <Button variant="primary" onClick={goToProposalPage}>
          {t("Vote now")}
          <UilArrowRight color="white" />
        </Button>
      }
    />
  )
}
