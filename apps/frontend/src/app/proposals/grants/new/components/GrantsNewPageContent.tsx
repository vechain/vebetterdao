import { useTranslation } from "react-i18next"
import {
  VStack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Text,
  CardHeader,
  CardBody,
  Card,
  Grid,
  GridItem,
  useSteps,
  Button,
  HStack,
} from "@chakra-ui/react"
import { BsChevronRight } from "react-icons/bs"
import { GrantsNewFormStepper } from "./GrantsNewFormStepper"
import { GrantTypeSelection } from "./GrantTypeSelection"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"

export type GrantFormData = {
  grantType: string
  // About applicant
  applicantName: string
  applicantEmail: string
  applicantWallet: string
  // About project
  projectName: string
  projectDescription: string
  projectWebsite: string
  projectTimeline: string
  // Milestones
  milestones: Array<{
    title: string
    description: string
    deliverables: string
    timeline: string
    fundingAmount: string
  }>
}
const BreadcrumbOverview = () => {
  const { t } = useTranslation()

  return (
    <Breadcrumb spacing={2} fontSize="lg" separator={<BsChevronRight size={16} />}>
      <BreadcrumbItem>
        <BreadcrumbLink href="/proposals/grants">
          <Text fontWeight="bold" color="#747C89">
            {t("Governance")}
          </Text>
        </BreadcrumbLink>
      </BreadcrumbItem>

      <BreadcrumbItem isCurrentPage>
        <BreadcrumbLink href="#">
          <Text fontWeight="bold">{t("Apply for grant")}</Text>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </Breadcrumb>
  )
}

const GrantsNewStepCard = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const steps = [
    { title: "Type of grant" },
    { title: "About applicant" },
    { title: "About project" },
    { title: "Grant Milestones" },
  ]

  const { handleSubmit, control } = useForm<GrantFormData>({
    defaultValues: {
      grantType: "dapp",
      applicantName: "",
      applicantEmail: "",
      applicantWallet: "",
      projectName: "",
      projectDescription: "",
      projectWebsite: "",
      projectTimeline: "",
      milestones: [],
    },
  })

  const { activeStep, goToNext } = useSteps({
    index: 0,
    count: steps.length,
  })
  const firstStep = 0
  const lastStep = steps.length - 1

  const onSubmit = (data: GrantFormData) => {
    // Handle form submission
    console.log("Form submitted:", data)
  }

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit(onSubmit)()
    } else {
      goToNext()
    }
  }
  const handleSaveDraft = () => {
    router.push("/proposals/grants")
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <GrantTypeSelection control={control} />
      // Add other cases for different steps
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <GrantsNewFormStepper activeStep={activeStep} steps={steps} />
      </CardHeader>
      <CardBody>
        <VStack spacing={4} w="full" align="flex-start">
          <form onSubmit={handleSubmit(onSubmit)}>{renderStepContent()}</form>
          <HStack spacing={4} w="full" align="flex-start">
            {activeStep !== firstStep && (
              <Button onClick={handleSaveDraft} variant="secondary" px={8}>
                {t("Save draft")}
              </Button>
            )}

            {activeStep !== lastStep && (
              <Button onClick={handleNext} variant="primaryAction" px={8}>
                {t("Continue")}
              </Button>
            )}
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

export const GrantsNewPageContent = () => {
  const { t } = useTranslation()

  return (
    <VStack w="full" spacing={8} pb={8} align="flex-start">
      <BreadcrumbOverview />
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8} w="full">
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <GrantsNewStepCard />
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 1 }}>
          <Card variant="base">
            <CardHeader>
              <Text fontWeight="bold">{t("Apply for grant")}</Text>
            </CardHeader>
            <CardBody>
              <Text>{t("Apply for grant")}</Text>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </VStack>
  )
}
