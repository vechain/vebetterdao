import { Box, Card, CardBody, CardHeader, Circle, Flex, Heading, Progress, Stack, Text } from "@chakra-ui/react"
import { UilAngleRightB, UilCheckCircle } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

export const AppInfoProgressCard = () => {
  const { t } = useTranslation()
  const percentage = 75
  return (
    <Card h="full" w="100%" borderRadius="12px">
      <CardHeader>
        <Heading fontSize="24px" fontWeight="bold">
          {t("Complete dApp info")}
        </Heading>
        <Text pt={2} color="gray.600">
          {t("By completing all the details you have a higher chance of being endorsed and voted by allocations.")}
        </Text>
      </CardHeader>
      <CardBody>
        <Stack spacing={5} w="full">
          <Box display="inline-flex" w="full" alignItems="center" justifyContent="space-between">
            <Text px={1} fontWeight={600}>
              {percentage}
              {t("%")}
            </Text>
            <Progress
              sx={{
                "& > div": {
                  backgroundColor: "#B1F16C",
                },
              }}
              w={"90%"}
              size="sm"
              value={percentage}
              borderRadius={"50px"}
            />
          </Box>

          <InfoChecklist />
        </Stack>
      </CardBody>
    </Card>
  )
}

const InfoChecklist = () => {
  const { t } = useTranslation()
  const listItems = [
    { label: t("Add a profile photo"), completed: true },
    { label: t("Add a banner"), completed: true },
    { label: t("Add social links"), completed: false },
    { label: t("Add screenshots"), completed: false },
  ]

  return (
    <>
      {listItems.map((item, index) => (
        <Flex
          key={index}
          justify="space-between"
          align="center"
          p={3.5}
          borderWidth="1px"
          borderRadius="12px"
          borderColor="gray.200">
          <Flex align="center">
            <Box mr={3}>
              {item.completed ? (
                <UilCheckCircle color="#004CFC" />
              ) : (
                <Circle ml={0.5} size="20px" borderWidth={"2px"} borderColor="#757575" />
              )}
            </Box>
            <Text fontSize="md" fontWeight={item.completed ? "400" : "600"}>
              {item.label}
            </Text>
          </Flex>
          {!item.completed ? <UilAngleRightB color="#004CFC" /> : null}
        </Flex>
      ))}
    </>
  )
}
