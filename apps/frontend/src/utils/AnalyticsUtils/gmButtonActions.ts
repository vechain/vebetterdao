import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"
import { buttonClicked, buttonClickActions, ButtonClickProperties } from "@/constants"
import { UseDisclosureReturn } from "@chakra-ui/react"

export const handleAttachOnClick = (modal: UseDisclosureReturn) => {
  modal.onOpen()
  AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.ATTACH_NOW))
}

export const handleDetachOnClick = (modal: UseDisclosureReturn) => {
  modal.onOpen()
  AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.DETACHING_GM_FROM_XNODE))
}
