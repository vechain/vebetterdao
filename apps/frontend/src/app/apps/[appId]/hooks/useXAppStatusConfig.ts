import { XAppStatus } from "@/types"
import { UilCheckCircle, UilExclamationCircle } from "@iconscout/react-unicons"
import { TFunction } from "i18next"
import { useTranslation } from "react-i18next"

type ConfigType = {
  title: string
  description: string
  backgroundColor: string
  color: string
  icon: typeof UilExclamationCircle | typeof UilCheckCircle
}

const getStatusConfig = (t: TFunction): Partial<Record<XAppStatus, ConfigType>> => {
  return {
    [XAppStatus.LOOKING_FOR_ENDORSEMENT]: {
      title: t("Looking for endorsement"),
      description: "This app needs to be endorsed by Node holders to qualify for allocation rounds.",
      backgroundColor: "status.positive.subtle",
      color: "status.positive.primary",
      icon: UilExclamationCircle,
    },
    [XAppStatus.ENDORSED_AND_ELIGIBLE]: {
      title: t("Endorsed and active"),
      description:
        "This app has enough score and will participate in upcoming allocation rounds, if not already included.",
      backgroundColor: "status.positive.subtle",
      color: "status.positive.primary",
      icon: UilCheckCircle,
    },
    [XAppStatus.UNENDORSED_AND_ELIGIBLE]: {
      title: t("In grace period"),
      description:
        "This app lost its score and is in a 2-week grace period until {{gracePeriodEndDate}}. It will participate in allocation rounds during this time, but must be re-endorsed ahead of the round starting after that date to continue participating.",
      backgroundColor: "status.warning.subtle",
      color: "status.warning.primary",
      icon: UilExclamationCircle,
    },
    [XAppStatus.UNENDORSED_NOT_ELIGIBLE]: {
      title: t("Endorsement lost"),
      description: "This app lost its score and will not participate in allocation rounds until it is endorsed again.",
      backgroundColor: "status.negative.subtle",
      color: "status.negative.primary",
      icon: UilExclamationCircle,
    },
    [XAppStatus.BLACKLISTED]: {
      title: t("Blacklisted"),
      description:
        "This app was blacklisted by the community and will not join future allocation rounds while blacklisted.",
      backgroundColor: "bg.primary",
      color: "text.subtle",
      icon: UilExclamationCircle,
    },
  }
}

export const useXAppStatusConfig = () => {
  const { t } = useTranslation()
  return getStatusConfig(t)
}
