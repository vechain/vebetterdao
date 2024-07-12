import { useGetAppAdministrationRole, useXApps } from "@/api"
import { Card, CardBody, HStack, Heading, VStack } from "@chakra-ui/react"
import { AppDetails } from "./components/AppDetails"
import { useTranslation } from "react-i18next"

export const ManagedAppsCard = () => {
  const { t } = useTranslation()
  const { data: xApps } = useXApps()
  const appsRoles = useGetAppAdministrationRole(xApps?.map(xApp => xApp.id) || [])

  const hasManagedApps = appsRoles.some(role => role.data?.isAdmin || role.data?.isModerator)

  if (!hasManagedApps) return null

  return (
    <Card w="full" variant="baseWithBorder">
      <CardBody>
        <VStack spacing={4} align="flex-start" w={"full"}>
          <HStack justifyContent={"space-between"} w="full">
            <Heading fontSize="24px">{t("Managed apps")}</Heading>
          </HStack>

          <VStack spacing={8} w="full" align="flex-start" justify={"stretch"}>
            {appsRoles.map((role, index) => {
              if ((role.data?.isAdmin || role.data?.isModerator) && !!role.data.app) {
                return (
                  <AppDetails
                    app={role.data.app}
                    isAdmin={role.data.isAdmin}
                    isModerator={role.data.isModerator}
                    key={index}
                  />
                )
              }
            })}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
