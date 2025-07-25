import { useAccountAppPermissions } from "@/api"
import { Button, Card, HStack, Heading, VStack, useDisclosure } from "@chakra-ui/react"
import { AppDetails } from "./components/AppDetails"
import { useTranslation } from "react-i18next"
import { AllManagedAppsModal, AppAdministrationRole } from "./components/AllManagedAppsModal"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

export const ManagedAppsCard = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { open: isOpen, onClose, onOpen } = useDisclosure()
  const { data: appsPermissions } = useAccountAppPermissions(account?.address ?? "")

  // filter only apps that are managed by the user and recreate the array by not using UseQueryResult but directly data
  const userAppRoles: AppAdministrationRole[] = useMemo(() => {
    if (!appsPermissions) return []
    return Object.entries(appsPermissions).reduce((acc, appRole) => {
      const appId = appRole[0]
      const data = appRole[1]
      if (data.isAdmin || data.isModerator) {
        acc.push({
          isAdmin: data.isAdmin,
          isModerator: data.isModerator,
          appId,
        } as AppAdministrationRole)
      }
      return acc
    }, [] as AppAdministrationRole[])
  }, [appsPermissions])

  if (!userAppRoles || userAppRoles.length < 1) return null

  return (
    <Card.Root w="full" variant="baseWithBorder">
      <Card.Body>
        <VStack gap={4} align="flex-start" w={"full"}>
          <HStack justifyContent={"space-between"} w="full">
            <Heading fontSize="24px">{t("Managed apps")}</Heading>

            {userAppRoles.length > 1 && (
              <HStack justifyContent={"flex-end"}>
                <Button variant="ghost" colorPalette="primary" onClick={onOpen}>
                  {t("See all") + ` (${userAppRoles.length})`}
                </Button>
              </HStack>
            )}
          </HStack>

          <VStack gap={8} w="full" align="flex-start" justify={"stretch"}>
            {userAppRoles[0] && (
              <AppDetails
                appId={userAppRoles[0].appId}
                isAdmin={userAppRoles[0].isAdmin}
                isModerator={userAppRoles[0].isModerator}
              />
            )}
          </VStack>
        </VStack>
      </Card.Body>

      <AllManagedAppsModal isOpen={isOpen} onClose={onClose} userAppRoles={userAppRoles} />
    </Card.Root>
  )
}
