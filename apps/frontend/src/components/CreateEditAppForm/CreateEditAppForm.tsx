import { XApp } from "@/api"
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Heading,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { isValid } from "@repo/utils/AddressUtils"
import { FieldErrors, UseFormGetValues, UseFormRegister, UseFormWatch } from "react-hook-form"
import { AddressIcon } from "../AddressIcon"
import { useIpfsImage } from "@/api/ipfs"
import { UploadFileButton } from "../UploadFileButton"
import { UploadedImage, useSingleImageUpload, useUploadImages } from "@/hooks"
import { useState, useEffect, useCallback } from "react"
import { base64UrlToFile } from "@/utils/BlobUtils"
import image from "next/image"

export type CreateEditAppFormData = {
  name: string
  description: string
  logo: string
  banner: string
  projectUrl: string
  receiverAddress: string
}

type Props = {
  register: UseFormRegister<CreateEditAppFormData>
  errors: FieldErrors<CreateEditAppFormData>
  isEdit?: boolean
  editedApp?: XApp
  watch: UseFormWatch<CreateEditAppFormData>
}
export const CreateEditAppForm = ({ register, errors, isEdit = false, editedApp, watch }: Props) => {
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(watch("logo"))
  const { data: banner, isLoading: isBannerLoading } = useIpfsImage(watch("banner"))

  const [defaultLogo, setDefaultLogo] = useState<UploadedImage>()
  const [defaultBanner, setDefaultBanner] = useState<UploadedImage>()

  useEffect(() => {
    const parseDefaultImages = async () => {
      if (logo?.image) {
        const file = await base64UrlToFile(logo?.image, `${editedApp?.name}_logo}.jpeg`, "image/jpeg")
        setDefaultLogo({
          file,
          image: logo?.image,
        })
      }
      if (banner?.image) {
        const file = await base64UrlToFile(banner?.image, `${editedApp?.name}_banner.jpeg`, "image/jpeg")
        setDefaultBanner({
          file,
          image: banner?.image,
        })
      }
    }
    parseDefaultImages()
  }, [logo, banner])

  const { onUpload: uploadLogo, uploadedImage: uploadedLogo } = useSingleImageUpload({
    defaultImage: defaultLogo,
  })
  const { onUpload: uploadBanner, uploadedImage: uploadedBanner } = useSingleImageUpload({
    defaultImage: defaultBanner,
  })

  const onDrop = useCallback(
    (image: "logo" | "banner") => (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file?.type.includes("image")) {
        image === "logo" ? uploadLogo(file) : uploadBanner(file)
      }
    },
    [uploadLogo, uploadBanner],
  )

  return (
    <Card>
      <CardHeader>
        <Heading size="lg">{isEdit ? `Edit App ${editedApp?.name}` : "Create a new App"}</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} w="full">
          <FormControl isInvalid={!!errors.name}>
            <FormLabel>Name</FormLabel>
            <Input
              {...register("name", {
                required: "Name is required",
              })}
            />
            {errors.name && <FormErrorMessage>{errors.name.message}</FormErrorMessage>}
          </FormControl>
          <FormControl isInvalid={!!errors.description}>
            <FormLabel>Description</FormLabel>
            <Textarea
              {...register("description", {
                required: "Description is required",
                min: { value: 100, message: "Description is too short" },
              })}
            />
            {errors.description && <FormErrorMessage>{errors.description.message}</FormErrorMessage>}
          </FormControl>
          <FormControl isInvalid={!!errors.projectUrl}>
            <FormLabel>Project URL</FormLabel>
            <Input
              {...register("projectUrl", {
                validate: value => {
                  if (!value) {
                    return "Project URL is required"
                  }
                  try {
                    new URL(value)
                    return true
                  } catch (e) {
                    return "Invalid URL"
                  }
                },
              })}
            />
            {errors.projectUrl && <FormErrorMessage>{errors.projectUrl.message}</FormErrorMessage>}
          </FormControl>
          <FormControl isInvalid={!!errors.receiverAddress}>
            <FormLabel>Wallet address</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <AddressIcon borderRadius={"full"} boxSize={6} address={watch("receiverAddress")} />
              </InputLeftElement>
              <Input
                {...register("receiverAddress", {
                  validate: value => isValid(value) || "Invalid address",
                })}
              />
            </InputGroup>
            {errors.receiverAddress && <FormErrorMessage>{errors.receiverAddress.message}</FormErrorMessage>}
          </FormControl>
          <Stack direction={["column", "row"]} w="full" justify={"space-between"} align={"flex-start"}>
            <FormControl isInvalid={!!errors.logo}>
              <FormLabel>Logo</FormLabel>
              <VStack w="full">
                <Image src={uploadedLogo?.image} alt="logo" h={200} objectFit="cover" borderRadius="9px" />
                <UploadFileButton mt={4} alignSelf={"flex-end"} onDrop={onDrop("logo")} />
                {errors.logo && <FormErrorMessage>{errors.logo.message}</FormErrorMessage>}
              </VStack>
            </FormControl>
            <FormControl isInvalid={!!errors.banner}>
              <FormLabel>Banner</FormLabel>
              <VStack w="full">
                <Image src={uploadedBanner?.image} alt="banner" h={200} w="full" rounded={"3xl"} objectFit="cover" />
                <UploadFileButton mt={4} alignSelf={"flex-end"} onDrop={onDrop("banner")} />
                {errors.banner && <FormErrorMessage>{errors.banner.message}</FormErrorMessage>}
              </VStack>
            </FormControl>
          </Stack>
        </VStack>
      </CardBody>
      <CardFooter display={"flex"} flexDir={"column"} w="full">
        <Button colorScheme="blue" type="submit" size="lg" alignSelf={"flex-end"} borderRadius={"full"}>
          {isEdit ? "Save" : "Submit"}
        </Button>
      </CardFooter>
    </Card>
  )
}
