import { useEffect } from "react"
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { isValid } from "@repo/utils/AddressUtils"
import {
  Control,
  FieldErrors,
  UseFormClearErrors,
  UseFormRegister,
  UseFormSetError,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form"
import { useTranslation } from "react-i18next"
import { signIn, signOut, useSession } from "next-auth/react"
import { useCreatorSubmissionFormStore } from "@/store"

export type SubmitCreatorFormData = {
  appName: string
  appDescription: string
  adminName: string
  adminWalletAddress: string
  adminEmail: string
  projectUrl: string
  githubUsername: string
  twitterUsername: string
}

type Props = {
  register: UseFormRegister<SubmitCreatorFormData>
  watch: UseFormWatch<SubmitCreatorFormData>
  control: Control<SubmitCreatorFormData>
  setError: UseFormSetError<SubmitCreatorFormData>
  clearErrors: UseFormClearErrors<SubmitCreatorFormData>
  errors: FieldErrors<SubmitCreatorFormData>
  setValue: UseFormSetValue<SubmitCreatorFormData>
}

export const SubmitCreatorForm = ({ register, errors, setValue, watch }: Props) => {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const {
    setData,
    appName,
    appDescription,
    adminWalletAddress,
    adminName,
    adminEmail,
    projectUrl,
    githubUsername,
    twitterUsername,
  } = useCreatorSubmissionFormStore()

  // Persist form data on re-render, redirect or page refresh
  useEffect(() => {
    const formFields = {
      appName,
      appDescription,
      adminWalletAddress,
      adminName,
      adminEmail,
      projectUrl,
      githubUsername,
      twitterUsername,
    }
    Object.entries(formFields).forEach(([key, value]) => {
      if (!watch(key as keyof SubmitCreatorFormData) && value) {
        setValue(key as keyof SubmitCreatorFormData, value)
      }
    })
  }, [
    appName,
    appDescription,
    adminWalletAddress,
    adminName,
    adminEmail,
    projectUrl,
    githubUsername,
    twitterUsername,
    setValue,
    watch,
  ])

  // Set linked social media usernames if available in session
  useEffect(() => {
    if (session?.user) {
      if (session.user.githubUsername) {
        setValue("githubUsername", session.user.githubUsername)
        setData({ githubUsername: session.user.githubUsername })
      }
      if (session.user.twitterUsername) {
        setValue("twitterUsername", session.user.twitterUsername)
        setData({ twitterUsername: session.user.twitterUsername })
      }
    }
    if (!session?.user?.githubUsername && !session?.user?.twitterUsername) {
      //Remove if no session
      setValue("githubUsername", "")
      setValue("twitterUsername", "")
    }
  }, [session?.user, setValue, setData])

  // Handle social media auth
  const handleAuth = (platform: "github" | "twitter") => {
    const usernameField = platform === "github" ? "githubUsername" : "twitterUsername"
    const isSignedIn = !!watch(usernameField as keyof SubmitCreatorFormData)
    if (isSignedIn) {
      signOut({ redirect: false })
      setValue(usernameField as keyof SubmitCreatorFormData, "")
    } else {
      signIn(platform)
    }
  }

  // Store form data on blur
  const onBlur = (field: keyof SubmitCreatorFormData) => {
    const value = watch(field)
    if (value) {
      setData({ [field]: value })
    }
  }

  return (
    <Card>
      <CardHeader>
        <Heading size="lg">{t("Your App Creator Info")}</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={8} w="full">
          <FormControl isInvalid={!!errors.githubUsername}>
            <FormLabel>{t("GitHub Username")}</FormLabel>
            <Button
              colorScheme={watch("githubUsername") ? "blackAlpha" : "blue"}
              onClick={() => handleAuth("github")}
              size="lg"
              alignSelf="flex-end"
              borderRadius="full">
              {watch("githubUsername") || "Link Github"}
            </Button>
            <Input type="hidden" {...register("githubUsername", { required: "GitHub Username is required" })} />
            <FormErrorMessage>{errors.githubUsername?.message}</FormErrorMessage>
          </FormControl>

          {/* <FormControl isInvalid={!!errors.twitterUsername}>
            <FormLabel>{t("X Username")}</FormLabel>
            <Button
              colorScheme={watch("twitterUsername") ? "blackAlpha" : "blue"}
              onClick={() => handleAuth("twitter")}
              size="lg"
              alignSelf="flex-end"
              borderRadius="full">
              {watch("twitterUsername") || "Link X"}
            </Button>
            <Input type="hidden" {...register("twitterUsername", { required: "X Username is required" })} />

            <FormErrorMessage>{errors.twitterUsername?.message}</FormErrorMessage>
          </FormControl> */}

          <FormControl isInvalid={!!errors.appName}>
            <FormLabel>{t("App Name")}</FormLabel>
            <Input
              rounded={"xl"}
              {...register("appName", { required: "App Name is required" })}
              onBlur={() => onBlur("appName")}
            />
            {errors.appName && <FormErrorMessage>{errors.appName.message}</FormErrorMessage>}
          </FormControl>

          <FormControl isInvalid={!!errors.appDescription}>
            <FormLabel>{t("App Description")}</FormLabel>
            <Textarea
              rounded={"xl"}
              {...register("appDescription", {
                required: "App Description is required",
                min: { value: 100, message: "App Description is too short" },
              })}
              onBlur={() => onBlur("appDescription")}
            />
            {errors.appDescription && <FormErrorMessage>{errors.appDescription.message}</FormErrorMessage>}
          </FormControl>

          <FormControl isInvalid={!!errors.projectUrl}>
            <FormLabel>{t("Project URL")}</FormLabel>
            <Input
              rounded={"xl"}
              {...register("projectUrl", {
                required: t("Project URL is required"),
                validate: value => {
                  try {
                    new URL(value)
                    return true
                  } catch {
                    return t("Invalid url")
                  }
                },
              })}
              onBlur={() => onBlur("projectUrl")}
            />
            {errors.projectUrl && <FormErrorMessage>{errors.projectUrl.message}</FormErrorMessage>}
          </FormControl>

          <FormControl isInvalid={!!errors.adminName}>
            <FormLabel>{t("Admin Name (optional)")}</FormLabel>
            <Input rounded={"xl"} {...register("adminName")} onBlur={() => onBlur("adminName")} />
            {errors.adminName && <FormErrorMessage>{errors.adminName.message}</FormErrorMessage>}
          </FormControl>

          <FormControl isInvalid={!!errors.adminEmail}>
            <FormLabel>{t("Admin Email")}</FormLabel>
            <Input
              rounded={"xl"}
              {...register("adminEmail", {
                required: t("Admin Email is required"),
                validate: value => {
                  const re = /\S+@\S+\.\S+/
                  return re.test(value) || t("Please enter a valid email")
                },
              })}
              onBlur={() => onBlur("adminEmail")}
            />
            {errors.adminEmail && <FormErrorMessage>{errors.adminEmail.message}</FormErrorMessage>}
          </FormControl>

          <FormControl isInvalid={!!errors.adminWalletAddress}>
            <FormLabel>{t("Admin Wallet Address")}</FormLabel>
            <Input
              rounded={"xl"}
              {...register("adminWalletAddress", {
                required: t("Account address is required"),
                validate: value => isValid(value) || t("Please enter a valid wallet address"),
              })}
              onBlur={() => onBlur("adminWalletAddress")}
            />
            {errors.adminWalletAddress && <FormErrorMessage>{errors.adminWalletAddress.message}</FormErrorMessage>}
          </FormControl>
        </VStack>
      </CardBody>
      <CardFooter display={"flex"} flexDir={"column"} w="full" alignItems="center" justify="center">
        <Button
          variant="primaryAction"
          disabled={!!errors}
          type="submit"
          w="full"
          px={10}
          maxW={["50%", "30%"]}
          size="lg"
          borderRadius={"full"}>
          {t("Send Application")}
        </Button>
      </CardFooter>
    </Card>
  )
}
