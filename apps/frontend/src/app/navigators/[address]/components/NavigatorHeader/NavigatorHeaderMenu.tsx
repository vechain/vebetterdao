import { IconButton, Menu, Portal } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaEllipsisVertical } from "react-icons/fa6"
import { LuLogOut, LuPencil, LuShare2 } from "react-icons/lu"

type Props = {
  isDelegatedHere: boolean
  isOwnPage: boolean
  onExitDelegation: () => void
  onShareClick: () => void
  onEditProfile: () => void
}

export const NavigatorHeaderMenu = ({
  isDelegatedHere,
  isOwnPage,
  onExitDelegation,
  onShareClick,
  onEditProfile,
}: Props) => {
  const { t } = useTranslation()

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <IconButton variant="subtle" rounded="full" size="sm" aria-label="More options">
          <FaEllipsisVertical />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content bg={{ base: "white", _dark: "#2D3748" }}>
            {isOwnPage && (
              <Menu.Item value="edit-profile" cursor="pointer" onClick={onEditProfile}>
                <LuPencil />
                {t("Edit Profile")}
              </Menu.Item>
            )}
            {isDelegatedHere && (
              <Menu.Item value="exit-delegation" cursor="pointer" onClick={onExitDelegation}>
                <LuLogOut />
                {t("Exit Delegation")}
              </Menu.Item>
            )}
            <Menu.Item value="share" cursor="pointer" onClick={onShareClick}>
              <LuShare2 />
              {t("Share")}
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}
