import { TFunction } from "i18next"
import { useTranslation } from "react-i18next"

import { UserStatus } from "./useWhitelistBlacklistUser"

type UserStatusConfigType = {
  buttonText: string
  buttonColorScheme: string
  modalSuccessTitle: string
  modalPendingTitle: string
  modalErrorTitle: string
}
const getUserStatusConfig = (t: TFunction): Record<UserStatus, UserStatusConfigType> => {
  return {
    [UserStatus.NONE]: {
      buttonText: t("Remove Status"),
      buttonColorScheme: "gray",
      modalSuccessTitle: t("User Status Removed"),
      modalPendingTitle: t("Removing user status..."),
      modalErrorTitle: t("Error removing user status"),
    },
    [UserStatus.WHITELIST]: {
      buttonText: t("Whitelist User"),
      buttonColorScheme: "green",
      modalSuccessTitle: t("User Whitelisted"),
      modalPendingTitle: t("Whitelisting user..."),
      modalErrorTitle: t("Error whitelisting user"),
    },
    [UserStatus.BLACKLIST]: {
      buttonText: t("Blacklist User"),
      buttonColorScheme: "red",
      modalSuccessTitle: t("User Blacklisted"),
      modalPendingTitle: t("Blacklisting user..."),
      modalErrorTitle: t("Error blacklisting user"),
    },
  }
}
export const useUserStatusConfig = () => {
  const { t } = useTranslation()
  return getUserStatusConfig(t)
}
