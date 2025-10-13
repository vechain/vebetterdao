import { Flex, HStack, Text } from "@chakra-ui/react"
import { t } from "i18next"

import { AddressIcon } from "@/components/AddressIcon"

export const EndorsersIcon = ({ endorsers, maxToRender = 3 }: { endorsers: string[]; maxToRender?: number }) => {
  const boxSize = 20
  const marginleft = boxSize / 2
  const endorsersToRender = endorsers.slice(0, maxToRender)
  const remainingEndorsers = endorsers.length - maxToRender
  const otherAppsBoxColor = "#C9EAA3"
  const otherAppsTextColor = "#5C6C4A"
  return (
    <HStack gap={0}>
      {endorsersToRender.map((endorser: string, index: number) => {
        const ml = index > 0 ? `-${marginleft}px` : "0"
        return <AddressIcon key={endorser} address={endorser} rounded="full" boxSize={`${boxSize}px`} ml={ml} />
      })}
      {endorsers.length > maxToRender && (
        <Flex
          zIndex={1}
          boxSize={`${boxSize}px`}
          borderRadius={`full`}
          ml={`-${marginleft}px`}
          bg={otherAppsBoxColor}
          justify={"center"}
          align={"center"}>
          <Text
            fontSize={`${(boxSize ?? 0) / 2}px`}
            fontWeight="semibold"
            data-testid="participating-add-more-apps"
            color={otherAppsTextColor}>
            {t("+{{value}}", { value: remainingEndorsers })}
          </Text>
        </Flex>
      )}
    </HStack>
  )
}
