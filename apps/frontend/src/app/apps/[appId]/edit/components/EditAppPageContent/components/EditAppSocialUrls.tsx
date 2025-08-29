import { Field, Input, InputGroup, Text, VStack } from "@chakra-ui/react"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { RiTwitterXFill } from "react-icons/ri"
import { FaDiscord, FaMedium, FaTelegram, FaYoutube } from "react-icons/fa6"
import { EditAppForm } from ".."
import { useCurrentAppMetadata } from "@/app/apps/[appId]/hooks"
import { useMemo } from "react"
import { URL_REGEX } from "@/constants"

type Props = {
  form: UseFormReturn<EditAppForm, any, EditAppForm>
}

const findUrlByName = (urls: { name: string; url: string }[] | undefined, name: string) => {
  return urls?.find(url => url.name === name)?.url || ""
}

export const EditAppSocialUrls = ({ form }: Props) => {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
  } = form
  const { appMetadata } = useCurrentAppMetadata()
  const twitterUrl = findUrlByName(appMetadata?.social_urls, "Twitter")
  const discordUrl = findUrlByName(appMetadata?.social_urls, "Discord")
  const telegramUrl = findUrlByName(appMetadata?.social_urls, "Telegram")
  const youtubeUrl = findUrlByName(appMetadata?.social_urls, "Youtube")
  const mediumUrl = findUrlByName(appMetadata?.social_urls, "Medium")

  const inputData = useMemo(() => {
    return [
      {
        inputKey: "twitterUrl",
        url: twitterUrl,
        error: errors.twitterUrl,
        placeholder: t(`Add your x.com link`),
        icon: <RiTwitterXFill />,
      },
      {
        inputKey: "discordUrl",
        url: discordUrl,
        error: errors.discordUrl,
        placeholder: t(`Add your discord link`),
        icon: <FaDiscord color="#7289DA" />,
      },
      {
        inputKey: "telegramUrl",
        url: telegramUrl,
        error: errors.telegramUrl,
        placeholder: t(`Add your telegram link`),
        icon: <FaTelegram color="#0088CC" />,
      },
      {
        inputKey: "youtubeUrl",
        url: youtubeUrl,
        error: errors.youtubeUrl,
        placeholder: t(`Add your youtube link`),
        icon: <FaYoutube color="#FF0000" />,
      },
      {
        inputKey: "mediumUrl",
        url: mediumUrl,
        error: errors.mediumUrl,
        placeholder: t(`Add your medium link`),
        icon: <FaMedium />,
      },
    ]
  }, [
    discordUrl,
    errors.discordUrl,
    errors.mediumUrl,
    errors.telegramUrl,
    errors.twitterUrl,
    errors.youtubeUrl,
    mediumUrl,
    t,
    telegramUrl,
    twitterUrl,
    youtubeUrl,
  ])

  return (
    <VStack align={"stretch"} flex={1.5} gap={4} w="full">
      <Text textStyle="md" fontWeight={500}>
        {t("Social media links")}
      </Text>
      {inputData.map(({ inputKey, url, error, placeholder, icon }) => (
        <Field.Root invalid={!!error} key={inputKey}>
          <InputGroup startElement={icon}>
            <Input
              rounded="full"
              textStyle="sm"
              type="url"
              placeholder={placeholder}
              defaultValue={url}
              {...register(inputKey as any, {
                pattern: {
                  value: URL_REGEX,
                  message: t("Invalid url"),
                },
              })}
            />
          </InputGroup>
          <Field.ErrorText textStyle="xs">{error?.message || ""}</Field.ErrorText>
        </Field.Root>
      ))}
    </VStack>
  )
}
