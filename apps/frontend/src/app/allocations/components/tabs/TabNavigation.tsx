"use client"

import { Box, Bleed, Tabs } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import NextLink from "next/link"
import { useRef } from "react"
import { useTranslation } from "react-i18next"

import { useBreakpoints } from "@/hooks/useBreakpoints"
import { useStickyState } from "@/hooks/useStickyState"

interface TabNavigationProps {
  children: React.ReactNode
  currentTab: string
}

export function TabNavigation({ children, currentTab }: TabNavigationProps) {
  const { account } = useWallet()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isStuck = useStickyState(sentinelRef)
  const { isMobile } = useBreakpoints()
  const { t } = useTranslation()

  return (
    <>
      <Box ref={sentinelRef} height="1px" />

      <Tabs.Root
        id="allocation-tabs"
        value={currentTab}
        variant="line"
        size={{ base: "md", md: "lg" }}
        w="full"
        unmountOnExit>
        <Bleed
          position={{ base: "sticky", md: "static" }}
          top="0"
          zIndex={2}
          inlineStart={{ base: "4", md: "0" }}
          inlineEnd={{ base: "4", md: "0" }}>
          <Tabs.List pt={isStuck ? "3" : undefined} px={{ base: "4", md: "0" }} bg={isStuck ? "bg.primary" : undefined}>
            <Tabs.Trigger flex={{ base: 1, md: "unset" }} justifyContent="center" value="vote" asChild truncate>
              <NextLink href={isMobile ? "/allocations/vote#allocation-tabs" : "/allocations/vote"}>
                {account?.address ? t("Vote for apps") : t("Round apps")}
              </NextLink>
            </Tabs.Trigger>
            <Tabs.Trigger flex={{ base: 1, md: "unset" }} justifyContent="center" value="round" asChild truncate>
              <NextLink href={isMobile ? "/allocations/round#allocation-tabs" : "/allocations/round"}>
                {t("Round info")}
              </NextLink>
            </Tabs.Trigger>
          </Tabs.List>
        </Bleed>
        {children}
      </Tabs.Root>
    </>
  )
}
