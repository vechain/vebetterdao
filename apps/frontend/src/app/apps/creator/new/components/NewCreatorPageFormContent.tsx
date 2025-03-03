import { Image, Stack, Text, useDisclosure, VStack, HStack, Card } from "@chakra-ui/react"
import { useForm } from "react-hook-form"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useHasCreatorNFT } from "@/api/contracts/x2EarnCreator/useHasCreatorNft"
import { SubmitCreatorFormData, SubmitCreatorForm } from "@/components/SubmitCreatorForm"
import { useCreatorSubmissionFormStore } from "@/store/useCreatorSubmissionFormStore"
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
        githubUsername: "",
        twitterUsername: "",
      },
    })

  const { errors } = formState
  const { t } = useTranslation()
  const { isOpen, onClose, onOpen } = useDisclosure()
  const { clearData } = useCreatorSubmissionFormStore()
  const router = useRouter()
  const [submitStatus, setSubmitStatus] = useState<"success" | "error">("success")
  const [submitErrorMessage, setSubmitErrorMessage] = useState("")
  const { account } = useWallet()
  const hasCreatorNft = useHasCreatorNFT(account ?? "")

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

      reset()
      clearData()
      signOut({ redirect: false })
      setSubmitStatus("success")
      setSubmitErrorMessage("")
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
      <VStack w={{ base: "100%", sm: "100%", md: "80%" }} spacing={0}>
        <HStack
          py={{ base: 5, md: 10 }}
          justify="space-between"
          bgColor="#004CFC"
          w="full"
          borderTopRadius="12px"
          px={{ base: 7, md: 10 }}
          bgImage={"/images/cloud-background.png"}
          bgSize="cover"
          bgPosition="center"
          bgRepeat="no-repeat">
          <Stack>
            <Text color="white" fontWeight="bold" fontSize={{ base: "lg", md: "xl" }}>
              {t("Apply for Creator's NFT")}
            </Text>
            <Text color="white" fontSize={{ base: "sm", md: "20" }}>
              {t("Get your Creator’s NFT to be able to submit your app into the VeBetterDAO ecosystem!")}
            </Text>
          </Stack>
          <Image
            src="/images/creator-nft-xl.png"
            alt="Apply for Creator's NFT"
            borderRadius={12}
            alignSelf={{ base: "center", md: "bottom" }}
            objectFit="cover"
            objectPosition={{ base: "center", md: "bottom" }}
            w={{ base: 90, md: 120, lg: 120 }}
            h={{ base: 90, md: 120, lg: 120 }}
          />
        </HStack>

        <Card w="full" borderTopRadius="0px" margin={0} py={0}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <SubmitCreatorForm
              register={register}
              errors={errors}
              control={control}
              watch={watch}
              setError={setError}
              setValue={setValue}
              clearErrors={clearErrors}
            />
          </form>
        </Card>
        <CreatorApplicationModal
          status={submitStatus}
          errorMessage={submitStatus === "error" ? submitErrorMessage : undefined}
          isOpen={isOpen}
          onClose={navigateToHome}
          onButtonClick={navigateToHome}
        />
      </VStack>
    </VStack>
  )
}
