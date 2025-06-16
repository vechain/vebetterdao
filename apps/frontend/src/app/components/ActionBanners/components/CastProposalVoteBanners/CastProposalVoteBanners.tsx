import { useTranslation } from "react-i18next"
import { UilArrowRight } from "@iconscout/react-unicons"
import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { useIpfsMetadata, ProposalMetadata } from "@/api"
import { toIPFSURL } from "@/utils"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

type Props = {
  key: string
  id: string
  description: string
}

export const CastProposalVoteBanners = ({ key, id, description }: Props) => {
  const { t } = useTranslation()
  const proposalMetadata = useIpfsMetadata<ProposalMetadata>(toIPFSURL(description))

  const router = useRouter()
  const goToProposalPage = useCallback(() => {
    if (!id) return router.push("/proposals")
    router.push(`/proposals/${id}`)
  }, [router, id])

  return (
    <GenericBanner
      key={key}
      title={t("ACTIVE PROPOSAL")}
      description={proposalMetadata?.data?.title ? `"${proposalMetadata.data.title}"` : `---`}
      logoSrc="/assets/icons/vote-icon.webp"
      backgroundColor="#FFD979"
      backgroundImageSrc="/assets/backgrounds/cloud-background-orange.webp"
      buttonLabel={t("Vote now")}
      onButtonClick={goToProposalPage}
      buttonVariant="primaryAction"
      buttonIcon={<UilArrowRight color="white" />}
    />
  )
}
