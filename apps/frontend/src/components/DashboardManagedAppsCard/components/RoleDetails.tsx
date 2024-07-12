import { Heading, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const RoleDetails = ({ isAdmin, isModerator }: { isAdmin: boolean; isModerator: boolean }) => {
  const { t } = useTranslation()

  const role = useMemo(() => {
    if (isAdmin) {
      return "Admin"
    } else if (isModerator) {
      return "Moderator"
    } else {
      return "Error"
    }
  }, [isAdmin, isModerator])

  return (
    <VStack bg={`#F8F8F8`} py={6} px={3} h="full" w="full" borderRadius={"2xl"} align="flex-start">
      <Heading fontSize="24px">{role}</Heading>
      <Text fontSize={"sm"} color={"gray.500"}>
        {t("Role")}
      </Text>
    </VStack>
  )
}
