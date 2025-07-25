import {
  DISCORD_URL,
  EMAIL_URL,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  LINKEDIN_URL,
  TELEGRAM_URL,
  TIKTOK_URL,
  X_TWITTER_URL,
  YOUTUBE_URL,
} from "@/constants"
import { HStack, Icon, Link } from "@chakra-ui/react"
import React from "react"
import {
  FaDiscord,
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTelegram,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6"

const socialLinks = [
  { href: X_TWITTER_URL, icon: FaXTwitter },
  { href: INSTAGRAM_URL, icon: FaInstagram },
  { href: DISCORD_URL, icon: FaDiscord },
  { href: TELEGRAM_URL, icon: FaTelegram },
  { href: TIKTOK_URL, icon: FaTiktok },
  { href: YOUTUBE_URL, icon: FaYoutube },
  { href: LINKEDIN_URL, icon: FaLinkedinIn },
  { href: FACEBOOK_URL, icon: FaFacebookF },
  { href: EMAIL_URL, icon: FaEnvelope },
]

export const Socials: React.FC = () => {
  return (
    <HStack color={"white"} gap={4}>
      {socialLinks.map(({ href, icon }) => (
        <Link key={href} href={href} target="_blank" rel="noopener noreferrer">
          <Icon as={icon} boxSize="22px" cursor={"pointer"} />
        </Link>
      ))}
    </HStack>
  )
}
