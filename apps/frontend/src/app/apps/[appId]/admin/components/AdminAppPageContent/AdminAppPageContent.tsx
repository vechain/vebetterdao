import { Button, Card, CardBody, Divider, HStack, Heading, VStack } from "@chakra-ui/react"
import { useCurrentAppMetadata, useCurrentAppModerators } from "../../../hooks"
import { useTranslation } from "react-i18next"
import { EditAppModerators } from "./components/EditAppModerators"
import { EditAppAddresses } from "./components/EditAppAddresses"
import { useForm } from "react-hook-form"
import { useCallback } from "react"
import { useRouter } from "next/navigation"

export type AdminAppForm = {
  adminAddress: string
  teamWalletAddress: string
  moderators: string[]
}

export const AdminAppPageContent = () => {
  const { appMetadata } = useCurrentAppMetadata()
  const { moderators } = useCurrentAppModerators()
  const { t } = useTranslation()
  const form = useForm<AdminAppForm>({
    defaultValues: {
      moderators,
    },
  })
  const router = useRouter()

  const goBack = useCallback(() => {
    router.back()
    form.reset()
  }, [form, router])

  const onSubmit = useCallback((data: AdminAppForm) => {
    console.log(data)
  }, [])

  return (
    <Card variant="baseWithBorder" w="full">
      <CardBody>
        <VStack gap="48px" align="stretch" as="form" onSubmit={form.handleSubmit(onSubmit)}>
          <Heading fontSize={"36px"} fontWeight={700}>
            {t("{{app}} settings", { app: appMetadata?.name })}
          </Heading>
          <EditAppModerators form={form} />
          <Divider />
          <EditAppAddresses form={form} />
          <HStack justify={"space-between"} mt={8}>
            <Button variant="primaryGhost" onClick={goBack}>
              {t("Go back")}
            </Button>
            <Button variant="primaryAction" type="submit">
              {t("Save all changes")}
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
