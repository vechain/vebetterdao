import { Button, Card, CardBody, Grid, GridItem, HStack, Heading, Stack, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback, useLayoutEffect, useState } from "react"
import { CheckableCard, CheckableCardProps } from "@/components"
import { useProposalFormStore } from "@/store/useProposalFormStore"
import { useTranslation } from "react-i18next"
import { useNewProposalPageGuard } from "../../form/hooks/useNewProposalPageGuard"
import { TFunction } from "i18next"

const Steps: (t: TFunction<"translation", undefined>) => (Omit<CheckableCardProps, "checked" | "onChange"> & {
  route: string
})[] = t => [
  {
    route: "/proposals/new/form/functions",
    imageSrc: "/images/blockchain.svg",
    title: t("Perform actions or changes"),
    description: t(
      "These proposals involve specific changes upon successful voting, aiming to implement concrete actions or modifications within the ecosystem.",
    ),
  },
  {
    route: "/proposals/new/form/discussion",
    imageSrc: "/images/people.svg",
    title: t("General proposal"),
    description: t(
      "If the desired outcome cannot be achieved by calling smart contract functions, then please describe what change idea you would like to propose",
    ),
  },
]
export const NewProposalTypePageContent = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const pageGuardResult = useNewProposalPageGuard()

  const { clearData } = useProposalFormStore()
  const [selectedRoute, setSelectedRoute] = useState<string>(Steps(t)[0]?.route as string)
  const onChange = useCallback(
    (route: string) => () => {
      setSelectedRoute(route)
    },
    [],
  )

  const onContinue = useCallback(() => {
    if (selectedRoute) {
      clearData()
      router.push(selectedRoute)
    }
  }, [router, selectedRoute, clearData])

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  //redirect the user to the beginning of the form if the required data is missing
  // this happens in case the user tries to access this page directly
  useLayoutEffect(() => {
    if (!pageGuardResult.isVisitAuthorized) {
      router.push(pageGuardResult.redirectPath ?? "/proposals")
    }
  }, [pageGuardResult, router])

  if (!pageGuardResult.isVisitAuthorized) return null

  return (
    <Grid
      templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(4, 1fr)"]}
      gap={6}
      w="full"
      data-testid="new-app">
      <GridItem colSpan={3}>
        <Card>
          <CardBody py={8}>
            <VStack spacing={8} align="flex-start">
              <Heading size="lg">{t("Select proposal type")}</Heading>
              <Stack direction={["column", "column", "row"]} w="full" spacing={4}>
                {Steps(t).map((step, index) => (
                  <CheckableCard
                    {...step}
                    cardProps={{
                      flex: 1,
                    }}
                    key={index}
                    onChange={onChange(step.route)}
                    checked={selectedRoute === step.route}
                  />
                ))}
              </Stack>
              <HStack alignSelf={"flex-end"} justify={"flex-end"} spacing={4} flex={1}>
                <Button rounded="full" variant={"primarySubtle"} colorScheme="primary" size="lg" onClick={goBack}>
                  {t("Go back")}
                </Button>
                <Button rounded="full" colorScheme="primary" size="lg" onClick={onContinue}>
                  {t("Continue")}
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </GridItem>
      <GridItem colSpan={1}></GridItem>
    </Grid>
  )
}
