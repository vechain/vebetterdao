import { VStack, Text, Grid, GridItem, Separator } from "@chakra-ui/react"
import { FieldErrors, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FormItem } from "@/components/CustomFormFields/FormItem"
import { type GrantFormData } from "@/hooks/proposals/grants/types"

interface AboutApplicantProps {
  register: UseFormRegister<GrantFormData>
  errors: FieldErrors<GrantFormData>
}

export const AboutApplicant = ({ register, errors }: AboutApplicantProps) => {
  const { t } = useTranslation()

  return (
    <Grid templateColumns={{ base: "1fr", md: "1fr" }} w="full" gap={8}>
      <GridItem>
        <VStack gap={6} align="stretch" w="full">
          <Text fontSize="lg" fontWeight="semibold">
            {t("Member")}
          </Text>

          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
            <GridItem>
              <FormItem
                label={t("Name")}
                placeholder="Ivan"
                register={register("applicantName", {
                  required: t("Please enter your name"),
                })}
                error={errors.applicantName?.message}
              />
            </GridItem>

            <GridItem>
              <FormItem
                label={t("Surname")}
                placeholder="Smith"
                register={register("applicantSurname", {
                  required: t("Please enter your surname"),
                })}
                error={errors.applicantSurname?.message}
              />
            </GridItem>

            <GridItem>
              <FormItem
                label={t("Role")}
                placeholder="e.g. Product manager"
                register={register("applicantRole", {
                  required: t("Please specify your role"),
                })}
                error={errors.applicantRole?.message}
              />
            </GridItem>

            <GridItem>
              <FormItem
                label={t("Profile URL")}
                placeholder="e.g. your Linkedin"
                type="url"
                register={register("applicantProfileUrl", {
                  required: t("Please provide your profile URL"),
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: t("Please enter a valid URL starting with http:// or https://"),
                  },
                })}
                error={errors.applicantProfileUrl?.message}
              />
            </GridItem>
          </Grid>
        </VStack>
      </GridItem>
      <Separator />
      <GridItem>
        <VStack gap={6} align="stretch" w="full">
          <VStack align="flex-start" gap={1}>
            <Text fontSize="lg" fontWeight="semibold">
              {t("Address")}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {t("Enter either your personal or company address — whichever is more relevant.")}
            </Text>
          </VStack>

          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
            <GridItem>
              <FormItem
                label={t("Country")}
                placeholder="Country"
                register={register("applicantCountry", {
                  required: t("Please enter your country"),
                })}
                error={errors.applicantCountry?.message}
              />
            </GridItem>

            <GridItem>
              <FormItem
                label={t("City")}
                placeholder="City"
                register={register("applicantCity", {
                  required: t("Please enter your city"),
                })}
                error={errors.applicantCity?.message}
              />
            </GridItem>

            <GridItem>
              <FormItem
                label={t("Street")}
                placeholder="Street name and number"
                register={register("applicantStreet", {
                  required: t("Please enter your street address"),
                })}
                error={errors.applicantStreet?.message}
              />
            </GridItem>

            <GridItem>
              <FormItem
                label={t("Postal code")}
                placeholder="Postal code"
                register={register("applicantPostalCode", {
                  required: t("Please enter your postal code"),
                })}
                error={errors.applicantPostalCode?.message}
              />
            </GridItem>
          </Grid>
        </VStack>
      </GridItem>

      <GridItem colSpan={{ base: 1, md: 2 }}>
        <FormItem
          label={t("Relevant background")}
          description={t("Tell us about your team and personal experience with similar projects")}
          type="textarea"
          placeholder="Tell us about your team and personal experience with similar projects"
          register={register("applicantBackground", {
            required: t("Please provide information about your relevant background"),
          })}
          error={errors.applicantBackground?.message}
        />
      </GridItem>
    </Grid>
  )
}
