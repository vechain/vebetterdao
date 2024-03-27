import { useXApp, useXAppMetadata } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { AppDetailCard } from "@/app/apps/[appId]/components/AppDetailCard"
import { CreateEditAppForm, CreateEditAppFormData } from "@/components/CreateEditAppForm"
import { VStack, Button, Grid, GridItem, Heading } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { FaArrowLeft } from "react-icons/fa6"

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

  const { register, setValue, setError, formState, watch, handleSubmit, clearErrors, control } =
    useForm<CreateEditAppFormData>({
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

  const onSubmit = (data: CreateEditAppFormData) => {
    console.log(data)
  }

  const { data: logo } = useIpfsImage(metadata?.logo)
  const { data: banner } = useIpfsImage(metadata?.banner)

  useEffect(() => {
    if (logo) setValue("logo", logo?.image)
    if (banner) setValue("banner", banner?.image)
  }, [logo, banner, setValue])

  return (
    <VStack w="full" spacing={8} align="flex-start" data-testid={`app-${appId}-detail`}>
      <VStack spacing={4} alignItems={"flex-start"}>
        <Button colorScheme="gray" size="md" variant="outline" leftIcon={<FaArrowLeft />} onClick={goToAppDetail}>
          App detail
        </Button>
        <Grid templateColumns="repeat(3, 1fr)" gap={[4, 4, 8]} w="full">
          <GridItem colSpan={[3, 3, 2]}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CreateEditAppForm
                register={register}
                errors={errors}
                isEdit={true}
                editedApp={data}
                watch={watch}
                control={control}
                setError={setError}
                setValue={setValue}
                clearErrors={clearErrors}
              />
            </form>
          </GridItem>
          <GridItem colSpan={[3, 3, 1]}>
            <VStack spacing={4} w="full" align={"flex-start"}>
              <Heading size="md">App preview</Heading>
              <AppDetailCard appId={appId} />
            </VStack>
          </GridItem>
        </Grid>
      </VStack>
    </VStack>
  )
}
