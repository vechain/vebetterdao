import { HStack, Icon, Link } from "@chakra-ui/react"
import { IconType } from "react-icons"

type SocialLinkProps = {
  icon: IconType
  href: string
  label: string
  value?: string
}
export const SocialLink: React.FC<SocialLinkProps> = ({ icon, href, label, value }) => {
  return (
    <HStack>
      <Icon as={icon} size="lg" color="icon.subtle" />
      <Link cursor="pointer" color="actions.primary.default" href={href} target="_blank" rel="noopener noreferrer">
        {value || label}
      </Link>
    </HStack>
  )
}
