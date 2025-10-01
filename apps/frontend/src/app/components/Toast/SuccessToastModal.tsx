import { Flex, Box, Button, Icon } from "@chakra-ui/react"
import { UilCheckCircle, UilTimes } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

export const SuccessToastModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation()

  return (
    <Flex
      maxWidth="500px"
      minWidth="300px"
      width="auto"
      padding="16px"
      gap="8px"
      borderRadius="lg"
      alignItems="center"
      border="1px solid"
      borderColor="#3DBA67"
      background="#E9FDF1">
      <Icon as={UilCheckCircle} color="#3DBA67" boxSize={6} />
      <Box flex="1" color="#047857" fontWeight="500">
        {t("Grant application saved successfully.")}
      </Box>
      <Button
        variant="ghost"
        onClick={onClose}
        color="#3DBA67"
        _hover={{ bg: "transparent" }}
        minW="auto"
        h="auto"
        p="0">
        <Icon as={UilTimes} color="#3DBA67" boxSize={6} />
      </Button>
    </Flex>
  )
}
