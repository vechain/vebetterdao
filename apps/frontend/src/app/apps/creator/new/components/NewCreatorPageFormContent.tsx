import { Image, Stack, Text, useDisclosure, VStack, HStack, Card } from "@chakra-ui/react"
import { useForm } from "react-hook-form"
import { SubmitCreatorForm, SubmitCreatorFormData } from "@/components/SubmitCreatorForm"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCreatorSubmissionFormStore } from "@/store"
import { useTranslation } from "react-i18next"
import { CreatorApplicationModal } from "./CreatorApplicationModal"
import { useEffect, useState } from "react"
import { useHasCreatorNFT } from "@/api/contracts/x2EarnCreator/hooks"
import { useWallet } from "@vechain/dapp-kit-react"

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
  }, [hasCreatorNft])

  const navigateToHome = () => {
    onClose()
    router.push("/")
  }

  const onSubmit = async (formValues: SubmitCreatorFormData) => {
    try {
      const response = await fetch("/api/app/creator", {
        method: "POST",
        body: JSON.stringify(formValues),
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
      <VStack w={{ base: "100%", sm: "100%", md: "80%" }}>
        <HStack justify={{ base: "space-between", md: "center" }} bgColor="#004CFC" w="full" borderRadius="12px" px={5}>
          <Stack maxW={{ base: "100%", sm: "100%", md: "30%" }} py={{ base: 3, md: 5 }}>
            <Text color="white" fontWeight="bold" fontSize={{ base: "lg", md: "xl" }}>
              {t("Apply for Creator's NFT")}
            </Text>
            <Text color="white" fontSize={{ base: "sm", md: "md" }}>
              {t("Get your Creator’s NFT to be able to submit your app into the VeBetterDAO ecosystem!")}
            </Text>
          </Stack>
          <Image
            src="/images/mascot/holding-tokens.png"
            alt="Mascot"
            alignSelf="end"
            objectFit="cover"
            objectPosition="bottom"
          />
        </HStack>

        <Card w="full">
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
          onClose={onClose}
          onButtonClick={navigateToHome}
        />
      </VStack>
    </VStack>
  )
}
