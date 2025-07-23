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
import { ChangeEvent, useCallback, useRef } from "react"
import { notFoundImage } from "@/constants"
import { blobToBase64 } from "@/utils/BlobUtils"
import { useTranslation } from "react-i18next"

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
  adminAddress: string
  treasuryAddress: string
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
  isReceiverAddressDisabled?: boolean
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
  isReceiverAddressDisabled = false,
}: Props) => {
  const { t } = useTranslation()
  const uploadLogoRef = useRef<HTMLLabelElement>(null)
  const uploadBannerRef = useRef<HTMLLabelElement>(null)

  // handle image uploads with validation
  const onDrop = useCallback(
    (image: "logo" | "banner") => async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
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

  return (
    <Card>
      <CardHeader>
        <Heading size="lg">{isEdit ? `Edit App ${editedApp?.name}` : "Create a new App"}</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={8} w="full">
          <FormControl isInvalid={!!errors.name}>
            <FormLabel>{t("Name")}</FormLabel>
            <Input
              rounded={"xl"}
              {...register("name", {
                required: "Name is required",
              })}
            />
            {errors.name && <FormErrorMessage>{errors.name.message}</FormErrorMessage>}
          </FormControl>
          <FormControl isInvalid={!!errors.description}>
            <FormLabel>{t("Description")}</FormLabel>
            <Textarea
              rounded={"xl"}
              {...register("description", {
                required: "Description is required",
                min: { value: 100, message: "Description is too short" },
              })}
            />
            {errors.description && <FormErrorMessage>{errors.description.message}</FormErrorMessage>}
          </FormControl>
          <FormControl isInvalid={!!errors.projectUrl}>
            <FormLabel>{t("Project URL")}</FormLabel>
            <Input
              rounded={"xl"}
              {...register("projectUrl", {
                validate: value => {
                  if (!value) {
                    return "Project URL is required"
                  }
                  try {
                    new URL(value)
                    return true
                  } catch (e) {
                    console.error(e)
                    return "Invalid URL"
                  }
                },
              })}
            />
            {errors.projectUrl && <FormErrorMessage>{errors.projectUrl.message}</FormErrorMessage>}
          </FormControl>
          <FormControl isInvalid={!!errors.adminAddress}>
            <FormLabel>{t("Admin address")}</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <AddressIcon borderRadius={"full"} boxSize={6} address={watch("adminAddress")} />
              </InputLeftElement>
              <Input
                isDisabled={isReceiverAddressDisabled}
                rounded={"xl"}
                {...register("adminAddress", {
                  validate: value => isValid(value) || "Invalid address",
                })}
              />
            </InputGroup>
            {errors.adminAddress && <FormErrorMessage>{errors.adminAddress.message}</FormErrorMessage>}
          </FormControl>
          <FormControl isInvalid={!!errors.treasuryAddress}>
            <FormLabel>{t("Treasury address")}</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <AddressIcon borderRadius={"full"} boxSize={6} address={watch("treasuryAddress")} />
              </InputLeftElement>
              <Input
                isDisabled={isReceiverAddressDisabled}
                rounded={"xl"}
                {...register("treasuryAddress", {
                  validate: value => isValid(value) || "Invalid address",
                })}
              />
            </InputGroup>
            {errors.treasuryAddress && <FormErrorMessage>{errors.treasuryAddress.message}</FormErrorMessage>}
          </FormControl>
          <Stack direction={["column", "row"]} w="full" justify={"space-between"} align={"flex-start"} spacing={4}>
            <Controller
              name="logo"
              control={control}
              rules={{
                required: "Logo is required",
                validate: value => {
                  if (!value) {
                    return "Logo is required"
                  }
                  if (value === "/images/dapp_icon_placeholder.svg") return "Please upload a logo"
                },
              }}
              render={({ field: { value } }) => (
                <FormControl isInvalid={!!errors.logo}>
                  <FormLabel>{t("Logo")}</FormLabel>
                  <VStack w="full" align="flex-start">
                    <Image
                      alignSelf={"center"}
                      onClick={() => uploadLogoRef.current?.click()}
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
                      <FormHelperText>{t("Recommended size: 96x96px")}</FormHelperText>
                    )}
                    <UploadFileButton mt={4} alignSelf={"flex-end"} onChange={onDrop("logo")} ref={uploadLogoRef} />
                  </VStack>
                </FormControl>
              )}
            />
            <Controller
              name="banner"
              control={control}
              rules={{
                required: "Banner is required",
                validate: value => {
                  if (!value) {
                    return "Logo is required"
                  }
                  if (value === "/images/dapp_banner_placeholder.svg") return "Please upload a banner"
                },
              }}
              render={({ field: { value } }) => (
                <FormControl isInvalid={!!errors.banner}>
                  <FormLabel>{t("Banner")}</FormLabel>
                  <VStack w="full" align={"flex-start"}>
                    <Image
                      alignSelf={"center"}
                      onClick={() => uploadBannerRef.current?.click()}
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
                      <FormHelperText>{t("Recommended size: 150x200px")}</FormHelperText>
                    )}
                    <UploadFileButton mt={4} alignSelf={"flex-end"} onChange={onDrop("banner")} ref={uploadBannerRef} />
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
