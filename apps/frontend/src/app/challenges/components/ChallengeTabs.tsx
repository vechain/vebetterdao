"use client"

import { Bleed, Box, Tabs } from "@chakra-ui/react"
import NextLink from "next/link"
import { useRef } from "react"
import { useTranslation } from "react-i18next"

import { ChallengeTab } from "@/api/challenges/types"
import { useStickyState } from "@/hooks/useStickyState"

const tabDefs = [
  { value: "all", labelKey: "All", href: "/challenges/all" },
  { value: "mine", labelKey: "Mine", href: "/challenges/mine" },
  { value: "invited", labelKey: "Invited", href: "/challenges/invited" },
  { value: "public", labelKey: "Public", href: "/challenges/public" },
] as const satisfies ReadonlyArray<{
  value: ChallengeTab
  labelKey: "All" | "Mine" | "Invited" | "Public"
  href: string
}>

export const ChallengeTabs = ({ currentTab, children }: { currentTab: ChallengeTab; children: React.ReactNode }) => {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isStuck = useStickyState(sentinelRef)
  const { t } = useTranslation()

  return (
    <>
      <Box ref={sentinelRef} h="1px" />
      <Tabs.Root value={currentTab} variant="line" size={{ base: "md", md: "lg" }} w="full">
        <Bleed
          position={{ base: "sticky", md: "static" }}
          top="0"
          zIndex={2}
          inlineStart={{ base: "4", md: "0" }}
          inlineEnd={{ base: "4", md: "0" }}>
          <Tabs.List
            w="full"
            justifyContent={{ base: "space-between", md: "flex-start" }}
            gap={{ base: "0", md: "6" }}
            pt={isStuck ? "3" : undefined}
            px={{ base: "4", md: "0" }}
            bg={isStuck ? "bg.primary" : undefined}>
            {tabDefs.map(tab => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                asChild
                flex={{ base: 1, md: "unset" }}
                justifyContent="center">
                <NextLink href={tab.href}>{t(tab.labelKey)}</NextLink>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Bleed>
        {children}
      </Tabs.Root>
    </>
  )
}
