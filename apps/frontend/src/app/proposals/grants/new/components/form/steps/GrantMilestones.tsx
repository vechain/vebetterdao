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
  Badge,
  HStack,
} from "@chakra-ui/react"
import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormGetValues, UseFormWatch } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { FormItem } from "@/components/CustomFormFields/FormItem"
import { type GrantFormData } from "@/hooks/proposals/grants/types"
import { UilPlus, UilTrash, UilArrowRight } from "@iconscout/react-unicons"
import { FormCheckbox } from "@/components/CustomFormFields/FormCheckbox"
import dayjs from "dayjs"

interface GrantMilestonesProps {
  register: UseFormRegister<GrantFormData>
  setValue: UseFormSetValue<GrantFormData>
  getValues: UseFormGetValues<GrantFormData>
  errors: FieldErrors<GrantFormData>
  setData: (data: GrantFormData) => void
  formData: GrantFormData
  watch: UseFormWatch<GrantFormData>
}

type MilestoneSectionProps = {
  register: UseFormRegister<GrantFormData>
  errors: FieldErrors<GrantFormData>
  index: number
  removeMilestone: (index: number) => void
  getValues: UseFormGetValues<GrantFormData>
}

export const MilestoneSection = ({ register, errors, index, removeMilestone, getValues }: MilestoneSectionProps) => {
  const { t } = useTranslation()
  const milestoneNumber = index + 1
  const isFirst = index === 0

  return (
    <AccordionItem key={index} {...(isFirst && { borderTop: "none" })}>
      {({ isExpanded }) => {
        const currentMilestone = getValues(`milestones.${index}`)
        const hasDurationInfo = currentMilestone.durationFrom && currentMilestone.durationTo
        const formattedDurationFrom = dayjs(Number(currentMilestone.durationFrom)).format("MM/DD/YYYY")
        const formattedDurationTo = dayjs(Number(currentMilestone.durationTo)).format("MM/DD/YYYY")

        return (
          <>
            <AccordionButton w="full" py={4} textAlign="left" justifyContent="space-between">
              <HStack w="full" spacing={4}>
                <Heading size="md">{t("Milestone {{milestoneNumber}}", { milestoneNumber })}</Heading>
                {!isExpanded && hasDurationInfo && (
                  <Badge variant="outline" size="sm">
                    <Text fontSize="sm">{formattedDurationFrom}</Text>
                    <UilArrowRight />
                    <Text fontSize="sm">{formattedDurationTo}</Text>
                  </Badge>
                )}
              </HStack>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <Text fontSize="sm" color="gray.500" pb={4}>
                {t("Define the milestones for your project. Funds will be released as milestones are completed.")}
              </Text>

              <Grid templateColumns="repeat(2, 1fr)" gap={6}>
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
                <GridItem>
                  <FormItem
                    label={t("Duration")}
                    placeholder={t("From")}
                    register={register(`milestones.${index}.durationFrom`, {
                      required: t("Please enter the duration for this milestone"),
                    })}
                    error={errors.milestones?.[index]?.durationFrom?.message}
                  />
                </GridItem>

                <GridItem>
                  <FormItem
                    placeholder={t("To")}
                    register={register(`milestones.${index}.durationTo`, {
                      required: t("Please enter the duration for this milestone"),
                    })}
                    error={errors.milestones?.[index]?.durationTo?.message}
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
                {!isFirst && ( //TODO: This information should come from the Smart Contract, to know the minimal amount of milestones
                  <GridItem colSpan={2}>
                    <Button
                      variant="primarySubtle"
                      leftIcon={<Icon as={UilTrash} />}
                      onClick={() => removeMilestone(index)}>
                      {t("Remove")}
                    </Button>
                  </GridItem>
                )}
              </Grid>
            </AccordionPanel>
          </>
        )
      }}
    </AccordionItem>
  )
}

export const GrantMilestones = ({ register, setValue, getValues, setData, errors, formData }: GrantMilestonesProps) => {
  const { t } = useTranslation()
  const milestones = getValues("milestones")
  const handleAddMilestone = () => {
    //Get the last milestone
    const now = dayjs().unix()
    const lastMilestone = milestones[milestones.length - 1] ?? { durationTo: now }
    //Append to internal array and update the form store
    milestones.push({
      description: "",
      deliverables: "",
      fundingAmount: 0,
      durationFrom: dayjs(lastMilestone.durationTo).add(1, "month").unix(),
      durationTo: dayjs(lastMilestone.durationTo).add(2, "month").unix(),
    })
    setValue("milestones", milestones)
    //Persist the new milestone in the form data
    setData({ ...formData, milestones })
  }

  const handleRemoveMilestone = (index: number) => {
    if (index === 0) {
      return
    }
    //Remove the milestone from the form data
    const milestones = getValues("milestones")
    milestones.splice(index, 1)
    setValue("milestones", milestones)
    //Persist the new milestone in the form data
    setData({ ...formData, milestones })
  }

  return (
    <VStack spacing={6} align="stretch" w="full">
      <Accordion allowMultiple>
        {milestones.map((milestone, index) => {
          const uniqueKey = `${milestone.durationFrom}-${milestone.durationTo}`
          return (
            <MilestoneSection
              key={uniqueKey}
              register={register}
              errors={errors}
              index={index}
              removeMilestone={handleRemoveMilestone}
              getValues={getValues}
            />
          )
        })}
      </Accordion>
      <Grid templateColumns="repeat(2, 1fr)" gap={6}>
        <GridItem>
          <Button leftIcon={<Icon as={UilPlus} />} variant="primaryLink" onClick={handleAddMilestone}>
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
