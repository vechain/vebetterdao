import { VStack, Text, Grid, GridItem, Accordion, Field, FileUpload, Icon, Box, HStack } from "@chakra-ui/react"
import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FormItem } from "@/components/CustomFormFields/FormItem"
import { type GrantFormData } from "@/hooks/proposals/grants/types"
import { UilGithub } from "@iconscout/react-unicons"
import { FaXTwitter } from "react-icons/fa6"
import { AiOutlineDiscord } from "react-icons/ai"
import { FormSocialConnectButton } from "@/components/CustomFormFields"
import { LuUpload } from "react-icons/lu"

interface AboutGrantProps {
  register: UseFormRegister<GrantFormData>
  errors: FieldErrors<GrantFormData>
  setValue: UseFormSetValue<GrantFormData>
  watch: UseFormWatch<GrantFormData>
}

export const AboutGrant = ({ register, setValue, watch, errors }: AboutGrantProps) => {
  const { t } = useTranslation()

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

  // Handle social media auth
  const handleAuth = (platform: "github" | "twitter" | "discord") => {
    const usernameField = {
      github: "githubUsername",
      twitter: "twitterUsername",
      discord: "discordUsername",
    }[platform]

    setValue(usernameField as keyof GrantFormData, `testSignedIn-${platform}`)
  }

  return (
    <Grid templateColumns={{ base: "1fr", md: "1fr" }} w="full" gap={8}>
      <Accordion.Root multiple w="full" defaultValue={["company-details", "project-details", "outcomes"]} spaceY={4}>
        <Accordion.Item value="company-details" spaceY={2}>
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
                  />
                </GridItem>
                <GridItem>
                  <FormItem
                    label={t("Registered number")}
                    placeholder={"Eg. 01234567"}
                    register={register("companyRegisteredNumber", {
                      required: t("Please enter your company registered number"),
                    })}
                    error={errors.companyRegisteredNumber?.message}
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
                  />
                </GridItem>
                <GridItem colSpan={{ base: 1, md: 2 }}>
                  <FormItem
                    label={t("Receiver Address")}
                    placeholder={"e.g. 0x1234567890123456789012345678901234567890"}
                    register={register("grantsReceiverAddress", {
                      required: t("Please enter the receiver address"),
                    })}
                    error={errors.grantsReceiverAddress?.message}
                  />
                </GridItem>
                <GridItem>
                  <FormItem
                    label={t("Email")}
                    isOptional
                    placeholder={t("Enter the email of the company")}
                    register={register("companyEmail")}
                    error={errors.companyEmail?.message}
                  />
                </GridItem>
                <GridItem>
                  <FormItem
                    label={"Telegram"}
                    placeholder={t("Enter link here")}
                    isOptional
                    register={register("companyTelegram", {
                      pattern: {
                        value: /^https?:\/\/.+/,
                        message: t("Please enter a valid URL starting with http:// or https://"),
                      },
                    })}
                    error={errors.companyTelegram?.message}
                  />
                </GridItem>
              </Grid>
            </VStack>
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item value="project-details" spaceY={2}>
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
                />
              </GridItem>

              <GridItem>
                <FormItem
                  label={t("Testnet/App URL")}
                  placeholder="Enter link here"
                  isOptional
                  register={register("appTestnetUrl")}
                  error={errors.appTestnetUrl?.message}
                />
              </GridItem>

              <GridItem>
                <FormItem
                  label={t("Website URL")}
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
                        label={t("Connect X")}
                        register={register("twitterUsername", {
                          validate: validateAtLeastOneSocial,
                        })}
                        error={errors.twitterUsername?.message}
                        handleAuth={() => handleAuth("twitter")}
                        leftIcon={<FaXTwitter size={20} />}
                        value={watch("twitterUsername")}
                      />
                    </GridItem>
                    <GridItem w="full">
                      <FormSocialConnectButton
                        label={t("Connect GitHub")}
                        register={register("githubUsername", {
                          validate: validateAtLeastOneSocial,
                        })}
                        error={errors.githubUsername?.message}
                        handleAuth={() => handleAuth("github")}
                        leftIcon={<UilGithub size={20} />}
                        value={watch("githubUsername")}
                      />
                    </GridItem>
                    <GridItem w="full">
                      <FormSocialConnectButton
                        label={t("Connect Discord")}
                        register={register("discordUsername", {
                          validate: validateAtLeastOneSocial,
                        })}
                        error={errors.discordUsername?.message}
                        handleAuth={() => handleAuth("discord")}
                        leftIcon={<AiOutlineDiscord size={20} />}
                        value={watch("discordUsername")}
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
                />
              </GridItem>
              <GridItem>
                <FormItem
                  label={t("Target user")}
                  placeholder={t("Who are your target users")}
                  register={register("targetUsers", {
                    required: t("Please describe your target users"),
                  })}
                  error={errors.targetUsers?.message}
                />
              </GridItem>
              <GridItem>
                <FormItem
                  label={t("Competitive edge / Differentiation factor")}
                  placeholder={t("Competitive edge / Differentiation factor")}
                  register={register("competitiveEdge", {
                    required: t("Please describe your competitive edge"),
                  })}
                  error={errors.competitiveEdge?.message}
                />
              </GridItem>
            </Grid>
          </Accordion.ItemContent>
        </Accordion.Item>
        <Accordion.Item value="outcomes" spaceY={2}>
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
                    register={register("benefitsToUsers", {
                      required: t("Please describe benefits to users"),
                    })}
                    error={errors.benefitsToUsers?.message}
                  />
                </GridItem>
                <GridItem>
                  <FormItem
                    label={t("Benefits to dApps")}
                    placeholder={t("Benefits to dApps")}
                    register={register("benefitsToDApps", {
                      required: t("Please describe benefits to dApps"),
                    })}
                    error={errors.benefitsToDApps?.message}
                  />
                </GridItem>
                <GridItem>
                  <FormItem
                    label={t("Benefits to VeChain ecosystem")}
                    placeholder={t("Benefits to VeChain ecosystem")}
                    register={register("benefitsToVeChainEcosystem", {
                      required: t("Please describe benefits to VeChain ecosystem"),
                    })}
                    error={errors.benefitsToVeChainEcosystem?.message}
                  />
                </GridItem>
                <GridItem>
                  <FormItem
                    label={t("X2E model")}
                    placeholder={t("X2E model")}
                    register={register("x2EModel", {
                      required: t("Please describe X2E model"),
                    })}
                    error={errors.x2EModel?.message}
                  />
                </GridItem>
                <GridItem>
                  <FormItem
                    label={t("Revenue model")}
                    placeholder={t("Describe your revenue model")}
                    isOptional
                    register={register("revenueModel")}
                    error={errors.revenueModel?.message}
                  />
                </GridItem>
                <GridItem>
                  <FormItem
                    label={t("High level roadmap")}
                    placeholder={t("Describe your high level roadmap or add attachment below")}
                    isOptional
                    register={register("highLevelRoadmap")}
                    error={errors.highLevelRoadmap?.message}
                  />
                </GridItem>

                <GridItem colSpan={{ base: 1, md: 2 }}>
                  <Field.Root invalid={!!errors.outcomesAttachment?.message}>
                    <HStack justify="space-between" w="full">
                      <Field.Label fontSize="sm" fontWeight="medium" htmlFor={register.name}>
                        {t("Attachments")}
                      </Field.Label>
                      <Text fontSize="sm" fontWeight="medium" color="text.subtle">
                        {"Optional"}
                      </Text>
                    </HStack>
                    <FileUpload.Root w="full" alignItems="stretch" maxFiles={10}>
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
                      <FileUpload.List />
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
