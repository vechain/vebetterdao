import {
  VStack,
  Text,
  Grid,
  GridItem,
  Heading,
  UnorderedList,
  ListItem,
  Button,
  Icon,
  AccordionItem,
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
} from "@chakra-ui/react"
import { FieldErrors, UseFormRegister } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { FormItem } from "@/components/CustomFormFields/FormItem"
import { GrantFormData } from "@/hooks/proposals/grants/types"
import { UilPlus } from "@iconscout/react-unicons"
import { FormCheckbox } from "@/components/CustomFormFields/FormCheckbox"

interface GrantMilestonesProps {
  register: UseFormRegister<GrantFormData>
  errors: FieldErrors<GrantFormData>
}

type MilestoneSectionProps = {
  register: UseFormRegister<GrantFormData>
  errors: FieldErrors<GrantFormData>
  index: number
}

export const MilestoneSection = ({ register, errors, index }: MilestoneSectionProps) => {
  const { t } = useTranslation()
  const milestoneNumber = index + 1
  const isFirst = index === 0
  return (
    <AccordionItem {...(isFirst && { borderTop: "none" })}>
      <AccordionButton w="full" py={4}>
        <Heading size="md" w="full" textAlign="left">
          {t("Milestone {{milestoneNumber}}", { milestoneNumber })}
        </Heading>
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel>
        <Text fontSize="sm" color="gray.500" pb={4}>
          {t("Define the milestones for your project. Funds will be released as milestones are completed.")}
        </Text>
        <Grid templateColumns="1fr" gap={6}>
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <FormItem
              label={t("Amount")}
              placeholder="0 USD"
              register={register(`milestones.${index}.fundingAmount`, {
                required: t("Please enter the amount for this milestone"),
              })}
              error={errors.milestones?.[index]?.fundingAmount?.message}
            />
          </GridItem>
        </Grid>

        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          <GridItem>
            <FormItem
              label={t("Duration")}
              placeholder={t("From")}
              register={register(`milestones.${index}.fundingDurationFrom`, {
                required: t("Please enter the duration for this milestone"),
              })}
              error={errors.milestones?.[index]?.fundingDurationFrom?.message}
            />
          </GridItem>

          <GridItem>
            <FormItem
              placeholder={t("To")}
              register={register(`milestones.${index}.fundingDurationTo`, {
                required: t("Please enter the duration for this milestone"),
              })}
              error={errors.milestones?.[index]?.fundingDurationTo?.message}
            />
          </GridItem>
          <GridItem>
            <FormItem
              label={t("Description")}
              type="textarea"
              placeholder={t("Milestone description")}
              register={register(`milestones.${index}.description`, {
                required: t("Please enter the description for this milestone"),
              })}
              error={errors.milestones?.[index]?.description?.message}
            />
          </GridItem>
          <GridItem bg="#F8F8F8" p={4} borderRadius="xl" mt={10}>
            <Heading size="sm">{t("Tips")}</Heading>
            <Text fontSize="sm" color="gray.500">
              {t("Explain integration and launch on VeBetterDAO, like:")}
            </Text>
            <UnorderedList>
              <ListItem>{t("B3TR integrated as a reward mechanism within the app")}</ListItem>
              <ListItem>{t("VeWorld wallet support for seamless B3TR transactions")}</ListItem>
              <ListItem>{t("Testing and optimization reporting to ensure smooth UX and functionality")}</ListItem>
            </UnorderedList>
          </GridItem>
        </Grid>
      </AccordionPanel>
    </AccordionItem>
  )
}

export const GrantMilestones = ({ register, errors }: GrantMilestonesProps) => {
  const { t } = useTranslation()
  return (
    <VStack spacing={6} align="stretch" w="full">
      <Accordion allowMultiple defaultIndex={[0]}>
        {Array.from({ length: 3 }).map((_, index) => (
          <MilestoneSection key={index} register={register} errors={errors} index={index} />
        ))}
      </Accordion>
      <Grid templateColumns="repeat(2, 1fr)" gap={6}>
        <GridItem>
          <Button leftIcon={<Icon as={UilPlus} />} variant="primaryLink">
            {t("Add milestone")}
          </Button>
        </GridItem>
        <GridItem bg="#F8F8F8" p={4} borderRadius="xl" colSpan={2}>
          <Trans
            color="gray.100"
            textColor="gray.100"
            i18nKey="<b>Tip</b>: For a 12-months grant, it's best to break down milestones monthly or quarterly"
            components={{
              b: <Text as="span" fontWeight="bold" />,
            }}
          />
        </GridItem>
        <GridItem colSpan={2}>
          <FormCheckbox
            label={t("I agree to the Terms of Service and acknowledge the information provided is accurate.")}
            register={register("termsOfService", {
              required: t("Please agree to the Terms of Service"),
            })}
            error={errors.termsOfService?.message}
          />
        </GridItem>
      </Grid>
    </VStack>
  )
}
