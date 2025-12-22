import { Box, Card, Heading, HStack, Image, Stack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useHasCreatorNFT } from "@/api/contracts/x2EarnCreator/useHasCreatorNft"
import { useCreatorSubmissionFormStore } from "@/store/useCreatorSubmissionFormStore"

import { creatorSubmissionQueryKey } from "../../../../../api/contracts/x2EarnCreator/useCreatorSubmission"
import { SubmitCreatorFormData, SubmitCreatorForm } from "../../../../../components/SubmitCreatorForm/SubmitCreatorForm"

import { CreatorApplicationModal } from "./CreatorApplicationModal"

export const NewCreatorPageFormContent = () => {
  const { register, reset, setValue, setError, watch, formState, control, handleSubmit, clearErrors } =
    useForm<SubmitCreatorFormData>({
      defaultValues: {
        appName: "",
        appDescription: "",
        adminWalletAddress: "",
        projectUrl: "",
        adminName: "",
        adminEmail: "",
        githubUsername: "foo",
        twitterUsername: "bar",
        distributionStrategy: "",
        testnetProjectUrl: "",
        testnetAppId: "",
        securityApiSecurityMeasures: false,
        securityActionVerification: false,
        securityDeviceFingerprint: false,
        securitySecureKeyManagement: false,
        securityAntiFarming: false,
      },
    })
  const { errors } = formState
  const { t } = useTranslation()
  const { open: isOpen, onClose, onOpen } = useDisclosure()
  const { clearData } = useCreatorSubmissionFormStore()
  const router = useRouter()
  const [submitStatus, setSubmitStatus] = useState<"success" | "error">("success")
  const [submitErrorMessage, setSubmitErrorMessage] = useState("")
  const { account } = useWallet()
  const { data: hasCreatorNft } = useHasCreatorNFT(account?.address ?? "")
  const queryClient = useQueryClient()
  useEffect(() => {
    //Users with Creator NFT should be redirected to the new app page
    if (hasCreatorNft) router.push("/apps/new")
  }, [hasCreatorNft, router])

  const navigateToHome = () => {
    onClose()
    router.push("/")
  }

  const onSubmit = async ({ adminWalletAddress, testnetAppId, ...formValues }: SubmitCreatorFormData) => {
    try {
      const response = await fetch("/api/app/creator", {
        method: "POST",
        body: JSON.stringify({
          ...formValues,
          adminWalletAddress: adminWalletAddress.toLowerCase(),
          testnetAppId: testnetAppId.toLowerCase(),
        }),
      })
      if (!response.ok) throw new Error("Failed to submit creator application")

      setSubmitStatus("success")
      setSubmitErrorMessage("")
      reset() //Reset the form inputs
      clearData() //Clear the form storage
      signOut({ redirect: false }) //Sign out the user
      //Refetch creator submissions query on success
      queryClient.refetchQueries({ queryKey: creatorSubmissionQueryKey(adminWalletAddress ?? "") })
    } catch (error: unknown) {
      let errorMessage = "An error occurred while submitting the form."
      if (error instanceof Error) errorMessage = error.message
      setSubmitStatus("error")
      setSubmitErrorMessage(errorMessage)
    } finally {
      onOpen()
    }
  }

  return (
    <VStack align="center" w="100%" justify="center">
      <VStack w={{ base: "100%", sm: "100%", md: "80%" }} gap={0}>
        <HStack
          justify="space-between"
          align="center"
          bgColor="#004CFC"
          w="full"
          borderTopRadius="12px"
          bgImage={"/assets/backgrounds/cloud-background.webp"}
          bgSize="cover"
          backgroundPosition="center"
          bgRepeat="no-repeat"
          px={4}>
          {/* Text Container */}
          <Stack w="60%" minW="200px" py={2} pl={{ base: 0, md: 4 }}>
            <Heading color="white" size={{ base: "md", md: "xl", lg: "2xl" }}>
              {t("Apply for Creator's NFT")}
            </Heading>
            <Text color="white" textStyle={{ base: "sm", md: "md", lg: "lg" }}>
              {t("Get your Creator’s NFT to be able to submit your app into the VeBetter ecosystem!")}
            </Text>
          </Stack>

          {/* Image Container */}
          <Box w="full" h="full" maxW="180px" alignSelf="flex-end" display="flex" justifyContent="flex-end">
            <Image
              w="full"
              h="full"
              src="/assets/mascot/mascot-holding-tokens.webp"
              alt="Apply for Creator's NFT"
              objectFit="contain"
              objectPosition="bottom"
            />
          </Box>
        </HStack>

        <Card.Root w="full" borderTopRadius="0px" margin={0} py={0}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <SubmitCreatorForm
              register={register}
              errors={errors}
              control={control}
              watch={watch}
              setError={setError}
              setValue={setValue}
              clearErrors={clearErrors}
              resetForm={reset}
              clearData={clearData}
            />
          </form>
        </Card.Root>
        <CreatorApplicationModal
          status={submitStatus}
          errorMessage={submitStatus === "error" ? submitErrorMessage : undefined}
          isOpen={isOpen}
          onClose={onClose}
          onButtonClick={navigateToHome}
        />
      </VStack>
    </VStack>
  )
}
