import { Box, HStack, Link } from "@chakra-ui/react"
import { FaTelegramPlane } from "react-icons/fa"
import { FaWhatsapp } from "react-icons/fa6"
import { RiTwitterXFill } from "react-icons/ri"

const TWITTER_INJECT = "https://twitter.com/intent/tweet?text="
const WHATSAPP_INJECT = "https://wa.me/?text="
const TELEGRAM_INJECT = "https://telegram.me/share/url?url=https://governance.vebetterdao.org&text="
export const ShareButtonsBlue = ({ descriptionEncoded }: { descriptionEncoded: string }) => {
  return (
    <HStack gap={4}>
      <Link href={`${TWITTER_INJECT}${descriptionEncoded}`}>
        <Box bg="#E0E9FE" p={"13px"} borderRadius={"full"}>
          <RiTwitterXFill size={24} color="#004CFC" />
        </Box>
      </Link>
      <Link href={`${WHATSAPP_INJECT}${descriptionEncoded}`}>
        <Box bg="#E0E9FE" p={"13px"} borderRadius={"full"}>
          <FaWhatsapp size={24} color="#004CFC" />
        </Box>
      </Link>
      <Link href={`${TELEGRAM_INJECT}${descriptionEncoded}`}>
        <Box bg="#E0E9FE" p={"13px"} borderRadius={"full"}>
          <FaTelegramPlane size={24} color="#004CFC" />
        </Box>
      </Link>
    </HStack>
  )
}
