import { useXApp, useXAppMetadata } from "@/api"
import { AppDetailCard } from "@/app/apps/[appId]/components/AppDetailCard"
import { CreateEditAppForm, CreateEditAppFormData } from "@/components/CreateEditAppForm"
import { VStack, Button, Grid, GridItem } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { FaArrowLeft } from "react-icons/fa6"
import { w } from "vitest/dist/reporters-P7C2ytIv"

type Props = {
  appId: string
}
export const EditAppPageContent = ({ appId }: Props) => {
  const { data } = useXApp(appId)
  const { data: metadata } = useXAppMetadata(appId)
  const router = useRouter()
  const goToAppDetail = () => {
    router.push(`/apps/${appId}`)
  }

  const { register, formState } = useForm<CreateEditAppFormData>({
    defaultValues: {
      name: data?.name,
      description: metadata?.description,
      logo: metadata?.logo,
      banner: metadata?.banner,
      projectUrl: metadata?.external_url,
      receiverAddress: data?.receiverAddress,
    },
  })

  const { errors } = formState

  return (
    <VStack w="full" spacing={8} align="flex-start" data-testid={`app-${appId}-detail`}>
      <VStack spacing={4} alignItems={"flex-start"}>
        <Button colorScheme="gray" size="md" variant="outline" leftIcon={<FaArrowLeft />} onClick={goToAppDetail}>
          App detail
        </Button>
        <Grid templateColumns="repeat(3, 1fr)" gap={[4, 4, 8]} w="full">
          <GridItem colSpan={[3, 3, 2]}>
            <CreateEditAppForm register={register} errors={errors} />
          </GridItem>
          <GridItem colSpan={[3, 3, 1]}>
            <AppDetailCard appId={appId} />
          </GridItem>
        </Grid>
      </VStack>
    </VStack>
  )
}
