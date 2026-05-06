"use client"
import { VStack, Text, Container, HStack, Box, Link, Flex, SimpleGrid, Heading } from "@chakra-ui/react"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"

import packageJson from "../../../package.json"
import { buttonClickActions, ButtonClickProperties, buttonClicked } from "../../constants/AnalyticsEvents"
import {
  DISCORD_URL,
  DISCOURSE_URL,
  PRIVACY_POLICY_LINK,
  RESOURCES_URL,
  TELEGRAM_URL,
  TERMS_AND_CONDITIONS_LINK,
  WEBSITE_URL,
} from "../../constants/links"
import AnalyticsUtils from "../../utils/AnalyticsUtils/AnalyticsUtils"
import { BeBetterVeBetterIcon } from "../Icons/BeBetterVeBetterIcon"

// Use build-time injected version from CI/CD, fallback to package.json for local development
// Strip "v." prefix from git tags (e.g., "v.1.32.0" -> "1.32.0")
const rawVersion = process.env.NEXT_PUBLIC_APP_VERSION || packageJson.version
const appVersion = rawVersion.replace(/^v\./, "")

import { LanguageSelector } from "./components/LanguageSelector"
import { Socials } from "./components/Socials"

const openFreshdeskWidget = () => {
  AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.HELP))
  const browserWindow = window as Window &
    typeof globalThis & {
      FreshworksWidget: (command: string, ...args: any[]) => void
    }
  if (browserWindow.FreshworksWidget) {
    browserWindow.FreshworksWidget("open")
  }
}

const FooterLink: React.FC<{ href?: string; onClick?: () => void; children: React.ReactNode }> = ({
  href,
  onClick,
  children,
}) => {
  if (!href) {
    return (
      <Box as="button" onClick={onClick} cursor="pointer" bg="transparent" border="none" p={0} textAlign="left">
        <Text textStyle="sm" fontWeight="bold" color="text.subtle">
          {children}
        </Text>
      </Box>
    )
  }

  const isExternal = href.startsWith("http")

  return (
    <Link
      href={href}
      onClick={onClick}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      cursor="pointer">
      <Text textStyle="sm" fontWeight="bold" color="text.subtle">
        {children}
      </Text>
    </Link>
  )
}

const FooterHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Heading as="h6" textStyle="sm" fontWeight="normal" color="text.subtle" textTransform="uppercase" mb={2}>
    {children}
  </Heading>
)

export const Footer: React.FC = () => {
  const { t } = useTranslation()
  const currentYear = dayjs().format("YYYY")

  const languageColumn = (
    <VStack align="start" gap={1}>
      <FooterHeading>{t("Language")}</FooterHeading>
      <LanguageSelector />
    </VStack>
  )

  const communityColumn = (
    <VStack align="start" gap={1}>
      <FooterHeading>{t("Community")}</FooterHeading>
      <FooterLink
        href={DISCORD_URL}
        onClick={() =>
          AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.JOIN_DISCORD))
        }>
        {t("Discord server")}
      </FooterLink>
      <FooterLink
        href={TELEGRAM_URL}
        onClick={() =>
          AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.JOIN_TELEGRAM))
        }>
        {t("Telegram channel")}
      </FooterLink>
      <FooterLink
        href={DISCOURSE_URL}
        onClick={() =>
          AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.JOIN_DISCOURSE))
        }>
        {t("Discourse forum")}
      </FooterLink>
    </VStack>
  )

  const navigationColumn = (
    <VStack align="start" gap={1}>
      <FooterHeading>{t("Navigation")}</FooterHeading>
      <FooterLink href="/">{t("Dashboard")}</FooterLink>
      <FooterLink href="/apps">{t("Apps")}</FooterLink>
      <FooterLink href="/b3mo-quests">{t("B3MO Quests")}</FooterLink>
      <FooterLink href="/allocations">{t("Allocations")}</FooterLink>
      <FooterLink href="/proposals">{t("Governance")}</FooterLink>
    </VStack>
  )

  const supportColumn = (
    <VStack align="start" gap={1}>
      <FooterHeading>{t("Support")}</FooterHeading>
      <FooterLink onClick={openFreshdeskWidget}>{t("Help")}</FooterLink>
      <FooterLink href={WEBSITE_URL}>{t("Website")}</FooterLink>
      <FooterLink href={RESOURCES_URL}>{t("Resources")}</FooterLink>
    </VStack>
  )

  const bottomBar = (
    <VStack align="start" gap={0} py={4} w="full">
      <HStack justifyContent="space-between" alignItems="center" w="full" py={2} flexWrap="wrap" gap={4}>
        <Text textStyle="sm" color="text.subtle">
          {t("{{currentYear}} VeBetterDAO. All rights reserved.", { currentYear })}
        </Text>
        <Socials />
        <HStack gap={4}>
          <Link href={PRIVACY_POLICY_LINK} target="_blank" rel="noopener noreferrer">
            <Text textStyle="sm" color="text.subtle" textDecoration="underline">
              {t("Privacy & Policy")}
            </Text>
          </Link>
          <Link href={TERMS_AND_CONDITIONS_LINK} target="_blank" rel="noopener noreferrer">
            <Text textStyle="sm" color="text.subtle" textDecoration="underline">
              {t("Terms & Conditions")}
            </Text>
          </Link>
        </HStack>
      </HStack>
      <Text textStyle="xs" color="text.subtle">
        {t("Version")} {appVersion}
      </Text>
    </VStack>
  )

  const desktopContent = (
    <VStack hideBelow="md" w="full">
      <HStack justifyContent="space-between" w="full" alignItems="flex-start" py={10}>
        <Box>
          <BeBetterVeBetterIcon />
        </Box>
        <HStack gap={12} alignItems="flex-start">
          {languageColumn}
          {communityColumn}
          {navigationColumn}
          {supportColumn}
        </HStack>
      </HStack>
      {bottomBar}
    </VStack>
  )

  const mobileContent = (
    <VStack hideFrom="md" w="full" gap={8}>
      <Box pt={9} alignSelf="start">
        <BeBetterVeBetterIcon />
      </Box>
      <SimpleGrid pt={9} columns={2} gap={8} w="full">
        {languageColumn}
        {communityColumn}
        {navigationColumn}
        {supportColumn}
      </SimpleGrid>
      <Socials />
      <VStack borderTopColor="border.secondary" borderTopWidth={1} py={6} w="full" gap={2}>
        <Text textStyle="sm" color="text.secondary">
          {t("{{currentYear}} VeBetterDAO. All rights reserved.", { currentYear })}
        </Text>
        <Text textStyle="xs" color="text.secondary">
          {t("Version")} {appVersion}
        </Text>
        <HStack gap={4}>
          <Link href={PRIVACY_POLICY_LINK} target="_blank" rel="noopener noreferrer">
            <Text textStyle="sm" color="text.secondary" textDecoration="underline">
              {t("Privacy & Policy")}
            </Text>
          </Link>
          <Link href={TERMS_AND_CONDITIONS_LINK} target="_blank" rel="noopener noreferrer">
            <Text textStyle="sm" color="text.secondary" textDecoration="underline">
              {t("Terms & Conditions")}
            </Text>
          </Link>
        </HStack>
      </VStack>
    </VStack>
  )

  return (
    <Flex bgColor="bg.secondary" borderTop="sm" borderColor="border.secondary">
      <Container
        maxW="breakpoint-xl"
        display="flex"
        alignItems="stretch"
        justifyContent="flex-start"
        flexDirection="column">
        {desktopContent}
        {mobileContent}
      </Container>
    </Flex>
  )
}
