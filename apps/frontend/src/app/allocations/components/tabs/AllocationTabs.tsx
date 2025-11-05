"use client"

import { Bleed, Box, Icon, Input, InputGroup, Tabs } from "@chakra-ui/react"
import { Search } from "iconoir-react"
import { useRef } from "react"

import { useStickyState } from "@/hooks/useStickyState"

import { CategoryTabs } from "./CategoryTabs"

export function AllocationTabs() {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isStuck = useStickyState(sentinelRef)

  return (
    <>
      <Box ref={sentinelRef} height="1px" />

      <Tabs.Root defaultValue="tab1" variant="line" size="md" w="full" lazyMount>
        <Bleed position="sticky" top="0" zIndex={100} inlineStart="4" inlineEnd="4">
          <Tabs.List pt={isStuck ? "3" : undefined} px="4" bg={isStuck ? "bg.primary" : undefined}>
            <Tabs.Trigger flex={1} justifyContent="center" value="tab1">
              {"Vote for apps"}
            </Tabs.Trigger>
            <Tabs.Trigger flex={1} justifyContent="center" value="tab2">
              {"Round info"}
            </Tabs.Trigger>
          </Tabs.List>
        </Bleed>
        <Tabs.Content value="tab1" display="flex" flexDirection="column" gap="4">
          <InputGroup
            startElement={<Icon as={Search} boxSize="4" color="text.subtle" />}
            rounded="xl"
            borderColor="border.primary">
            <Input id="allocation-app-filter" placeholder="Search app" />
          </InputGroup>
          <CategoryTabs isStuck={isStuck} />
        </Tabs.Content>
        <Tabs.Content value="tab2">{"Second tab content"}</Tabs.Content>
      </Tabs.Root>
    </>
  )
}
