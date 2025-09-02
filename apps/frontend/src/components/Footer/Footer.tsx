"use client"
import { VStack, Text, Container, HStack, Box, Link, Flex } from "@chakra-ui/react"
import { BeBetterVeBetterIcon } from "../Icons"
import { DiscordButton } from "./components/DiscordButton"
import { TelegramButton } from "./components/TelegramButton"
import { FreshDeskButton } from "./components/FreshDeskButton"
import { Socials } from "./components/Socials"
import { PRIVACY_POLICY_LINK, TERMS_AND_CONDITIONS_LINK } from "@/constants"
import { useTranslation } from "react-i18next"
import { LanguageSelector } from "./components/LanguageSelector"
import packageJson from "../../../package.json"
import dayjs from "dayjs"

export const Footer: React.FC = () => {
  const { t } = useTranslation()
  const currentYear = dayjs().format("YYYY")

  const desktopContent = (
    <VStack hideBelow="md">
      <HStack justifyContent={"space-between"} w="full" gap={4} my={4}>
        <Box my={14}>
          <BeBetterVeBetterIcon
            beBetterProps={{
              width: "80%",
            }}
            veBetterProps={{
              width: "100%",
            }}
          />
        </Box>
        <VStack gap={4} alignItems={"flex-end"}>
          <DiscordButton />
          <TelegramButton />
          <FreshDeskButton />
          <LanguageSelector />
        </VStack>
      </HStack>
      <HStack
        justifyContent={"space-between"}
        alignItems={"flex-start"}
        w="full"
        borderTopColor={"#3e3c3a"}
        borderTopWidth={1}
        py={8}>
        <VStack align={"start"}>
          <Text textStyle="sm" color="#8c8c8c">
            {t("{{currentYear}} VeBetterDAO. All rights reserved.", { currentYear })}
          </Text>
          <Text textStyle="sm" color="#8c8c8c">
            {t("Version")} {packageJson.version}
          </Text>
        </VStack>
        <HStack gap={4}>
          <Link href={PRIVACY_POLICY_LINK} target="_blank" rel="noopener noreferrer">
            <Text textStyle="sm" color="#8c8c8c" as="u" cursor={"pointer"}>
              {t("Privacy & Policy")}
            </Text>
          </Link>
          <Link href={TERMS_AND_CONDITIONS_LINK} target="_blank" rel="noopener noreferrer">
            <Text textStyle="sm" color="#8c8c8c" as="u" cursor={"pointer"}>
              {t("Terms & Conditions")}
            </Text>
          </Link>
        </HStack>
        <Socials />
      </HStack>
    </VStack>
  )

  const mobileContent = (
    <VStack hideFrom="md">
      <VStack gap={4} my={4}>
        <Box my={8}>
          <BeBetterVeBetterIcon
            beBetterProps={{
              width: "80%",
            }}
            veBetterProps={{
              width: "100%",
            }}
          />
        </Box>
        <VStack gap={4} alignItems={"center"}>
          <DiscordButton />
          <TelegramButton />
          <FreshDeskButton />
          <LanguageSelector />
          <Box mt={6}>
            <Socials />
          </Box>
        </VStack>
      </VStack>
      <VStack borderTopColor={"#3e3c3a"} borderTopWidth={1} py={8}>
        <Link href={PRIVACY_POLICY_LINK} target="_blank" rel="noopener noreferrer">
          <Text textStyle="sm" color="#8c8c8c" as="u" cursor={"pointer"}>
            {t("Privacy & Policy")}
          </Text>
        </Link>
        <Link href={TERMS_AND_CONDITIONS_LINK} target="_blank" rel="noopener noreferrer">
          <Text textStyle="sm" color="#8c8c8c" as="u" cursor={"pointer"}>
            {t("Terms & Conditions")}
          </Text>
        </Link>
        <Text textStyle="sm" color="#8c8c8c" mt={6}>
          {t("{{currentYear}} VeBetterDAO. All rights reserved.", { currentYear })}
        </Text>
        <Text textStyle="sm" color="#8c8c8c">
          {t("Version")} {packageJson.version}
        </Text>
      </VStack>
    </VStack>
  )

  return (
    <Flex bgColor={"#191714"}>
      <Container
        maxW="breakpoint-xl"
        display={"flex"}
        alignItems={"stretch"}
        justifyContent={"flex-start"}
        flexDirection={"column"}>
        {desktopContent}
        {mobileContent}
      </Container>
    </Flex>
  )
}
