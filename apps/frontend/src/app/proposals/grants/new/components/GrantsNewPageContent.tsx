import { VStack, Card, Grid, GridItem } from "@chakra-ui/react"
import { GrantsNewFormStepCard } from "./form"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb"
import { HowGrantWorks } from "../components/form"

const BreadcrumItems = [
  {
    label: "Grants",
    href: "/proposals/grants",
  },

  {
    label: "Apply for grant",
    href: "/proposals/grants/new",
  },
]

export const GrantsNewPageContent = () => {
  return (
    <VStack w="full" spacing={8} pb={8} align="flex-start">
      <PageBreadcrumb items={BreadcrumItems} />
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8} w="full">
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <GrantsNewFormStepCard />
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 1 }}>
          <Card variant="base">
            <HowGrantWorks />
          </Card>
        </GridItem>
      </Grid>
    </VStack>
  )
}
