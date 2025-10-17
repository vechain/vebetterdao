import { Button, VStack, Text, Icon } from "@chakra-ui/react"
import { UilArrowRight, UilInfoCircle, UilGift } from "@iconscout/react-unicons"
import { Meta } from "@storybook/nextjs-vite"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"

const meta = {
  title: "b3tr/components/Banner",
  component: GenericBanner,
} satisfies Meta<typeof GenericBanner>

export default meta

export const Default = () => (
  <VStack gap="4">
    <GenericBanner
      logoSrc="/assets/icons/info-bell.webp"
      variant="info"
      title="Primary"
      description="Info"
      cta={<Button variant="primary">{"CTA"}</Button>}
    />
    <GenericBanner
      logoSrc="/assets/icons/info-bell.webp"
      variant="success"
      title="Success"
      description="Success"
      cta={<Button variant="primary">{"CTA"}</Button>}
    />
    <GenericBanner
      logoSrc="/assets/icons/info-bell.webp"
      variant="warning"
      title="Warning"
      description="Warning"
      cta={<Button variant="primary">{"CTA"}</Button>}
    />
  </VStack>
)
// TODO: import as component after you fix mocking
export const ActionBanners = () => (
  <VStack gap="4">
    {/* LowVthoBanner */}
    <GenericBanner
      variant="warning"
      logoSrc="/assets/icons/lightning.webp"
      title="NOT ENOUGH VTHO"
      description="Get more VTHO to be able to vote and perform transactions!"
      cta={
        <Button variant="secondary">
          Get more VTHO
          <Icon as={UilArrowRight} />
        </Button>
      }
    />

    {/* DelegatingBanner */}
    <GenericBanner
      variant="info"
      title="VOTING POWER DELEGATED"
      description={
        <Text textStyle={{ base: "lg", md: "xl" }} fontWeight="bold">
          Your voting power has been transferred to{" "}
          <Text as="span" cursor="pointer" fontWeight="900">
            veDelegate.vet
          </Text>{" "}
          which votes on your behalf. If you want to vote here, you must remove delegation on veDelegate before
          snapshot.
        </Text>
      }
      logoSrc="/assets/logos/veDelegate.svg"
      cta={
        <Button variant="secondary">
          <Icon as={UilInfoCircle} />
          Learn more
        </Button>
      }
    />

    {/* DoActionBanner */}
    <GenericBanner
      variant="warning"
      title="TIME TO STEP UP! 🏃🏼‍♂️"
      description="Complete Better Actions in our apps and unlock your right to vote. Make your impact count!"
      logoSrc="/assets/icons/info-bell.webp"
      cta={
        <Button variant="primary">
          <UilInfoCircle />
          Know more
        </Button>
      }
    />

    {/* CastVoteBanner */}
    <GenericBanner
      variant="warning"
      title="CAST YOUR VOTE NOW! ⚖️"
      logoSrc="/assets/icons/vote-icon.webp"
      description="It's time to make your voice heard in this round and earn exciting rewards!"
      cta={
        <Button variant="primary">
          <UilArrowRight color="white" />
          See round
        </Button>
      }
    />
  </VStack>
)

export const CreatorBanners = () => (
  <VStack gap="4">
    {/* CreatorApplicationApprovedBanner */}
    <GenericBanner
      variant="info"
      title="CREATOR'S NFT RECEIVED"
      description="Your Creator application was approved. Submit your app!"
      logoSrc="/assets/images/creator-nft.webp"
      cta={
        <Button variant="primary">
          <Icon as={UilArrowRight} color="white" />
          Submit app
        </Button>
      }
    />

    {/* CreatorApplicationRejectedBanner */}
    <GenericBanner
      variant="warning"
      title="CREATOR APPLICATION REJECTED"
      description="Your Creator's NFT application was rejected"
      logoSrc="/assets/mascot/mascot-warning-head.webp"
      cta={
        <Button variant="primary">
          <Icon as={UilArrowRight} color="white" />
          Apply again
        </Button>
      }
    />

    {/* CreatorApplicationUnderReviewBanner - Simple example since original is very basic */}
    <GenericBanner
      variant="info"
      title="CREATOR APPLICATION UNDER REVIEW"
      description="Your Creator application is being reviewed"
      logoSrc="/assets/icons/info-bell.webp"
      cta={<Button variant="outline">Check status</Button>}
    />
  </VStack>
)

export const StargateBanners = () => (
  <VStack gap="4">
    {/* StargateMigrationBanner - Regular */}
    <GenericBanner
      variant="info"
      title="STARGATE IS LIVE 🌌"
      description="Start staking VET to explore the new stargate universe !"
      logoSrc="/assets/images/b3mo-stargate.svg"
      cta={
        <Button variant="primary">
          Explore
          <Icon as={UilArrowRight} />
        </Button>
      }
    />

    {/* StargateMigrationBanner - Legacy Node */}
    <GenericBanner
      variant="info"
      title="STARGATE IS LIVE 🌌"
      description="Migrate your legacy node to discover the new stargate universe !"
      logoSrc="/assets/images/b3mo-stargate.svg"
      cta={
        <Button variant="primary">
          Explore
          <Icon as={UilArrowRight} />
        </Button>
      }
    />
  </VStack>
)

export const RewardsBanners = () => (
  <VStack gap="4">
    {/* ClaimVotingRewardsBanner - Without GM rewards */}
    <GenericBanner
      variant="info"
      title="CLAIM YOUR REWARDS"
      logoSrc="/assets/icons/claim-b3tr-icon.webp"
      description="Congratulations! You have B3TR to claim for casting your vote in governance."
      cta={
        <Button variant="primary">
          <Icon as={UilGift} color="white" />
          Claim your 1.23K B3TR
        </Button>
      }
    />

    {/* ClaimVotingRewardsBanner - With GM rewards */}
    <GenericBanner
      variant="info"
      title="CLAIM YOUR REWARDS"
      logoSrc="/assets/icons/claim-b3tr-icon.webp"
      description="Congratulations! You have B3TR to claim for casting your vote in governance and holding GM."
      cta={
        <Button variant="primary">
          <Icon as={UilGift} color="white" />
          Claim your 1.23K B3TR
        </Button>
      }
    />
  </VStack>
)

export const ProposalBanners = () => (
  <VStack gap="4">
    {/* CastProposalVoteBanners */}
    <GenericBanner
      variant="warning"
      title="ACTIVE PROPOSAL"
      description="Sample Proposal Title for Testing"
      logoSrc="/assets/icons/vote-icon.webp"
      cta={
        <Button variant="primary">
          <UilArrowRight color="white" />
          Vote now
        </Button>
      }
    />
  </VStack>
)

export const UserSignaledBanners = () => (
  <VStack gap="4">
    {/* UserSignaledBanner */}
    <GenericBanner
      variant="warning"
      title="YOU HAVE BEEN SIGNALLED"
      description={
        <Text textStyle={{ base: "lg", md: "xl" }} fontWeight="bold">
          {"You have been signalled by"} <b>{"Mugshot"}</b>
          {<br />}
          {"If you believe this signal is unfair, please reach out to the app that signalled you to resolve the issue."}
        </Text>
      }
      logoSrc="/assets/icons/info-bell.webp"
      cta={
        <Button variant="secondary">
          Appeal here
          <Icon as={UilInfoCircle} />
        </Button>
      }
    />
  </VStack>
)

export const NewAppBanners = () => (
  <VStack gap="4">
    {/* NewAppBanner - Single app */}
    <GenericBanner
      variant="info"
      title="NEW APP AVAILABLE"
      description="Sample App just joined the DAO! Get involved in the app now!"
      logoSrc="/assets/icons/new-app-gold.svg"
      cta={
        <Button variant="primary">
          Explore
          <Icon as={UilArrowRight} />
        </Button>
      }
    />

    {/* NewAppBanner - Multiple apps */}
    <GenericBanner
      variant="info"
      title="NEW APP AVAILABLE"
      description="Sample App and 2 more just joined the DAO! Get involved in the app now!"
      logoSrc="/assets/icons/new-app-gold.svg"
      cta={
        <Button variant="primary">
          Explore
          <Icon as={UilArrowRight} />
        </Button>
      }
    />
  </VStack>
)
