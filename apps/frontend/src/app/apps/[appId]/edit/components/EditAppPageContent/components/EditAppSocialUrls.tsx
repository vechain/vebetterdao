import { Field, Icon, Input, InputGroup, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FaDiscord, FaMedium, FaTelegram, FaYoutube } from "react-icons/fa6"
import { RiTwitterXFill } from "react-icons/ri"

import { URL_REGEX } from "../../../../../../../constants/url"
import { useCurrentAppMetadata } from "../../../../hooks/useCurrentAppMetadata"
import { EditAppForm } from "../EditAppPageContent"

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
        icon: <Icon as={RiTwitterXFill} color="social.twitter" />,
      },
      {
        inputKey: "discordUrl",
        url: discordUrl,
        error: errors.discordUrl,
        placeholder: t(`Add your discord link`),
        icon: <Icon as={FaDiscord} color="social.discord" />,
      },
      {
        inputKey: "telegramUrl",
        url: telegramUrl,
        error: errors.telegramUrl,
        placeholder: t(`Add your telegram link`),
        icon: <Icon as={FaTelegram} color="social.telegram" />,
      },
      {
        inputKey: "youtubeUrl",
        url: youtubeUrl,
        error: errors.youtubeUrl,
        placeholder: t(`Add your youtube link`),
        icon: <Icon as={FaYoutube} color="social.youtube" />,
      },
      {
        inputKey: "mediumUrl",
        url: mediumUrl,
        error: errors.mediumUrl,
        placeholder: t(`Add your medium link`),
        icon: <Icon as={FaMedium} color="social.medium" />,
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
      <Text textStyle="md" fontWeight="semibold">
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
