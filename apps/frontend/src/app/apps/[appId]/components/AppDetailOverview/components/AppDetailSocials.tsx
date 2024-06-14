import { HStack, IconButton, Link } from "@chakra-ui/react"
import { FaDiscord, FaMedium, FaTelegram, FaYoutube } from "react-icons/fa6"
import { RiTwitterXFill } from "react-icons/ri"

export type Social = {
  name: string
  url: string
}

const SocialIconMap = {
  Twitter: RiTwitterXFill,
  Discord: FaDiscord,
  Telegram: FaTelegram,
  Youtube: FaYoutube,
  Medium: FaMedium,
}

const SocialIconColorMap = {
  Twitter: "#000000",
  Discord: "#5865F2",
  Telegram: "#0088cc",
  Youtube: "#FF0000",
  Medium: "#000000",
}

export const AppDetailSocials = ({ socialUrls }: { socialUrls: Social[] }) => {
  return (
    <HStack>
      {socialUrls.map(socialUrl => {
        const SocialIcon = SocialIconMap[socialUrl.name as keyof typeof SocialIconMap]
        const socialIconColor = SocialIconColorMap[socialUrl.name as keyof typeof SocialIconColorMap]
        return (
          <Link key={socialUrl.name} href={socialUrl.url} target="_blank" rel="noreferrer">
            <IconButton
              aria-label={socialUrl.name}
              icon={<SocialIcon size={"16px"} color={socialIconColor} />}
              border="1px solid #EFEFEF"
              bg="#FFFFFF"
              rounded="full"
              _hover={{ bg: "#FBFBFB" }}
            />
          </Link>
        )
      })}
    </HStack>
  )
}
