import { XApp } from "@/api"
import { WalletAddressInput } from "@/app/components/Input"
import { CategorySelector } from "@/components/CategorySelector"
import {
  AVG_PHONE_WIDTH,
  BANNER_UPLOAD_GUIDELINES,
  LOGO_UPLOAD_GUIDELINES,
  notFoundImage,
  VE_WOLRD_SCALING_FACTOR,
  VEWORLD_BANNER_UPLOAD_GUIDELINES,
} from "@/constants"
import { blobToBase64 } from "@/utils/BlobUtils"
import { Button, Card, Field, Heading, Image, InputGroup, Stack, Text, VStack } from "@chakra-ui/react"
import { ChangeEvent, useCallback, useRef } from "react"
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
import { useTranslation } from "react-i18next"

import { AddressIcon } from "../AddressIcon"
import { FormItem, genericValidation, patternUrlCheck } from "../CustomFormFields"
import { UploadFileButton } from "../UploadFileButton"
import { VeWorldFeaturedImageGuidelines } from "./VeWorldFeaturedImageGuidelines"

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
  distributionStrategy: string
  categories: string[]
  treasuryWalletAddress: string
  adminWalletAddress: string
  ve_world_banner: string
  ve_world_featured_image: string
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
  const uploadLogoRef = useRef<HTMLButtonElement>(null)
  const uploadBannerRef = useRef<HTMLButtonElement>(null)
  const uploadVeWorldBannerRef = useRef<HTMLButtonElement>(null)
  const uploadVeWorldFeaturedImageRef = useRef<HTMLButtonElement>(null)
  const computedWidth = Math.min(window.innerWidth, AVG_PHONE_WIDTH) / VE_WOLRD_SCALING_FACTOR

  // handle image uploads with validation
  const onDrop = useCallback(
    (image: "logo" | "banner" | "ve_world_banner" | "ve_world_featured_image") =>
      async (event: ChangeEvent<HTMLInputElement>) => {
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

        if (image === "ve_world_banner") {
          clearErrors("ve_world_banner")
          const base64VeWorldBanner = await validateImageUpload(file, setError, "ve_world_banner")
          if (!base64VeWorldBanner) return
          setValue("ve_world_banner", base64VeWorldBanner)
        }

        if (image === "ve_world_featured_image") {
          clearErrors("ve_world_featured_image")
          const base64VeWorldFeaturedImage = await validateImageUpload(file, setError, "ve_world_featured_image")
          if (!base64VeWorldFeaturedImage) return
          setValue("ve_world_featured_image", base64VeWorldFeaturedImage)
        }
      },
    [setError, setValue, clearErrors],
  )

  const treasuryWalletAddress = watch("treasuryWalletAddress")
  const adminWalletAddress = watch("adminWalletAddress")

  return (
    <Card.Root>
      <Card.Header>
        <Heading size="3xl" fontWeight="bold">
          {isEdit ? `Edit App ${editedApp?.name}` : "Create a new App"}
        </Heading>
      </Card.Header>
      <Card.Body>
        <VStack gap={8} w="full">
          <FormItem
            label={t("Name")}
            placeholder={t("Name")}
            description={t("The name of your app.")}
            register={{
              ...register("name", {
                required: "App Name is required",
                minLength: { value: 2, message: t("{{fieldName}} is too short", { fieldName: t("App Name") }) },
                maxLength: { value: 30, message: t("{{fieldName}} is too long", { fieldName: t("App Name") }) },
                validate: value => genericValidation(value, t("App Name")),
              }),
            }}
            error={errors.name?.message}
          />

          <FormItem
            label={t("Description")}
            placeholder={t("Description")}
            description={t("The description and purpose of your app.")}
            type="textarea"
            register={{
              ...register("description", {
                required: "App Description is required",
                minLength: {
                  value: 100,
                  message: t("{{fieldName}} is too short", { fieldName: t("App Description") }),
                },
                maxLength: {
                  value: 1000,
                  message: t("{{fieldName}} is too long", { fieldName: t("App Description") }),
                },
              }),
            }}
            error={errors.description?.message}
          />

          <FormItem
            label={t("Project URL")}
            placeholder={t("Project URL")}
            description={t("The URL of your app's website or repository.")}
            register={{
              ...register("projectUrl", {
                required: "Project URL is required",
                maxLength: { value: 255, message: t("{{fieldName}} is too long", { fieldName: t("Project URL") }) },
                pattern: patternUrlCheck,
              }),
            }}
            error={errors.projectUrl?.message}
          />

          <FormItem
            label={t("How does your app distribute B3TR to the users?")}
            placeholder={t("Distribution Strategy")}
            description={t(
              "Describe how your app distributes rewards. This information will be publicly visible once your app is submitted to VeBetter.",
            )}
            type="textarea"
            register={{
              ...register("distributionStrategy", {
                required: "Distribution Strategy is required",
                minLength: {
                  value: 100,
                  message: t("{{fieldName}} is too short", { fieldName: t("Distribution Strategy") }),
                },
                maxLength: {
                  value: 1000,
                  message: t("{{fieldName}} is too long", { fieldName: t("Distribution Strategy") }),
                },
              }),
            }}
            error={errors.distributionStrategy?.message}
          />

          <CategorySelector
            fieldName="categories"
            register={register}
            setValue={setValue}
            watch={watch}
            registerOptions={{
              required: { value: true, message: t("Categories are required") },
            }}
            error={errors.categories?.message}
          />

          <Field.Root invalid={!treasuryWalletAddress}>
            <Field.Label>{t("Treasury address")}</Field.Label>
            <Text fontSize="xs" color="gray.500" mb={2}>
              {t(`The wallet address where you will receive your app's B3TR`)}
            </Text>
            <InputGroup>
              <WalletAddressInput
                inputGroupProps={{
                  startElement: (
                    <AddressIcon
                      pointerEvents="none"
                      borderRadius={"full"}
                      boxSize={6}
                      minW={6}
                      minH={6}
                      address={treasuryWalletAddress}
                    />
                  ),
                }}
                disabled={isReceiverAddressDisabled}
                rounded={"xl"}
                onAddressResolved={address => setValue("treasuryWalletAddress", address ?? "")}
              />
            </InputGroup>
          </Field.Root>

          <Field.Root invalid={!adminWalletAddress}>
            <Field.Label>{t("Admin address")}</Field.Label>
            <Text fontSize="xs" color="gray.500" mb={2}>
              {t("The wallet address which will be used to manage your app")}
            </Text>
            <InputGroup>
              <WalletAddressInput
                inputGroupProps={{
                  startElement: (
                    <AddressIcon
                      borderRadius={"full"}
                      boxSize={6}
                      minW={6}
                      minH={6}
                      address={adminWalletAddress ?? ""}
                    />
                  ),
                }}
                disabled={isReceiverAddressDisabled}
                rounded={"xl"}
                onAddressResolved={address => setValue("adminWalletAddress", address ?? "")}
              />
            </InputGroup>
          </Field.Root>

          <Stack direction={["column", "row"]} w="full" justify={"space-between"} align={"flex-start"} gap={4}>
            <Controller
              name="logo"
              control={control}
              rules={{
                required: "Logo is required",
                validate: value => {
                  if (!value) {
                    return "Logo is required"
                  }
                  if (value === "/assets/icons/dapp_icon_placeholder.svg") return "Please upload a logo"
                },
              }}
              render={({ field: { value } }) => (
                <Field.Root invalid={!!errors.logo}>
                  <Field.Label>{t("Logo")}</Field.Label>
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
                      <Field.ErrorText>{errors.logo.message}</Field.ErrorText>
                    ) : (
                      <Field.HelperText>{t(LOGO_UPLOAD_GUIDELINES)}</Field.HelperText>
                    )}
                    <UploadFileButton mt={4} alignSelf={"flex-end"} onChange={onDrop("logo")} ref={uploadLogoRef} />
                  </VStack>
                </Field.Root>
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
                  if (value === "/assets/icons/dapp_banner_placeholder.svg") return "Please upload a banner"
                },
              }}
              render={({ field: { value } }) => (
                <Field.Root invalid={!!errors.banner}>
                  <Field.Label>{t("Banner")}</Field.Label>
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
                      <Field.ErrorText>{errors.banner.message}</Field.ErrorText>
                    ) : (
                      <Field.HelperText>{t(BANNER_UPLOAD_GUIDELINES)}</Field.HelperText>
                    )}
                    <UploadFileButton mt={4} alignSelf={"flex-end"} onChange={onDrop("banner")} ref={uploadBannerRef} />
                  </VStack>
                </Field.Root>
              )}
            />
          </Stack>

          <Controller
            name="ve_world_banner"
            control={control}
            rules={{
              required: "VeWorld banner is required",
              validate: value => {
                if (!value) {
                  return "VeWorld banner is required"
                }
              },
            }}
            render={({ field: { value } }) => (
              <Field.Root invalid={!!errors.ve_world_banner}>
                <Field.Label>{t("VeWorld Banner")}</Field.Label>
                <VStack w="full" align="center">
                  <Image
                    onClick={() => uploadVeWorldBannerRef.current?.click()}
                    _hover={{ cursor: "pointer" }}
                    src={value ?? notFoundImage}
                    alt="ve_world_banner"
                    style={{ height: 76, width: computedWidth, borderRadius: 12, overflow: "hidden" }}
                    objectFit="cover"
                  />
                  {errors.ve_world_banner ? (
                    <Field.ErrorText>{errors.ve_world_banner.message}</Field.ErrorText>
                  ) : (
                    <Field.HelperText>{t(VEWORLD_BANNER_UPLOAD_GUIDELINES)}</Field.HelperText>
                  )}
                  <UploadFileButton
                    mt={4}
                    alignSelf={"flex-end"}
                    onChange={onDrop("ve_world_banner")}
                    ref={uploadVeWorldBannerRef}
                  />
                </VStack>
              </Field.Root>
            )}
          />
          <Controller
            name="ve_world_featured_image"
            control={control}
            rules={{
              required: "VeWorld featured image is required",
            }}
            render={({ field: { value } }) => (
              <Field.Root invalid={!!errors.ve_world_featured_image}>
                <Field.Label>{t("VeWorld Featured Image")}</Field.Label>
                <VStack w="full" align="center">
                  <Image
                    onClick={() => uploadVeWorldFeaturedImageRef.current?.click()}
                    _hover={{ cursor: "pointer" }}
                    src={value ?? notFoundImage}
                    alt="ve_world_featured_image"
                    style={{ height: 76, width: computedWidth, borderRadius: 12, overflow: "hidden" }}
                    objectFit="cover"
                  />
                  {errors.ve_world_featured_image ? (
                    <Field.ErrorText>{errors.ve_world_featured_image.message}</Field.ErrorText>
                  ) : (
                    <Field.HelperText>
                      <VeWorldFeaturedImageGuidelines />
                    </Field.HelperText>
                  )}
                  <UploadFileButton
                    mt={4}
                    alignSelf={"flex-end"}
                    onChange={onDrop("ve_world_featured_image")}
                    ref={uploadVeWorldFeaturedImageRef}
                  />
                </VStack>
              </Field.Root>
            )}
          />
        </VStack>
      </Card.Body>
      <Card.Footer display={"flex"} flexDir={"column"} w="full">
        <Button colorPalette="blue" type="submit" size="lg" alignSelf={"flex-end"} borderRadius={"full"}>
          {isEdit ? "Save" : "Submit"}
        </Button>
      </Card.Footer>
    </Card.Root>
  )
}
