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
      description: t("This app needs to be endorsed by X-node holders to enter allocation rounds."),
      backgroundColor: "#FFF3E5",
      color: "#F29B32",
      icon: UilExclamationCircle,
    },
    [XAppStatus.ENDORSED_NOT_ELIGIBLE]: {
      title: t("Endorsed"),
      description: t("This app has enough score and will participate in the next allocation rounds."),
      backgroundColor: "#E9FDF1",
      color: "#3DBA67",
      icon: UilCheckCircle,
    },
    [XAppStatus.ENDORSED_AND_ELIGIBLE]: {
      title: t("Endorsed and active"),
      description: t("This app has enough score and is participating in allocation rounds."),
      backgroundColor: "#E9FDF1",
      color: "#3DBA67",
      icon: UilCheckCircle,
    },
    [XAppStatus.UNENDORSED_AND_ELIGIBLE]: {
      title: t("In grace period"),
      description: t(
        "This app will participate in allocation rounds #X and #X. After that, it will only continue to participate if it has enough endorsement score.",
      ), // TODO check copy and figure out calculation
      backgroundColor: "#FFF3E5",
      color: "#F29B32",
      icon: UilExclamationCircle,
    },
    [XAppStatus.UNENDORSED_NOT_ELIGIBLE]: {
      title: t("Endorsement lost"),
      description: t(
        "This app lost its score and won’t participate in allocation rounds until it gets endorsed again.",
      ),
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
