import { XApp } from "@/api"
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Heading,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Skeleton,
  Stack,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { isValid } from "@repo/utils/AddressUtils"
import {
  Control,
  Controller,
  FieldErrors,
  UseFormClearErrors,
  UseFormRegister,
  UseFormSetError,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form"
import { AddressIcon } from "../AddressIcon"
import { UploadFileButton } from "../UploadFileButton"
import { useCallback } from "react"
import { notFoundImage } from "@/constants"
import { useDropzone } from "react-dropzone"
import { blobToBase64 } from "@/utils/BlobUtils"

// Validate image uploads with size and type
const validateImageUpload = async (
  file: File,
  setError: UseFormSetError<CreateEditAppFormData>,
  field: keyof CreateEditAppFormData,
) => {
  if (!file) return
  if (!file?.type.includes("image")) {
    setError(field, {
      type: "custom",
      message: "File is not an image",
    })
    return
  }
  if (file.size > 1024 * 1024) {
    setError(field, {
      type: "custom",
      message: "File size is too large (max 1MB)",
    })
    return
  }
  return await blobToBase64(file)
}

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
  control: Control<CreateEditAppFormData, any>
  setError: UseFormSetError<CreateEditAppFormData>
  setValue: UseFormSetValue<CreateEditAppFormData>
  clearErrors: UseFormClearErrors<CreateEditAppFormData>
}

export const CreateEditAppForm = ({
  register,
  errors,
  isEdit = false,
  editedApp,
  watch,
  control,
  setError,
  setValue,
  clearErrors,
}: Props) => {
  // handle image uploads with validation
  const onDrop = useCallback(
    (image: "logo" | "banner") => async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return
      if (image === "logo") {
        clearErrors("logo")
        const base64Logo = await validateImageUpload(file, setError, "logo")
        if (!base64Logo) return
        setValue("logo", base64Logo)
      }
      if (image === "banner") {
        clearErrors("banner")
        const base64Banner = await validateImageUpload(file, setError, "banner")
        if (!base64Banner) return
        setValue("banner", base64Banner)
      }
    },
    [setError, setValue, clearErrors],
  )

  const { open: openUploadLogo } = useDropzone({ onDrop: onDrop("logo") })

  const { open: openUploadBanner } = useDropzone({ onDrop: onDrop("banner") })

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
          <Stack direction={["column", "row"]} w="full" justify={"space-between"} align={"flex-start"} spacing={4}>
            <Controller
              name="logo"
              control={control}
              render={({ field: { value } }) => (
                <FormControl isInvalid={!!errors.logo}>
                  <FormLabel>Logo</FormLabel>
                  <VStack w="full" align="flex-start">
                    <Image
                      alignSelf={"center"}
                      onClick={openUploadLogo}
                      _hover={{ cursor: "pointer" }}
                      src={value ?? notFoundImage}
                      alt="logo"
                      h={200}
                      objectFit="cover"
                      borderRadius="9px"
                    />

                    {errors.logo ? (
                      <FormErrorMessage>{errors.logo.message}</FormErrorMessage>
                    ) : (
                      <FormHelperText>Recommended size: 96x96px</FormHelperText>
                    )}
                    <UploadFileButton mt={4} alignSelf={"flex-end"} onDrop={onDrop("logo")} />
                  </VStack>
                </FormControl>
              )}
            />
            <Controller
              name="banner"
              control={control}
              render={({ field: { value } }) => (
                <FormControl isInvalid={!!errors.banner}>
                  <FormLabel>Banner</FormLabel>
                  <VStack w="full" align={"flex-start"}>
                    <Image
                      alignSelf={"center"}
                      onClick={openUploadBanner}
                      _hover={{ cursor: "pointer" }}
                      src={value ?? notFoundImage}
                      alt="banner"
                      h={200}
                      w="full"
                      rounded={"3xl"}
                      objectFit="cover"
                    />
                    {errors.banner ? (
                      <FormErrorMessage>{errors.banner.message}</FormErrorMessage>
                    ) : (
                      <FormHelperText>Recommended size: 150x200px</FormHelperText>
                    )}
                    <UploadFileButton mt={4} alignSelf={"flex-end"} onDrop={onDrop("banner")} />
                  </VStack>
                </FormControl>
              )}
            />
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
