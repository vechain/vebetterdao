import { VStack } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"

import { B3MOProposalReviewBanner } from "@/app/proposals/[proposalId]/components/B3MOProposalReviewBanner/B3MOProposalReviewBanner"

const meta = {
  title: "design-system/components/Banner/B3MOProposalReviewBanner",
  component: B3MOProposalReviewBanner,
} satisfies Meta<typeof B3MOProposalReviewBanner>

export default meta

export const Default = () => (
  <VStack gap="8" w="full">
    <B3MOProposalReviewBanner proposalId="46302950369351555920255441729477635429872046926697616480213674285979782389049" />
  </VStack>
)

export const Mobile = () => <Default />
Mobile.globals = { theme: "light", viewport: { value: "mobile2" } }

export const MobileDark = () => <Default />
MobileDark.globals = { theme: "dark", viewport: { value: "mobile2" } }
