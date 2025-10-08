import { Badge, HStack, Icon, Link, Text } from "@chakra-ui/react"
import { UilExclamationCircle } from "@iconscout/react-unicons"
import dayjs from "dayjs"
import { Trans } from "react-i18next"

type EndorsementInfoBadgeProps = {
  endorsementThreshold: number
  endorsementMaxDate: dayjs.Dayjs
  endorsementLost: boolean
}

export const EndorsementInfoBadge = ({
  endorsementThreshold,
  endorsementMaxDate,
  endorsementLost,
}: EndorsementInfoBadgeProps) => {
  return (
    <HStack w="full" flexWrap="wrap">
      <Badge w="full" bg={endorsementLost ? "#FCEEF1" : "#FFF3E5"} borderRadius="12px">
        <HStack p={2}>
          <Icon as={UilExclamationCircle} boxSize={30} color={endorsementLost ? "#C84968" : "#AF5F00"} />
          <Text
            as="span"
            color={endorsementLost ? "#C84968" : "#AF5F00"}
            textTransform="none"
            fontWeight="normal"
            whiteSpace="normal"
            wordBreak="break-word"
            flexWrap="wrap"
            textStyle="sm">
            <Trans
              i18nKey={
                endorsementLost
                  ? "This app lost the endorsement and will not join next allocation. The App will have to reach more than {{endorsementThreshold}} Endorsement score before {{date}} to be included on Allocations rounds. Know more."
                  : "This app won’t join next allocation round. The app will have to reach more than {{endorsementThreshold}} Endorsement score to be included on Allocations rounds. Know more."
              }
              values={{ date: endorsementMaxDate.format("MMM D"), endorsementThreshold }}
              components={{
                Link: <Link color={endorsementLost ? "#C84968" : "#AF5F00"} textDecoration="underline" />,
              }}
            />
          </Text>
        </HStack>
      </Badge>
    </HStack>
  )
}
