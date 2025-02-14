import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  HStack,
  VStack,
  Text,
  Link,
  Image,
  Box,
} from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

type Props = {
  children: React.ReactNode
  isOpen?: boolean
}

export const SocialLoginTooltip: React.FC<Props> = ({ children, isOpen }) => {
  const { t } = useTranslation()

  return (
    <Popover isOpen={isOpen} trigger="hover" openDelay={40} closeDelay={40} placement="bottom-end">
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent
        paddingRight={10}
        bg="#B1F16C"
        borderColor="#B1F16C"
        borderRadius={14}
        fontSize="sm"
        p={1}
        position="relative">
        <PopoverArrow w={400} h={10} bg="#B1F16C" borderColor="#B1F16C" />
        {/* Background Cloud */}
        <Box position="absolute" inset="0" overflow="hidden" borderRadius={14}>
          <Image
            src="/images/cloud-background.png"
            alt="background"
            mixBlendMode={"color-burn"}
            transform={"rotate(-190deg)"}
            position="absolute"
            right="-30%"
            top="-90%"
            w="80%"
            opacity={0.5}
          />
        </Box>

        <PopoverBody position="relative">
          {/* Ensures content stays above */}
          <HStack spacing={3}>
            {/* Text Content */}
            <VStack spacing={1} flex="1">
              <Text alignSelf={"start"} fontSize="xs" color="#365217">
                {t("NEW LOG IN IS OUT!")}
              </Text>
              <Link fontSize="sm" fontWeight="bold" color="#365217" lineHeight={1.2}>
                {t("Log in with your social media and start earning rewards!")}
              </Link>
            </VStack>

            {/* Social Icons */}
            <HStack spacing={2}>
              <Image src="/images/social-login.png" alt="Social Login Icons" boxSize="64px" />
            </HStack>
          </HStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}
