import { VStack, Grid, GridItem } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { PageBreadcrumb } from "@/app/components/PageBreadcrumb/PageBreadcrumb"

import { BecomeNavigatorFormStepCard } from "./form/BecomeNavigatorFormStepCard"
import { HowRegistrationWorks } from "./form/HowRegistrationWorks"

export const BecomeNavigatorPageContent = () => {
  const { t } = useTranslation()
  const breadcrumbItems = useMemo(
    () => [
      { label: t("Navigators"), href: "/navigators" },
      { label: t("Become a Navigator"), href: "/navigators/become" },
    ],
    [t],
  )

  return (
    <VStack w="full" gap={8} pb={8} align="flex-start">
      <PageBreadcrumb items={breadcrumbItems} />
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8} w="full">
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <BecomeNavigatorFormStepCard />
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 1 }}>
          <HowRegistrationWorks />
        </GridItem>
      </Grid>
    </VStack>
  )
}
