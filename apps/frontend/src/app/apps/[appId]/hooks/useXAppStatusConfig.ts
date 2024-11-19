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
      description: "This app needs to be endorsed by Node holders to enter allocation rounds.",
      backgroundColor: "#FFF3E5",
      color: "#F29B32",
      icon: UilExclamationCircle,
    },
    [XAppStatus.ENDORSED_AND_ELIGIBLE]: {
      title: t("Endorsed and active"),
      description:
        "This app has enough score and will participate in the next allocation rounds, if not already included.",
      backgroundColor: "#E9FDF1",
      color: "#3DBA67",
      icon: UilCheckCircle,
    },
    [XAppStatus.UNENDORSED_AND_ELIGIBLE]: {
      title: t("In grace period"),
      description:
        "This app lost its score and must be re-endorsed by the end of {{roundReference}} to continue participating in allocation rounds.",
      backgroundColor: "#FFF3E5",
      color: "#F29B32",
      icon: UilExclamationCircle,
    },
    [XAppStatus.UNENDORSED_NOT_ELIGIBLE]: {
      title: t("Endorsement lost"),
      description: "This app lost its score and won’t participate in allocation rounds until it gets endorsed again.",
      backgroundColor: "#FCEEF1",
      color: "#C84968",
      icon: UilExclamationCircle,
    },
  }
}

export const useXAppStatusConfig = () => {
  const { t } = useTranslation()
  return getStatusConfig(t)
}
