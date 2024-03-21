import { useXAppMetadata } from "@/api"
import { Button, HStack, Icon, Link, Stack } from "@chakra-ui/react"
import { FaDiscord, FaTelegram, FaXTwitter } from "react-icons/fa6"

type Props = {
  appId: string
}
export const AppSocialUrls = ({ appId }: Props) => {
  const { data: appMetadata } = useXAppMetadata(appId)

  const getSocialIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "twitter":
        return FaXTwitter
      case "discord":
        return FaDiscord
      case "telegram":
        return FaTelegram
      default:
        return null
    }
  }

  const getSocialUrlUsername = ({ name, url }: { name: string; url: string }) => {
    switch (name.toLowerCase()) {
      case "twitter":
        return url.replace("https://twitter.com/", "")
      case "discord":
        //replace standard and invitation link
        return url.replace("https://discord.com/invite/", "").replace("https://discord.gg/", "")
      case "telegram":
        return url.replace("https://t.me/", "")
      default:
        return url
    }
  }
  return (
    <Stack direction={["column", "row"]} spacing={4} w="full">
      {appMetadata?.social_urls.map(socialUrl => {
        const socialIcon = getSocialIcon(socialUrl.name)
        const socialUsername = getSocialUrlUsername(socialUrl)
        const icon = !!socialIcon && <Icon as={socialIcon} boxSize={5} />
        return (
          <Button
            key={socialUrl.url}
            {...(icon && {
              leftIcon: icon,
            })}
            as={Link}
            variant="outline"
            href={socialUrl.url}
            isExternal>
            {socialUsername}
          </Button>
        )
      })}
    </Stack>
  )
}
