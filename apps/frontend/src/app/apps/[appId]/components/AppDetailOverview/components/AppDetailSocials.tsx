import { HStack, IconButton, Link } from "@chakra-ui/react"
import { FaDiscord, FaLinkedin, FaMedium, FaTelegram, FaYoutube } from "react-icons/fa6"
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
  Linkedin: FaLinkedin,
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
        if (!SocialIconMap[socialUrl.name as keyof typeof SocialIconMap]) return null
        const SocialIcon = SocialIconMap[socialUrl.name as keyof typeof SocialIconMap]
        const socialIconColor = SocialIconColorMap[socialUrl.name as keyof typeof SocialIconColorMap]
        return (
          <Link key={socialUrl.name} href={socialUrl.url} target="_blank" rel="noreferrer">
            <IconButton
              aria-label={socialUrl.name}
              border="1px solid #EFEFEF"
              bg="#FFFFFF"
              rounded="full"
              _hover={{ bg: "#FBFBFB" }}>
              <SocialIcon size={"16px"} color={socialIconColor} />
            </IconButton>
          </Link>
        )
      })}
    </HStack>
  )
}
