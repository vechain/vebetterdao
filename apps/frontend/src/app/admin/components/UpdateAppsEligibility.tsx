import { useAppsEligibleInNextRound, useXApps } from "@/api"
import {
  VStack,
  FormControl,
  FormLabel,
  Heading,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  Switch,
  HStack,
  Divider,
} from "@chakra-ui/react"
import { useMemo, useState } from "react"

export const UpdateAppsEligibility = () => {
  const { data: eligibleAppsIds } = useAppsEligibleInNextRound()
  const { data: x2EarnApps } = useXApps()

  // loop through x2EarnApps and check if appIds are in x2EarnApps,
  // if they are in then put elegible true, otherwise eligible false
  const x2EarnAppsEligible = useMemo(() => {
    return x2EarnApps?.map(app => {
      return {
        ...app,
        eligible: eligibleAppsIds?.includes(app.id),
      }
    })
  }, [eligibleAppsIds, x2EarnApps])

  return (
    <Card>
      <CardHeader>
        <Heading size="lg">{"Apps eligible in next round"}</Heading>
      </CardHeader>
      <CardBody>
        <FormControl as={SimpleGrid} gap={3}>
          {x2EarnAppsEligible?.map(app => (
            <VStack key={app.id}>
              <HStack w={"full"} justifyContent={"space-between"}>
                <FormLabel>{app.name}</FormLabel>
                <Switch isChecked={app.eligible} />
              </HStack>
              <Divider />
            </VStack>
          ))}
        </FormControl>
      </CardBody>
    </Card>
  )
}
