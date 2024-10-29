import { AppAdministrationRole, useGetAppAdministrationRole, useXApps } from "@/api"
import { Button, Card, CardBody, HStack, Heading, VStack, useDisclosure } from "@chakra-ui/react"
import { AppDetails } from "./components/AppDetails"
import { useTranslation } from "react-i18next"
import { AllManagedAppsModal } from "./components/AllManagedAppsModal"

export const ManagedAppsCard = () => {
  const { t } = useTranslation()
  const { isOpen, onClose, onOpen } = useDisclosure()
  const { data: xApps } = useXApps()
  const appsRoles = useGetAppAdministrationRole(xApps?.allApps?.map(xApp => xApp.id) || [])

  // filter only apps that are managed by the user and recreate the array by not using UseQueryResult but directly data
  const userAppRoles: AppAdministrationRole[] = appsRoles.reduce((acc, appRole) => {
    const data = appRole.data
    if (data && (data.isAdmin || data.isModerator)) {
      acc.push(data)
    }
    return acc
  }, [] as AppAdministrationRole[])

  if (!userAppRoles || userAppRoles.length < 1) return null

  return (
    <Card w="full" variant="baseWithBorder">
      <CardBody>
        <VStack spacing={4} align="flex-start" w={"full"}>
          <HStack justifyContent={"space-between"} w="full">
            <Heading fontSize="24px">{t("Managed apps")}</Heading>

            {userAppRoles.length > 1 && (
              <HStack justifyContent={"flex-end"}>
                <Button variant="link" colorScheme="primary" onClick={onOpen}>
                  {t("See all") + ` (${userAppRoles.length})`}
                </Button>
              </HStack>
            )}
          </HStack>

          <VStack spacing={8} w="full" align="flex-start" justify={"stretch"}>
            {userAppRoles[0] && (
              <AppDetails
                appId={userAppRoles[0].appId}
                isAdmin={userAppRoles[0].isAdmin}
                isModerator={userAppRoles[0].isModerator}
              />
            )}
          </VStack>
        </VStack>
      </CardBody>

      <AllManagedAppsModal isOpen={isOpen} onClose={onClose} userAppRoles={userAppRoles} />
    </Card>
  )
}
