import { Box, Button, VStack } from "@chakra-ui/react"
import { AppDetailCard } from "./AppDetailCard"
import { FaArrowLeft } from "react-icons/fa6"
import { useRouter } from "next/navigation"

type Props = {
  appId: string
}

export const AppDetailPageContent = ({ appId }: Props) => {
  const router = useRouter()
  const goToDapps = () => {
    router.push("/apps")
  }

  return (
    <VStack w="full" spacing={8} align="flex-start" data-testid={`app-${appId}-detail`}>
      <VStack spacing={4} alignItems={"flex-start"}>
        <Button colorScheme="gray" size="md" variant="outline" leftIcon={<FaArrowLeft />} onClick={goToDapps}>
          Apps
        </Button>
        <AppDetailCard appId={appId} />
      </VStack>
    </VStack>
  )
}
