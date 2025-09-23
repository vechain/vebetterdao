import { FormSocialConnectButton, validateWalletAddress } from "@/components/CustomFormFields"
import { FormItem } from "@/components/CustomFormFields/FormItem"
import { AttachmentFile, GrantFormData } from "@/hooks/proposals/grants/types"
import { uploadBlobToIPFS } from "@/utils/ipfs"
import { Accordion, Box, Field, FileUpload, Grid, GridItem, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { UilGithub } from "@iconscout/react-unicons"
import { signIn, signOut, useSession } from "next-auth/react"
import { useCallback, useEffect } from "react"
import {
  FieldErrors,
  UseFormClearErrors,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetError,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form"
import { useTranslation } from "react-i18next"
import { AiOutlineDiscord } from "react-icons/ai"
import { FaXTwitter } from "react-icons/fa6"
import { LuMail, LuUpload } from "react-icons/lu"
import { PiLinkSimple } from "react-icons/pi"
import { RiTelegram2Line } from "react-icons/ri"

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]

interface AboutGrantProps {
  register: UseFormRegister<GrantFormData>
  errors: FieldErrors<GrantFormData>
  setValue: UseFormSetValue<GrantFormData>
  watch: UseFormWatch<GrantFormData>
  getValues: UseFormGetValues<GrantFormData>
  setData: (data: Partial<GrantFormData>) => void
  clearErrors: UseFormClearErrors<GrantFormData>
  setError: UseFormSetError<GrantFormData>
}
export const AboutGrant = ({
  register,
  setData,
  setValue,
  watch,
  getValues,
  errors,
  clearErrors,
  setError,
}: AboutGrantProps) => {
  const { t } = useTranslation()
  const { data: session } = useSession()

  // Custom validation function to ensure at least one social account is connected
  const validateAtLeastOneSocial = (_value: string): string | boolean => {
    const twitterUsername = watch("twitterUsername")
    const githubUsername = watch("githubUsername")
    const discordUsername = watch("discordUsername")

    if (!twitterUsername && !githubUsername && !discordUsername) {
      return t("Please, connect minimum one account of your company or project or your personal one.")
    }
    return true
  }

  // Set linked social media usernames if available in session
  useEffect(() => {
    if (session?.user?.githubUsername || session?.user?.twitterUsername || session?.user?.discordUsername) {
      if (session.user.githubUsername) {
        setValue("githubUsername", session.user.githubUsername)
        setData({ githubUsername: session.user.githubUsername })
      }
      if (session.user.twitterUsername) {
        setValue("twitterUsername", session.user.twitterUsername)
        setData({ twitterUsername: session.user.twitterUsername })
      }
      if (session.user.discordUsername) {
        setValue("discordUsername", session.user.discordUsername)
        setData({ discordUsername: session.user.discordUsername })
      }
    }
  }, [session?.user, setValue, setData])

  // Store form data on blur
  const onBlur = (field: keyof GrantFormData) => {
    const value = getValues(field)
    if (value) {
      setData({ [field]: value })
    }
  }

  // Handle social media auth
  const handleAuth = (platform: "github" | "twitter" | "discord") => {
    const usernameField = platform.concat("Username")
    const isSignedIn = !!watch(usernameField as keyof GrantFormData)
    if (isSignedIn) {
      signOut({ redirect: false })
      setValue(usernameField as keyof GrantFormData, "")
    } else {
      signIn(platform)
    }
  }

  // Validate individual file (throws errors for manual validation)
  const validateFile = (file: File): void => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error(`${file.name}: File type not supported. Use PDF, JPG, JPEG, or PNG.`)
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`${file.name}: File too large. Maximum 20MB allowed.`)
    }
  }

  // Check if file is already uploaded
  const isFileDuplicate = (fileName: string, currentAttachments: AttachmentFile[]): boolean => {
    return currentAttachments.some((attachment: AttachmentFile) => attachment.name === fileName)
  }

  // Upload single file to IPFS
  const uploadSingleFile = async (file: File): Promise<AttachmentFile> => {
    try {
      const ipfsHash = await uploadBlobToIPFS(file, file.name)
      return {
        type: file.type,
        ipfs: ipfsHash,
        name: file.name,
      }
    } catch {
      throw new Error(`${file.name}: Upload to IPFS failed.`)
    }
  }
  //Handle file removal
  const onRemoveFile = useCallback(
    (file: File) => {
      const currentAttachments = getValues("outcomesAttachment") || []
      const updatedAttachments = currentAttachments.filter(attachment => attachment.name !== file.name)
      setValue("outcomesAttachment", updatedAttachments)
      setData({ outcomesAttachment: updatedAttachments })
    },
    [getValues, setValue, setData],
  )

  // Handle file uploads with validation and IPFS upload
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return
      clearErrors("outcomesAttachment")
      const currentAttachments = getValues("outcomesAttachment") || []
      const successfulUploads: AttachmentFile[] = []

      for (const file of acceptedFiles) {
        try {
          // Check for duplicates
          if (isFileDuplicate(file.name, currentAttachments)) {
            return
          }

          // Validate file
          validateFile(file)

          // Upload to IPFS
          const newAttachment = await uploadSingleFile(file)
          successfulUploads.push(newAttachment)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : `${file.name}: Unknown error occurred.`
          setError("outcomesAttachment", {
            type: "custom",
            message: errorMessage,
          })
          // Continue processing other files even if one fails
        }
      }

      // Update form with successful uploads
      if (successfulUploads.length > 0) {
        const updatedAttachments = [...currentAttachments, ...successfulUploads]
        setValue("outcomesAttachment", updatedAttachments)
        setData({ outcomesAttachment: updatedAttachments })
      }
    },
    [getValues, setValue, setData, clearErrors, setError],
  )

  const [twitterUsername, githubUsername, discordUsername] = [
    watch("twitterUsername"),
    watch("githubUsername"),
    watch("discordUsername"),
  ]

  return (
    <Grid templateColumns={{ base: "1fr", md: "1fr" }} w="full" gap={8}>
      <Accordion.Root multiple w="full" defaultValue={["company-details", "project-details", "outcomes"]} spaceY={4}>
        <Accordion.Item value="company-details" pb={5}>
          <Accordion.ItemTrigger>
            <Text fontSize="lg" fontWeight="semibold">
              {t("Company details")}
            </Text>
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <VStack gap={6} align="stretch" w="full">
              <Grid templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(2, 1fr)" }} gap={10}>
                <GridItem>
                  <FormItem
                    label={t("Name")}
                    placeholder={"Eg. Mugshot Inc"}
                    register={register("companyName", {
                      required: t("Please enter your company name"),
                    })}
                    error={errors.companyName?.message}
                    onBlur={() => onBlur("companyName")}
                  />
                </GridItem>
                <GridItem>
                  <FormItem
                    label={t("Registered number")}
                    placeholder={"Eg. 01234567"}
                    tooltip={t("Company VAT number e.g. 01234567")}
                    register={register("companyRegisteredNumber", {
                      required: t("Please enter your company registered number"),
                    })}
                    error={errors.companyRegisteredNumber?.message}
                    onBlur={() => onBlur("companyRegisteredNumber")}
                  />
                </GridItem>
                <GridItem colSpan={{ base: 1, md: 2 }}>
                  <FormItem
                    label={t("Intro")}
                    type="textarea"
                    isOptional
                    placeholder={t("Tell about your team and experience with similar projects")}
                    register={register("companyIntro")}
                    error={errors.companyIntro?.message}
                    onBlur={() => onBlur("companyIntro")}
                  />
                </GridItem>
                <GridItem colSpan={{ base: 1, md: 2 }}>
                  <FormItem
                    label={t("Receiver Address")}
                    type="text"
                    placeholder={"e.g. 0x1a2b3c..."}
                    register={register("grantsReceiverAddress", {
                      validate: value => validateWalletAddress(value, t("Receiver Address")),
                    })}
                    error={errors.grantsReceiverAddress?.message}
                    onBlur={() => onBlur("grantsReceiverAddress")}
                  />
                </GridItem>
                <GridItem>
                  <FormItem
                    label={t("Email")}
                    leftElement={<Icon as={LuMail} />}
                    isOptional
                    type="email"
                    placeholder={t("Enter the email of the company")}
                    register={register("companyEmail")}
                    error={errors.companyEmail?.message}
                    onBlur={() => onBlur("companyEmail")}
                  />
                </GridItem>
                <GridItem>
                  <FormItem
                    label={"Telegram"}
                    leftElement={<Icon as={RiTelegram2Line} />}
                    type="url"
                    placeholder={t("Enter link here")}
                    isOptional
                    register={register("companyTelegram", {
                      pattern: {
                        value: /^https?:\/\/.+/,
                        message: t("Please enter a valid URL starting with http:// or https://"),
                      },
                    })}
                    error={errors.companyTelegram?.message}
                    onBlur={() => onBlur("companyTelegram")}
                  />
                </GridItem>
              </Grid>
            </VStack>
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item value="project-details" pb={5}>
          <Accordion.ItemTrigger>
            <Text fontSize="lg" fontWeight="semibold">
              {t("Grant details")}
            </Text>
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={10}>
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <FormItem
                  label={t("Project name")}
                  placeholder="e.g. My Awesome Project"
                  register={register("projectName", {
                    required: t("Please enter your project name"),
                  })}
                  error={errors.projectName?.message}
                  onBlur={() => onBlur("projectName")}
                />
              </GridItem>

              <GridItem>
                <FormItem
                  label={t("Testnet/App URL")}
                  leftElement={<Icon as={PiLinkSimple} />}
                  placeholder="Enter link here"
                  isOptional
                  register={register("appTestnetUrl")}
                  error={errors.appTestnetUrl?.message}
                  onBlur={() => onBlur("appTestnetUrl")}
                />
              </GridItem>

              <GridItem>
                <FormItem
                  label={t("Website URL")}
                  leftElement={<Icon as={PiLinkSimple} />}
                  placeholder="Enter link here"
                  type="url"
                  isOptional
                  register={register("projectWebsite", {
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: t("Please enter a valid URL starting with http:// or https://"),
                    },
                  })}
                  error={errors.projectWebsite?.message}
                  onBlur={() => onBlur("projectWebsite")}
                />
              </GridItem>
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <VStack gap={6} align="stretch" w="full">
                  <VStack align="flex-start" gap={1}>
                    <Text fontSize="lg" fontWeight="semibold">
                      {t("Connect accounts")}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {t("Please, connect minimum one account of your company or project or your personal one.")}
                    </Text>
                  </VStack>

                  <Grid templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }} gap={6}>
                    <GridItem w="full">
                      <FormSocialConnectButton
                        label={twitterUsername ? twitterUsername : t("Connect X")}
                        register={register("twitterUsername", {
                          validate: validateAtLeastOneSocial,
                        })}
                        error={errors.twitterUsername?.message}
                        handleAuth={() => handleAuth("twitter")}
                        leftIcon={<FaXTwitter size={20} />}
                        value={twitterUsername}
                        onBlur={() => onBlur("twitterUsername")}
                      />
                    </GridItem>
                    <GridItem w="full">
                      <FormSocialConnectButton
                        label={githubUsername ? githubUsername : t("Connect GitHub")}
                        register={register("githubUsername", {
                          validate: validateAtLeastOneSocial,
                        })}
                        error={errors.githubUsername?.message}
                        handleAuth={() => handleAuth("github")}
                        leftIcon={<UilGithub size={20} />}
                        value={githubUsername}
                        onBlur={() => onBlur("githubUsername")}
                      />
                    </GridItem>
                    <GridItem w="full">
                      <FormSocialConnectButton
                        label={discordUsername ? discordUsername : t("Connect Discord")}
                        register={register("discordUsername", {
                          validate: validateAtLeastOneSocial,
                        })}
                        error={errors.discordUsername?.message}
                        handleAuth={() => handleAuth("discord")}
                        leftIcon={<AiOutlineDiscord size={20} />}
                        value={discordUsername}
                        onBlur={() => onBlur("discordUsername")}
                      />
                    </GridItem>
                  </Grid>
                </VStack>
              </GridItem>
              <GridItem>
                <FormItem
                  label={t("Problem")}
                  type="textarea"
                  placeholder="Describe the problem you are trying to solve"
                  register={register("problemDescription", {
                    required: t("Please describe the problem you are trying to solve"),
                  })}
                  error={errors.problemDescription?.message}
                  onBlur={() => onBlur("problemDescription")}
                />
              </GridItem>
              <GridItem>
                <FormItem
                  label={t("Solution")}
                  type="textarea"
                  placeholder={t("Describe solution you are trying to solve")}
                  register={register("solutionDescription", {
                    required: t("Please describe your solution"),
                  })}
                  error={errors.solutionDescription?.message}
                  onBlur={() => onBlur("solutionDescription")}
                />
              </GridItem>
              <GridItem>
                <FormItem
                  label={t("Target user")}
                  placeholder={t("Who are your target users")}
                  type="textarea"
                  register={register("targetUsers", {
                    required: t("Please describe your target users"),
                  })}
                  error={errors.targetUsers?.message}
                  onBlur={() => onBlur("targetUsers")}
                />
              </GridItem>
              <GridItem>
                <FormItem
                  label={t("Competitive edge / Differentiation factor")}
                  placeholder={t("Competitive edge / Differentiation factor")}
                  type="textarea"
                  register={register("competitiveEdge", {
                    required: t("Please describe your competitive edge"),
                  })}
                  error={errors.competitiveEdge?.message}
                  onBlur={() => onBlur("competitiveEdge")}
                />
              </GridItem>
            </Grid>
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item value="outcomes" pb={5}>
          <Accordion.ItemTrigger>
            <Text fontSize="lg" fontWeight="semibold">
              {t("Outcomes")}
            </Text>
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <VStack gap={6} align="stretch" w="full">
              <Grid templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(2, 1fr)" }} gap={10}>
                <GridItem>
                  <FormItem
                    label={t("Benefits to users")}
                    placeholder={t("Benefits to users")}
                    type="textarea"
                    register={register("benefitsToUsers", {
                      required: t("Please describe benefits to users"),
                    })}
                    error={errors.benefitsToUsers?.message}
                    onBlur={() => onBlur("benefitsToUsers")}
                  />
                </GridItem>
                <GridItem>
                  <FormItem
                    label={t("Benefits to dApps")}
                    placeholder={t("Benefits to dApps")}
                    type="textarea"
                    register={register("benefitsToDApps", {
                      required: t("Please describe benefits to dApps"),
                    })}
                    error={errors.benefitsToDApps?.message}
                    onBlur={() => onBlur("benefitsToDApps")}
                  />
                </GridItem>
                <GridItem>
                  <FormItem
                    label={t("Benefits to VeChain ecosystem")}
                    placeholder={t("Benefits to VeChain ecosystem")}
                    type="textarea"
                    register={register("benefitsToVeChainEcosystem", {
                      required: t("Please describe benefits to VeChain ecosystem"),
                    })}
                    error={errors.benefitsToVeChainEcosystem?.message}
                    onBlur={() => onBlur("benefitsToVeChainEcosystem")}
                  />
                </GridItem>
                <GridItem>
                  <FormItem
                    label={t("X2E model")}
                    placeholder={t("X2E model")}
                    tooltip={t(
                      "X2Earn is VeBetterDAO’s framework for apps that reward sustainable actions with B3TR. The “X” can be any activity (e.g., Plant-2-Earn, Sweat-2-Earn).",
                    )}
                    type="textarea"
                    register={register("x2EModel", {
                      required: t("Please describe X2E model"),
                    })}
                    error={errors.x2EModel?.message}
                    onBlur={() => onBlur("x2EModel")}
                  />
                </GridItem>
                <GridItem>
                  <FormItem
                    label={t("Revenue model")}
                    placeholder={t("Describe your revenue model")}
                    type="textarea"
                    isOptional
                    register={register("revenueModel")}
                    error={errors.revenueModel?.message}
                    onBlur={() => onBlur("revenueModel")}
                  />
                </GridItem>
                <GridItem>
                  <FormItem
                    label={t("High level roadmap")}
                    placeholder={t("Describe your high level roadmap or add attachment below")}
                    type="textarea"
                    isOptional
                    register={register("highLevelRoadmap")}
                    error={errors.highLevelRoadmap?.message}
                    onBlur={() => onBlur("highLevelRoadmap")}
                  />
                </GridItem>

                <GridItem colSpan={{ base: 1, md: 2 }}>
                  <Field.Root invalid={!!errors.outcomesAttachment?.message}>
                    <HStack justify="space-between" w="full">
                      <Field.Label fontSize="sm" fontWeight="medium">
                        {t("Attachments")}
                      </Field.Label>
                      <Text fontSize="sm" fontWeight="medium" color="text.subtle">
                        {"Optional"}
                      </Text>
                    </HStack>
                    <FileUpload.Root
                      w="full"
                      alignItems="stretch"
                      maxFiles={3}
                      accept={ALLOWED_FILE_TYPES}
                      maxFileSize={MAX_FILE_SIZE}
                      onFileAccept={({ files }) => onDrop(files)}>
                      <FileUpload.HiddenInput />
                      <FileUpload.Dropzone>
                        <FileUpload.DropzoneContent>
                          <HStack>
                            <Icon as={LuUpload} size="md" color="fg.muted" />
                            <Box>{t("Upload file")}</Box>
                          </HStack>
                          <Box color="fg.muted">{t("PDF, JPG, JPEG, PNG, less than 20MB")}</Box>
                        </FileUpload.DropzoneContent>
                      </FileUpload.Dropzone>
                      <FileUpload.ItemGroup>
                        <FileUpload.Context>
                          {({ acceptedFiles }) =>
                            acceptedFiles.map(file => (
                              <FileUpload.Item key={file.name} file={file}>
                                <FileUpload.ItemPreview />
                                <FileUpload.ItemName />
                                <FileUpload.ItemSizeText />
                                <FileUpload.ItemDeleteTrigger onClick={() => onRemoveFile(file)} />
                              </FileUpload.Item>
                            ))
                          }
                        </FileUpload.Context>
                      </FileUpload.ItemGroup>
                    </FileUpload.Root>
                    {errors.outcomesAttachment?.message && (
                      <Field.ErrorText>{errors.outcomesAttachment?.message}</Field.ErrorText>
                    )}
                  </Field.Root>
                </GridItem>
              </Grid>
            </VStack>
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>
    </Grid>
  )
}
