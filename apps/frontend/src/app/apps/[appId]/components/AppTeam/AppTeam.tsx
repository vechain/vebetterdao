import { Avatar, Box, Button, Card, CardBody, CardHeader, Heading, Stack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { RiTwitterXFill } from "react-icons/ri"

type TeamMember = {
  address: string
  role: string
}
type AppTeamProps = {
  teamMembers: TeamMember[]
}
export const AppTeam = ({ teamMembers }: AppTeamProps) => {
  const { t } = useTranslation()
  return (
    <Card h="full" w="100%" variant="base">
      <CardHeader>
        <Heading size="md">{t("App Team")}</Heading>
      </CardHeader>
      <CardBody>
        <Stack spacing={5} w="full">
          {teamMembers.map((member, index) => (
            <Box key={index} display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <Avatar />
                <Box pl={3}>
                  <Text fontWeight="bold">{member.address}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {member.role}
                  </Text>
                </Box>
              </Box>
              <Button
                variant="ghost"
                size="sm"
                w="40px"
                h="40px"
                borderWidth="1px"
                borderStyle="solid"
                borderColor="#EFEFEF"
                borderRadius="50%">
                <RiTwitterXFill size={20} color="#000000" />
              </Button>
            </Box>
          ))}
        </Stack>
      </CardBody>
    </Card>
  )
}
