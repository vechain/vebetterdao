"use client"
import { VStack, Text, Container, HStack, Box, Show, Link, Flex } from "@chakra-ui/react"
import { BeBetterVeBetterIcon } from "../Icons"
import { DiscordButton } from "./components/DiscordButton"
import { TelegramButton } from "./components/TelegramButton"
import { FreshDeskButton } from "./components/FreshDeskButton"
import { Socials } from "./components/Socials"
import { PRIVACY_POLICY_LINK, TERMS_AND_CONDITIONS_LINK } from "@/constants"
import { useTranslation } from "react-i18next"
import { LanguageSelector } from "./components/LanguageSelector"
import { version } from "../../../package.json"

// Use build-time injected version from CI/CD, fallback to package.json for local development
// Strip "v." prefix from git tags (e.g., "v.1.32.0" -> "1.32.0")
const rawVersion = process.env.NEXT_PUBLIC_APP_VERSION || version
const appVersion = rawVersion.replace(/^v\./, "")

export const Footer: React.FC = () => {
  const { t } = useTranslation()

  const desktopContent = (
    <VStack>
      <HStack justifyContent={"space-between"} w="full" spacing={4} my={4}>
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
        <VStack spacing={4} alignItems={"flex-end"}>
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
          <Text fontWeight={400} fontSize="14px" color="#8c8c8c">
            {t("2024 VeBetterDAO. All rights reserved.")}
          </Text>
          <Text fontSize="14px" color="#8c8c8c">
            {t("Version")} {appVersion}
          </Text>
        </VStack>
        <HStack spacing={4}>
          <Link href={PRIVACY_POLICY_LINK} isExternal>
            <Text fontWeight={400} fontSize="14px" lineHeight="17px" color="#8c8c8c" as="u" cursor={"pointer"}>
              {t("Privacy & Policy")}
            </Text>
          </Link>
          <Link href={TERMS_AND_CONDITIONS_LINK} isExternal>
            <Text fontWeight={400} fontSize="14px" lineHeight="17px" color="#8c8c8c" as="u" cursor={"pointer"}>
              {t("Terms & Conditions")}
            </Text>
          </Link>
        </HStack>
        <Socials />
      </HStack>
    </VStack>
  )

  const mobileContent = (
    <VStack>
      <VStack spacing={4} my={4}>
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
        <VStack spacing={4} alignItems={"center"}>
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
        <Link href={PRIVACY_POLICY_LINK} isExternal>
          <Text fontWeight={400} fontSize="14px" lineHeight="17px" color="#8c8c8c" as="u" cursor={"pointer"}>
            {t("Privacy & Policy")}
          </Text>
        </Link>
        <Link href={TERMS_AND_CONDITIONS_LINK} isExternal>
          <Text fontWeight={400} fontSize="14px" lineHeight="17px" color="#8c8c8c" as="u" cursor={"pointer"}>
            {t("Terms & Conditions")}
          </Text>
        </Link>
        <Text fontWeight={400} fontSize="14px" lineHeight="17px" color="#8c8c8c" mt={6}>
          {t("2024 VeBetterDAO. All rights reserved.")}
        </Text>
        <Text fontSize="14px" color="#8c8c8c">
          {t("Version")} {appVersion}
        </Text>
      </VStack>
    </VStack>
  )

  return (
    <Flex bgColor={"#191714"}>
      <Container
        maxW={"container.xl"}
        display={"flex"}
        alignItems={"stretch"}
        justifyContent={"flex-start"}
        flexDirection={"column"}>
        <Show above="md">{desktopContent}</Show>
        <Show below="md">{mobileContent}</Show>
      </Container>
    </Flex>
  )
}
