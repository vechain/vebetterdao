"use client"

import { Box, Bleed, Tabs } from "@chakra-ui/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRef } from "react"

import { useStickyState } from "@/hooks/useStickyState"

interface TabNavigationProps {
  children: React.ReactNode
}

export function TabNavigation({ children }: TabNavigationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isStuck = useStickyState(sentinelRef)

  const currentTab = searchParams.get("tab") || "vote"

  const handleTabChange = (details: { value: string }) => {
    const params = new URLSearchParams()
    params.set("tab", details.value)
    router.push(`?${params.toString()}`)
  }

  return (
    <>
      <Box ref={sentinelRef} height="1px" />

      <Tabs.Root
        value={currentTab}
        variant="line"
        size={{ base: "md", md: "lg" }}
        w="full"
        lazyMount
        unmountOnExit
        onValueChange={handleTabChange}>
        <Bleed
          position={{ base: "sticky", md: "static" }}
          top="0"
          zIndex={2}
          inlineStart={{ base: "4", md: "0" }}
          inlineEnd={{ base: "4", md: "0" }}>
          <Tabs.List pt={isStuck ? "3" : undefined} px={{ base: "4", md: "0" }} bg={isStuck ? "bg.primary" : undefined}>
            <Tabs.Trigger flex={{ base: 1, md: "unset" }} justifyContent="center" value="vote">
              {"Vote for apps"}
            </Tabs.Trigger>
            <Tabs.Trigger flex={{ base: 1, md: "unset" }} justifyContent="center" value="round">
              {"Round info"}
            </Tabs.Trigger>
          </Tabs.List>
        </Bleed>
        {children}
      </Tabs.Root>
    </>
  )
}
