"use client"

import { Bleed, CheckboxCard, Flex, Heading, Icon, Progress, Tabs, Text } from "@chakra-ui/react"
import { Group } from "iconoir-react"

import { AppImage } from "@/components/AppImage/AppImage"
import { APP_CATEGORIES } from "@/types/appDetails"

export function CategoryTabs({ isStuck }: { isStuck: boolean }) {
  return (
    <>
      <Bleed inlineStart="4" inlineEnd="4">
        <Tabs.Root defaultValue="all" variant="subtle" colorPalette="actions.secondary" size="md">
          <Tabs.List
            w="full"
            overflowY="hidden"
            overflowX="scroll"
            gap="2"
            scrollbar="hidden"
            position="sticky"
            top="52px"
            py={isStuck ? "3" : undefined}
            px="4"
            bg={isStuck ? "bg.primary" : undefined}
            zIndex={50}>
            <Tabs.Trigger key="all" flex={1} justifyContent="center" value="all" minWidth="4rem">
              {"All"}
            </Tabs.Trigger>
            {APP_CATEGORIES.map(({ id, name }) => (
              <Tabs.Trigger key={id} flex={1} justifyContent="center" value={id} minWidth="max-content">
                {name}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Tabs.Content value="all" display="flex" flexDirection="column" gap="4" p="4">
            {Array(20)
              .fill(null)
              .map((_, index) => (
                <CheckboxCard.Root key={index} rounded="lg" p="3" colorPalette="blue">
                  <CheckboxCard.HiddenInput />
                  <CheckboxCard.Control alignItems="center" p="0" gap="3">
                    <CheckboxCard.Indicator rounded="sm" />
                    <AppImage
                      appId={"0x9643ed1637948cc571b23f836ade2bdb104de88e627fa6e8e3ffef1ee5a1739a"}
                      gridRow="1 / 3"
                    />
                    <CheckboxCard.Content gap="0.5">
                      <Heading>{"Mugshot"}</Heading>
                      <Flex w="full" justifyContent="space-between">
                        <Text display="flex" gap="2" textStyle="xs">
                          <Icon as={Group} boxSize="4" />
                          {"255"}
                        </Text>

                        <Text textStyle="xs" fontWeight="bold">
                          {"65%"}
                        </Text>
                      </Flex>

                      <Progress.Root w="full" size="xs" colorPalette="green" mt="1" defaultValue={65}>
                        <Progress.Track rounded="lg">
                          <Progress.Range />
                        </Progress.Track>
                      </Progress.Root>
                    </CheckboxCard.Content>
                  </CheckboxCard.Control>
                </CheckboxCard.Root>
              ))}
          </Tabs.Content>
          <Tabs.Content value="tab1" display="flex" flexDirection="column" gap="4">
            {"First tab content"}
          </Tabs.Content>
          <Tabs.Content value="tab2">{"Second tab content"}</Tabs.Content>
        </Tabs.Root>
      </Bleed>
    </>
  )
}
