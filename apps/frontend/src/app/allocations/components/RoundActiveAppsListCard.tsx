"use client"

import { Card, HStack, Heading, Icon, Badge, VStack, Button, IconButton, Text, Collapsible } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { SmartphoneDevice, NavArrowRight } from "iconoir-react"
import { useState, useMemo } from "react"
import { formatEther } from "viem"

import { AppImage } from "@/components/AppImage/AppImage"
import { SearchField } from "@/components/SearchField/SearchField"

import { AppWithVotes } from "../page"

const INITIAL_DISPLAY_COUNT = 4

const RoundActiveAppCard = ({ id, name, votesReceived }: Pick<AppWithVotes, "id" | "name" | "votesReceived">) => (
  <Button key={id} unstyled asChild>
    <Card.Root
      variant="action"
      border="none"
      display="grid"
      gridTemplateColumns="auto 1fr auto"
      alignItems="center"
      p={{ base: "2", md: "3" }}
      px={{ base: "1", md: "3" }}
      columnGap="4">
      <AppImage boxSize="11" appId={id || ""} flexShrink={0} shape="square" borderRadius="lg" />
      <VStack gap="1" alignItems="start">
        <Text textStyle={{ base: "md", md: "lg" }} color="text.default" fontWeight="semibold">
          {name || "-"}
        </Text>
        <Text textStyle={{ base: "xs", md: "md" }} fontWeight={{ base: "normal", md: "semibold" }}>
          {getCompactFormatter(2).format(Number(formatEther(votesReceived, "gwei")))} {" B3TR"}
        </Text>
      </VStack>
      <IconButton variant="ghost" p="0" minWidth="unset">
        <Icon as={NavArrowRight} boxSize={5} color="icon.default" />
      </IconButton>
    </Card.Root>
  </Button>
)

export const RoundActiveAppsListCard = ({ apps }: { apps: AppWithVotes[] }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return apps

    return apps.filter(app => app.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [apps, searchQuery])

  const visibleApps = isOpen ? filteredApps : filteredApps.slice(0, INITIAL_DISPLAY_COUNT)
  const hasMoreApps = filteredApps.length > INITIAL_DISPLAY_COUNT

  return (
    <Card.Root p={{ base: "4", md: "6" }} gap="6" height="max-content">
      <Card.Header gap="6" p="0">
        <HStack justifyContent="space-between">
          <Heading as={HStack} size="lg" fontWeight="semibold">
            <Icon as={SmartphoneDevice} boxSize="5" color="icon.default" />
            {"Active apps"}
          </Heading>
          <Badge variant="neutral" size="sm" rounded="sm">
            {`${filteredApps.length} ${filteredApps.length === 1 ? "app" : "apps"}`}
          </Badge>
        </HStack>
        <SearchField
          inputProps={{ size: "xl" }}
          placeholder="Search by app name"
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </Card.Header>
      <Card.Body asChild maxHeight="1000px" overflowY="auto">
        <Collapsible.Root open={isOpen} onOpenChange={details => setIsOpen(details.open)}>
          <VStack gap="2" align="stretch">
            {visibleApps.map(app => (
              <RoundActiveAppCard key={app.id} id={app.id} name={app.name} votesReceived={app.votesReceived} />
            ))}

            {hasMoreApps && (
              <>
                <Collapsible.Content>
                  <VStack gap="2" align="stretch">
                    {filteredApps.slice(INITIAL_DISPLAY_COUNT).map(app => (
                      <RoundActiveAppCard key={app.id} id={app.id} name={app.name} votesReceived={app.votesReceived} />
                    ))}
                  </VStack>
                </Collapsible.Content>

                <Collapsible.Trigger asChild>
                  <Button size={{ base: "sm", md: "md" }} variant="link" fontWeight="semibold">
                    <Collapsible.Context>{api => (api.open ? "View less" : "View all")}</Collapsible.Context>
                  </Button>
                </Collapsible.Trigger>
              </>
            )}
          </VStack>
        </Collapsible.Root>
      </Card.Body>
    </Card.Root>
  )
}
