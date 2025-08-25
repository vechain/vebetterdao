import { VStack, Text, Grid, GridItem, Accordion } from "@chakra-ui/react"
import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FormItem } from "@/components/CustomFormFields/FormItem"
import { type GrantFormData } from "@/hooks/proposals/grants/types"
import { UilGithub } from "@iconscout/react-unicons"
import { FaXTwitter } from "react-icons/fa6"
import { AiOutlineDiscord } from "react-icons/ai"
import { FormAccordionSection, FormSocialConnectButton } from "@/components/CustomFormFields"

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
      <Accordion allowMultiple w="full">
        <GridItem>
          <FormAccordionSection title={t("Project details")}>
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
              <GridItem>
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
                  label={t("Company name")}
                  placeholder="e.g. My Awesome Company"
                  register={register("companyName", {
                    required: t("Please enter your company name"),
                  })}
                  error={errors.companyName?.message}
                />
              </GridItem>

              <GridItem>
                <FormItem
                  label={t("Testnet/App URL")}
                  placeholder="Enter link here"
                  register={register("appTestnetUrl", {
                    required: t("Please enter your app testnet URL"),
                  })}
                  error={errors.appTestnetUrl?.message}
                />
              </GridItem>

              <GridItem>
                <FormItem
                  label={t("Website URL")}
                  placeholder="Enter link here"
                  type="url"
                  register={register("projectWebsite", {
                    required: t("Please provide your project website"),
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: t("Please enter a valid URL starting with http:// or https://"),
                    },
                  })}
                  error={errors.projectWebsite?.message}
                />
              </GridItem>
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <VStack spacing={6} align="stretch" w="full">
                  <VStack align="flex-start" spacing={1}>
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
          </FormAccordionSection>
        </GridItem>
        <GridItem>
          <FormAccordionSection title={t("Outcomes")}>
            <VStack spacing={6} align="stretch" w="full">
              <Grid templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(2, 1fr)" }} gap={6}>
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
                    register={register("revenueModel", {
                      required: t("Please describe revenue model"),
                    })}
                    error={errors.revenueModel?.message}
                  />
                </GridItem>
                <GridItem>
                  <FormItem
                    label={t("High level roadmap")}
                    placeholder={t("Describe your high level roadmap or add attachment below")}
                    register={register("highLevelRoadmap", {
                      required: t("Please describe your high-level roadmap"),
                    })}
                    error={errors.highLevelRoadmap?.message}
                  />
                </GridItem>
              </Grid>
            </VStack>
          </FormAccordionSection>
        </GridItem>
      </Accordion>
    </Grid>
  )
}
