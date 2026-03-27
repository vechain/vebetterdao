import { Button, Card, Field, Heading, Input, Text, VStack } from "@chakra-ui/react"
import { UilGithub } from "@iconscout/react-unicons"
import { signIn, signOut, useSession } from "next-auth/react"
import { useEffect } from "react"
import {
  Control,
  FieldErrors,
  UseFormClearErrors,
  UseFormRegister,
  UseFormReset,
  UseFormSetError,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form"
import { useTranslation } from "react-i18next"

import { WalletAddressInput } from "../../app/components/Input/WalletAddressInput"
import { useCreatorSubmissionFormStore } from "../../store/useCreatorSubmissionFormStore"
import { FormCheckbox } from "../CustomFormFields/FormCheckbox"
import { FormItem } from "../CustomFormFields/FormItem"
import { genericValidation, patternUrlCheck, validateAppId, validateEmail } from "../CustomFormFields/validators"
export type SubmitCreatorFormData = {
  appName: string
  appDescription: string
  adminName: string
  adminWalletAddress: string
  adminEmail: string
  projectUrl: string
  githubUsername: string
  distributionStrategy: string
  testnetProjectUrl: string
  testnetAppId: string
  securityApiSecurityMeasures: boolean
  securityActionVerification: boolean
  securityDeviceFingerprint: boolean
  securitySecureKeyManagement: boolean
  securityAntiFarming: boolean
}
type Props = {
  register: UseFormRegister<SubmitCreatorFormData>
  watch: UseFormWatch<SubmitCreatorFormData>
  control: Control<SubmitCreatorFormData, any>
  setError: UseFormSetError<SubmitCreatorFormData>
  clearErrors: UseFormClearErrors<SubmitCreatorFormData>
  errors: FieldErrors<SubmitCreatorFormData>
  setValue: UseFormSetValue<SubmitCreatorFormData>
  resetForm: UseFormReset<SubmitCreatorFormData>
  clearData: () => void
}

export const SubmitCreatorForm = ({ register, errors, setValue, watch, control, resetForm, clearData }: Props) => {
  const { t } = useTranslation()
  const { data: session } = useSession()

  const checkboxList = [
    {
      label: t("API Security Measures (Optional)"),
      description: t("Implements certificate-based authentication, CAPTCHA, CORS, and rate limiting."),
      name: "securityApiSecurityMeasures",
      required: false,
    },
    {
      label: t("Action Verification"),
      description: t("Uses AI validation or unique identifiers to verify sustainable actions."),
      name: "securityActionVerification",
      required: true,
    },
    {
      label: t("Device Fingerprinting (Optional)"),
      description: t("Implements device identification to prevent multiple installations."),
      name: "securityDeviceFingerprint",
      required: false,
    },
    {
      label: t("Secure Key Management (Optional)"),
      description: t("Ensures secure storage and handling of private keys and sensitive data."),
      name: "securitySecureKeyManagement",
      required: false,
    },
    {
      label: t("Anti-Farming Measures (Optional)"),
      description: t("Implements progressive unlocking, reward scaling, or other anti-farming strategies."),
      name: "securityAntiFarming",
      required: false,
    },
  ] as const

  const {
    setData,
    appName,
    appDescription,
    adminWalletAddress,
    adminName,
    adminEmail,
    projectUrl,
    githubUsername,
    distributionStrategy,
    testnetProjectUrl,
    testnetAppId,
    securityActionVerification,
    securityApiSecurityMeasures,
    securityDeviceFingerprint,
    securitySecureKeyManagement,
    securityAntiFarming,
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
      distributionStrategy,
      testnetProjectUrl,
      testnetAppId,
      securityActionVerification,
      securityApiSecurityMeasures,
      securityDeviceFingerprint,
      securitySecureKeyManagement,
      securityAntiFarming,
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
    distributionStrategy,
    testnetProjectUrl,
    testnetAppId,
    setValue,
    watch,
    securityActionVerification,
    securityApiSecurityMeasures,
    securityDeviceFingerprint,
    securitySecureKeyManagement,
    securityAntiFarming,
  ])

  // Set linked social media usernames if available in session
  useEffect(() => {
    if (session?.user?.githubUsername) {
      setValue("githubUsername", session.user.githubUsername)
      setData({ githubUsername: session.user.githubUsername })
    }
  }, [session?.user, setValue, setData])

  // Handle social media auth
  const handleAuth = (platform: "github") => {
    const isSignedIn = !!watch("githubUsername")
    if (isSignedIn) {
      signOut({ redirect: false })
      setValue("githubUsername", "")
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
  const handleResetForm = () => {
    signOut({ redirect: false })
    resetForm()
    clearData()
  }

  return (
    <Card.Root w="full" borderRadius="xl" p={0}>
      <Card.Body w="full" p={{ base: 2, md: 6 }}>
        <VStack gap={4} w="full">
          <Card.Root w="full" alignItems="start" borderRadius="xl" borderColor="gray.200" p={4}>
            <Heading size="xl" pb={6}>
              {t("App Information")}
            </Heading>
            <VStack w="full" gap={4} align="stretch" px={1}>
              <FormItem
                label={t("App Name")}
                placeholder={t("App Name")}
                description={t("The name of your app.")}
                register={{
                  ...register("appName", {
                    required: "App Name is required",
                    minLength: { value: 2, message: t("{{fieldName}} is too short", { fieldName: t("App Name") }) },
                    maxLength: { value: 30, message: t("{{fieldName}} is too long", { fieldName: t("App Name") }) },
                    validate: value => genericValidation(value, t("App Name")),
                  }),
                }}
                error={errors.appName?.message}
                onBlur={() => onBlur("appName")}
              />

              <FormItem
                label={t("App Description")}
                placeholder={t("App Description")}
                description={t("The description and purpose of your app.")}
                type="textarea"
                register={{
                  ...register("appDescription", {
                    required: "App Description is required",
                    minLength: {
                      value: 100,
                      message: t("{{fieldName}} is too short", { fieldName: t("App Description") }),
                    },
                    maxLength: {
                      value: 1000,
                      message: t("{{fieldName}} is too long", { fieldName: t("App Description") }),
                    },
                  }),
                }}
                error={errors.appDescription?.message}
                onBlur={() => onBlur("appDescription")}
              />

              <FormItem
                label={t("How does your app distribute B3TR to the users?")}
                placeholder={t("Distribution Strategy")}
                description={t(
                  "Describe how your app distributes rewards. This information will be publicly visible once your app is submitted to VeBetter.",
                )}
                type="textarea"
                register={{
                  ...register("distributionStrategy", {
                    required: "Distribution Strategy is required",
                    minLength: {
                      value: 100,
                      message: t("{{fieldName}} is too short", { fieldName: t("Distribution Strategy") }),
                    },
                    maxLength: {
                      value: 1000,
                      message: t("{{fieldName}} is too long", { fieldName: t("Distribution Strategy") }),
                    },
                  }),
                }}
                onBlur={() => onBlur("distributionStrategy")}
                error={errors.distributionStrategy?.message}
              />

              <FormItem
                label={t("Project URL")}
                placeholder={t("Project URL")}
                description={t("The URL of your app's website or repository.")}
                register={{
                  ...register("projectUrl", {
                    required: "Project URL is required",
                    maxLength: {
                      value: 255,
                      message: t("{{fieldName}} is too long", { fieldName: t("Project URL") }),
                    },
                    pattern: patternUrlCheck,
                  }),
                }}
                error={errors.projectUrl?.message}
                onBlur={() => onBlur("projectUrl")}
              />
              <Field.Root invalid={!!errors.adminWalletAddress}>
                <Field.Label>{t("Creator NFT Wallet Address")}</Field.Label>
                <Text textStyle="xs" color="gray.500" mb={2}>
                  {t("The wallet address where you will receive your Creator NFT")}
                </Text>
                <WalletAddressInput
                  onAddressResolved={address => {
                    setValue("adminWalletAddress", address ?? "")
                    onBlur("adminWalletAddress")
                  }}
                  rounded={"xl"}
                  onBlur={() => onBlur("adminWalletAddress")}
                />
              </Field.Root>
            </VStack>
          </Card.Root>
          <Card.Root w="full" alignItems="start" borderRadius="xl" borderColor="gray.200" p={4}>
            <Heading size="xl" pb={6}>
              {t("Your Information")}
            </Heading>
            <VStack w="full" gap={4} align="stretch" px={1}>
              <Field.Root invalid={!!errors.githubUsername}>
                <Field.Label textStyle="md">{t("GitHub Username")}</Field.Label>
                <Button
                  backgroundColor={"black"}
                  color={"white"}
                  onClick={() => handleAuth("github")}
                  size="xl"
                  borderRadius="full">
                  <UilGithub size={30} />
                  {watch("githubUsername") || t("Connect GitHub")}
                </Button>
                <Input type="hidden" {...register("githubUsername", { required: "GitHub Username is required" })} />
                <Field.ErrorText>{errors.githubUsername?.message}</Field.ErrorText>
              </Field.Root>

              <FormItem
                label={t("Email")}
                placeholder={"Eg. admin@myapp.vet"}
                description={t("The email address that will be used for communication with VeBetter.")}
                type="email"
                register={{
                  ...register("adminEmail", {
                    required: "Admin Email is required",
                    maxLength: { value: 255, message: t("{{fieldName}} is too long", { fieldName: t("Email") }) },
                    validate: value => validateEmail(value, t("Email")),
                  }),
                }}
                error={errors.adminEmail?.message}
                onBlur={() => onBlur("adminEmail")}
              />

              <FormItem
                label={t("Name")}
                placeholder={"Eg. John Doe"}
                description={t("Your name or the name of the person responsible for the app.")}
                register={{
                  ...register("adminName", {
                    maxLength: { value: 100, message: t("{{fieldName}} is too long", { fieldName: t("Name") }) },
                    validate: (value: string) => genericValidation(value, t("Name")),
                  }),
                }}
                error={errors.adminName?.message}
                onBlur={() => onBlur("adminName")}
              />
            </VStack>
          </Card.Root>

          <Card.Root w="full" alignItems="start" borderRadius="xl" borderColor="gray.200" p={4}>
            <Heading size="xl" pb={4}>
              {t("Testing Requirements")}
            </Heading>
            <VStack w="full" gap={4} align="stretch" px={1}>
              <FormItem
                label={t("Testnet Project URL")}
                placeholder={"Eg. https://www.testnet.myapp.vet"}
                description={t("The URL of your testnet project.")}
                register={{
                  ...register("testnetProjectUrl", {
                    required: "Testnet Project URL is required",
                    maxLength: {
                      value: 255,
                      message: t("{{fieldName}} is too long", { fieldName: t("Testnet Project URL") }),
                    },
                    pattern: patternUrlCheck,
                  }),
                }}
                error={errors.testnetProjectUrl?.message}
                onBlur={() => onBlur("testnetProjectUrl")}
              />

              <FormItem
                label={t("Testnet App ID")}
                placeholder={"Eg. 0x1234567890abcdef"}
                description={t("The ID of your app on the testnet.")}
                register={{
                  ...register("testnetAppId", {
                    required: "Testnet App ID is required",
                    maxLength: {
                      value: 100,
                      message: t("{{fieldName}} is too long", { fieldName: t("Testnet App ID") }),
                    },
                    validate: (value: string) => validateAppId(value, t("Testnet App ID")),
                  }),
                }}
                error={errors.testnetAppId?.message}
                onBlur={() => onBlur("testnetAppId")}
              />
            </VStack>
          </Card.Root>
          <Card.Root w="full" borderRadius="xl" borderColor="gray.200" p={4}>
            <Heading size="xl" pb={4}>
              {t("Security Requirements")}
            </Heading>
            <VStack align="start" gap={3} px={1}>
              {checkboxList.map(checkbox => (
                <FormCheckbox
                  key={checkbox.name}
                  name={checkbox.name}
                  label={checkbox.label}
                  description={checkbox.description}
                  control={control}
                  {...(checkbox.required && { rules: { required: "This is a required security measure" } })}
                  error={errors[checkbox.name]?.message}
                />
              ))}
            </VStack>
          </Card.Root>
        </VStack>
      </Card.Body>
      <Card.Footer display={"flex"} flexDir={"row"} w="full" alignItems="center" justifyContent="center" py={5}>
        <Button type="button" onClick={handleResetForm} variant="link" size="lg">
          {t("Reset Form")}
        </Button>
        <Button
          variant="primary"
          disabled={Object.keys(errors).length > 0}
          type="submit"
          size="lg"
          borderRadius={"full"}>
          {t("Send Application")}
        </Button>
      </Card.Footer>
    </Card.Root>
  )
}
