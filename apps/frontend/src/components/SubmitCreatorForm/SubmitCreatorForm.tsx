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
import { UilGithub } from "@iconscout/react-unicons"
import { FaXTwitter } from "react-icons/fa6"
import { AddressUtils } from "@/utils"
import { WalletAddressInput } from "@/app/components/Input"

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
        <Heading size="md">{t("Your App Creator Info")}</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} w="full">
          <FormControl isInvalid={!!errors.githubUsername}>
            <FormLabel>{t("GitHub Username")}</FormLabel>
            <Button
              backgroundColor={"black"}
              color={"white"}
              onClick={() => handleAuth("github")}
              size="lg"
              alignSelf="flex-end"
              borderRadius="full"
              leftIcon={<UilGithub size={30} />}>
              {watch("githubUsername") || t("Connect GitHub")}
            </Button>
            <Input type="hidden" {...register("githubUsername", { required: "GitHub Username is required" })} />
            <FormErrorMessage>{errors.githubUsername?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.twitterUsername}>
            <FormLabel>{t("X Username")}</FormLabel>
            <Button
              backgroundColor={"black"}
              color={"white"}
              onClick={() => handleAuth("twitter")}
              size="lg"
              alignSelf="flex-end"
              borderRadius="full"
              leftIcon={<FaXTwitter />}>
              {watch("twitterUsername") || t("Connect X")}
            </Button>
            <Input type="hidden" {...register("twitterUsername", { required: "X Username is required" })} />
            <FormErrorMessage>{errors.twitterUsername?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.appName}>
            <FormLabel>{t("App Name")}</FormLabel>
            <Input
              rounded={"xl"}
              placeholder={t("App Name")}
              {...register("appName", {
                required: "App Name is required",
                minLength: { value: 2, message: t("{{fieldName}} is too short", { fieldName: t("App Name") }) },
                maxLength: { value: 30, message: t("{{fieldName}} is too long", { fieldName: t("App Name") }) },
                validate: value => {
                  if (value && AddressUtils.isValid(value)) {
                    //Prevent user from entering wallet address in app name field
                    return t("Invalid Name")
                  }
                  return true
                },
              })}
              onBlur={() => onBlur("appName")}
            />
            {errors.appName && <FormErrorMessage>{errors.appName.message}</FormErrorMessage>}
          </FormControl>

          <FormControl isInvalid={!!errors.appDescription}>
            <FormLabel>{t("App Description")}</FormLabel>
            <Textarea
              rounded={"xl"}
              placeholder={t("App Description")}
              {...register("appDescription", {
                required: "App Description is required",
                minLength: {
                  value: 100,
                  message: t("{{fieldName}} is too short", { fieldName: t("App Description") }),
                },
                maxLength: {
                  value: 1000,
                  message: t("{{fieldName}} is too long", { fieldName: t("App Description") }),
                },
              })}
              onBlur={() => onBlur("appDescription")}
            />
            {errors.appDescription && <FormErrorMessage>{errors.appDescription.message}</FormErrorMessage>}
          </FormControl>

          <FormControl isInvalid={!!errors.projectUrl}>
            <FormLabel>{t("Project URL")}</FormLabel>
            <Input
              placeholder={t("Project URL")}
              rounded={"xl"}
              {...register("projectUrl", {
                required: t("Project URL is required"),
                maxLength: { value: 255, message: t("{{fieldName}} is too long", { fieldName: t("Project URL") }) },
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
            <FormLabel>{t("Name (optional)")}</FormLabel>
            <Input
              rounded={"xl"}
              placeholder={t("Your Name")}
              {...register("adminName", {
                maxLength: { value: 100, message: t("{{fieldName}} is too long", { fieldName: t("Name") }) },
                validate: (value: string) => {
                  if (value && AddressUtils.isValid(value)) {
                    // Prevent user from entering wallet address in admin name field
                    return t("Invalid Name")
                  }
                  return true
                },
              })}
              onBlur={() => onBlur("adminName")}
            />
            {errors.adminName && <FormErrorMessage>{errors.adminName.message}</FormErrorMessage>}
          </FormControl>

          <FormControl isInvalid={!!errors.adminEmail}>
            <FormLabel>{t("Email")}</FormLabel>
            <Input
              placeholder={t("Email")}
              rounded={"xl"}
              {...register("adminEmail", {
                required: t("Admin Email is required"),
                maxLength: { value: 255, message: t("{{fieldName}} is too long", { fieldName: t("Email") }) },
                validate: value => {
                  const emailRegex = new RegExp(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)
                  return emailRegex.test(value) || t("Please enter a valid email")
                },
              })}
              onBlur={() => onBlur("adminEmail")}
            />
            {errors.adminEmail && <FormErrorMessage>{errors.adminEmail.message}</FormErrorMessage>}
          </FormControl>

          <FormControl isInvalid={!!errors.adminWalletAddress}>
            <FormLabel>{t("Wallet Address")}</FormLabel>
            <WalletAddressInput
              onAddressResolved={address => {
                setValue("adminWalletAddress", address ?? "")
                onBlur("adminWalletAddress")
              }}
              rounded={"xl"}
              onBlur={() => onBlur("adminWalletAddress")}
            />
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
          maxW={{
            base: "100%",
            sm: "80%",
            md: "30%",
          }}
          size="lg"
          borderRadius={"full"}>
          {t("Send Application")}
        </Button>
      </CardFooter>
    </Card>
  )
}
