import { VStack, Grid, GridItem } from "@chakra-ui/react"
import { GrantsNewFormStepCard } from "./form"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb"
import { HowGrantWorks } from "../components/form"
import { useNewGrantPageGuard } from "../hooks/useNewGrantPageGuard"
import { useLayoutEffect } from "react"
import { useRouter } from "next/navigation"

const BreadcrumItems = [
  {
    label: "Grants",
    href: "/grants",
  },

  {
    label: "Apply for grant",
    href: "/grants/new",
  },
]

export const GrantsNewPageContent = () => {
  const router = useRouter()
  const pageGuardResult = useNewGrantPageGuard()

  // Redirect the user if they don't meet the criteria and data is loaded
  useLayoutEffect(() => {
    if (!pageGuardResult.isLoading && !pageGuardResult.isVisitAuthorized) {
      router.push(pageGuardResult.redirectPath)
    }
  }, [pageGuardResult, router])

  // Show nothing while loading or if not authorized
  if (pageGuardResult.isLoading) return null
  if (!pageGuardResult.isVisitAuthorized) return null

  return (
    <VStack w="full" gap={8} pb={8} align="flex-start">
      <PageBreadcrumb items={BreadcrumItems} />
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8} w="full">
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <GrantsNewFormStepCard />
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 1 }}>
          <HowGrantWorks />
        </GridItem>
      </Grid>
    </VStack>
  )
}
