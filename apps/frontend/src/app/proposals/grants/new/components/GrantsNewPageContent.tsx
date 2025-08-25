import { useTranslation } from "react-i18next"
import { VStack, Text, CardHeader, CardBody, Card, Grid, GridItem } from "@chakra-ui/react"
import { GrantsNewFormStepCard } from "./form"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb"

const BreadcrumItems = [
  {
    label: "Governance",
    href: "/proposals/grants",
  },

  {
    label: "Apply for grant",
    href: "/proposals/grants/new",
  },
]

export const GrantsNewPageContent = () => {
  const { t } = useTranslation()

  return (
    <VStack w="full" spacing={8} pb={8} align="flex-start">
      <PageBreadcrumb items={BreadcrumItems} />
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8} w="full">
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <GrantsNewFormStepCard />
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
