import { Button, Card, Grid, Heading, HStack, Steps, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { LuArrowLeft, LuArrowRight, LuShield } from "react-icons/lu"

import { useGetMaxStake } from "@/api/contracts/navigatorRegistry/hooks/useGetMaxStake"
import { useGetMinStake } from "@/api/contracts/navigatorRegistry/hooks/useGetMinStake"
import { useRegisterNavigator } from "@/hooks/navigator/useRegisterNavigator"
import { useNavigatorApplicationStore } from "@/store/useNavigatorApplicationStore"
import { uploadBlobToIPFS } from "@/utils/ipfs"

import { NavigatorDetailsCard } from "../../components/NavigatorDetailsCard"
import { NavigatorInfoCard } from "../../components/NavigatorInfoCard"

import { DisclosuresStep } from "./steps/DisclosuresStep"
import { MotivationStep } from "./steps/MotivationStep"
import { SocialsStep } from "./steps/SocialsStep"
import { StakeStep } from "./steps/StakeStep"

const STEPS = [
  { title: "Motivation", description: "Why you want to be a navigator" },
  { title: "Disclosures", description: "Conflicts of interest" },
  { title: "Socials", description: "Your public profiles" },
  { title: "Stake", description: "Stake B3TR to register" },
]

export const BecomeNavigatorForm = () => {
  const router = useRouter()
  const { account } = useWallet()
  const data = useNavigatorApplicationStore(s => s.data)
  const currentStep = useNavigatorApplicationStore(s => s.currentStep)
  const setCurrentStep = useNavigatorApplicationStore(s => s.setCurrentStep)
  const clearData = useNavigatorApplicationStore(s => s.clearData)
  const { data: minStake } = useGetMinStake()
  const { data: maxStake } = useGetMaxStake()
  const [isUploading, setIsUploading] = useState(false)

  const handleSuccess = useCallback(() => {
    clearData()
    if (account?.address) {
      router.push(`/navigators/${account.address}`)
    } else {
      router.push("/navigators")
    }
  }, [clearData, router, account])

  const { sendTransaction, status } = useRegisterNavigator({
    onSuccess: handleSuccess,
  })

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0:
        return data.motivation.trim().length > 0 && data.qualifications.trim().length > 0
      case 1:
        return true
      case 2:
        return true
      case 3: {
        const stakeNum = Number(data.stakeAmount) || 0
        const minNum = minStake ? Number(minStake.scaled) : 0
        const maxNum = maxStake ? Number(maxStake.scaled) : Infinity
        return stakeNum >= minNum && stakeNum <= maxNum && stakeNum > 0
      }
      default:
        return false
    }
  }, [currentStep, data, minStake, maxStake])

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async () => {
    if (!account?.address) return
    setIsUploading(true)

    try {
      // Upload metadata to IPFS
      const metadata = {
        motivation: data.motivation,
        qualifications: data.qualifications,
        votingStrategy: data.votingStrategy,
        disclosures: {
          isAppAffiliated: data.isAppAffiliated,
          affiliatedAppNames: data.affiliatedAppNames,
          isFoundationMember: data.isFoundationMember,
          foundationRole: data.foundationRole,
          hasConflictsOfInterest: data.hasConflictsOfInterest,
          conflictsDescription: data.conflictsDescription,
          previousDaoExperience: data.previousDaoExperience,
        },
        socials: {
          twitter: data.twitterHandle,
          discord: data.discordHandle,
          website: data.websiteUrl,
          other: data.otherLinks,
        },
        registeredAt: new Date().toISOString(),
        address: account.address,
      }

      const blob = new Blob([JSON.stringify(metadata)], { type: "application/json" })
      const ipfsHash = await uploadBlobToIPFS(blob, "navigator-metadata.json")
      const uri = `ipfs://${ipfsHash}`

      // Send the approve + register transaction with params
      await sendTransaction({ stakeAmount: data.stakeAmount, metadataURI: uri })
    } catch (error) {
      console.error("Failed to register:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const isSubmitting = isUploading || status === "pending"

  return (
    <VStack gap={6} align="stretch" w="full" px={{ base: 4, md: 0 }}>
      <VStack gap={1} align="start">
        <HStack gap={2}>
          <LuShield size={24} />
          <Heading size={{ base: "lg", md: "xl" }}>{"Become a Navigator"}</Heading>
        </HStack>
        <Text textStyle="sm" color="fg.muted">
          {"Complete the following steps to register as a professional voting delegate."}
        </Text>
      </VStack>

      <Grid templateColumns={{ base: "1fr", lg: "1fr 300px" }} gap={6} alignItems="start">
        <VStack gap={6} align="stretch">
          <Steps.Root step={currentStep} count={STEPS.length} size="sm" colorPalette="green" variant="subtle">
            <Steps.List>
              {STEPS.map((step, index) => (
                <Steps.Item key={step.title} index={index}>
                  <Steps.Indicator />
                  <Steps.Title>{step.title}</Steps.Title>
                  <Steps.Separator />
                </Steps.Item>
              ))}
            </Steps.List>
          </Steps.Root>

          <Card.Root variant="outline" borderRadius="xl">
            <Card.Body>
              {currentStep === 0 && <MotivationStep />}
              {currentStep === 1 && <DisclosuresStep />}
              {currentStep === 2 && <SocialsStep />}
              {currentStep === 3 && <StakeStep />}
            </Card.Body>
          </Card.Root>

          <HStack justify="space-between">
            <Button variant="ghost" onClick={currentStep === 0 ? () => router.push("/navigators") : goBack} size="sm">
              <LuArrowLeft />
              {currentStep === 0 ? "Cancel" : "Back"}
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button colorPalette="green" onClick={goNext} disabled={!canProceed()} size="sm">
                {"Next"}
                <LuArrowRight />
              </Button>
            ) : (
              <Button
                colorPalette="green"
                onClick={onSubmit}
                disabled={!canProceed() || isSubmitting}
                loading={isSubmitting}
                size="sm">
                <LuShield />
                {"Register as Navigator"}
              </Button>
            )}
          </HStack>
        </VStack>

        <VStack gap={4} align="stretch" display={{ base: "none", lg: "flex" }}>
          <NavigatorInfoCard />
          <NavigatorDetailsCard />
        </VStack>
      </Grid>
    </VStack>
  )
}
