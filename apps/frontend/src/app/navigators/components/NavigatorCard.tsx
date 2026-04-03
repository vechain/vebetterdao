import { Badge, Button, Card, HStack, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { LuShield, LuUsers } from "react-icons/lu"

import { NavigatorEntityFormatted } from "@/api/indexer/navigators/useNavigators"
import { AddressButton } from "@/components/AddressButton"

const formatter = getCompactFormatter(2)

type Props = {
  navigator: NavigatorEntityFormatted
  onDelegate?: () => void
}

export const NavigatorCard = ({ navigator, onDelegate }: Props) => {
  const isActive = navigator.status === "ACTIVE"

  return (
    <Card.Root variant="outline" w="full" borderRadius="xl">
      <Card.Body>
        <VStack gap={3} align="stretch">
          <HStack justify="space-between" align="start">
            <HStack gap={2}>
              <LuShield size={20} />
              <AddressButton address={navigator.address} size="sm" showAddressIcon={false} />
            </HStack>
            <HStack gap={1}>
              <Text textStyle="sm" fontWeight="bold">
                {formatter.format(Number(navigator.stakeFormatted))}
              </Text>
              <Text textStyle="sm" color="fg.muted">
                {"B3TR"}
              </Text>
            </HStack>
          </HStack>

          {!isActive && (
            <Badge colorPalette={navigator.status === "EXITING" ? "yellow" : "red"} size="sm" w="fit-content">
              {navigator.status}
            </Badge>
          )}

          <Text textStyle="sm" color="fg.muted" lineClamp={2} minH="40px">
            {navigator.metadataURI || "No description provided"}
          </Text>

          <HStack justify="space-between" align="center">
            <HStack gap={3}>
              <HStack gap={1}>
                <LuUsers size={14} />
                <Text textStyle="xs" color="fg.muted">
                  {navigator.citizenCount}
                  {" citizens"}
                </Text>
              </HStack>
              <Text textStyle="xs" color="fg.muted">
                {formatter.format(Number(navigator.totalDelegatedFormatted))}
                {" VOT3"}
              </Text>
            </HStack>
            {isActive && (
              <Button size="sm" variant="outline" onClick={onDelegate}>
                {"Delegate"}
              </Button>
            )}
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
