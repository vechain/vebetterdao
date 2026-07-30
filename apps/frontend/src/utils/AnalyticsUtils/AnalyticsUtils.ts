import { getPublicEnv } from "@repo/config"
import mixpanel, { Dict } from "mixpanel-browser"
import * as uuid from "uuid"
let isInitialized = false
export interface Properties {
  [key: string]: unknown
}
/**
 * Initialise the analytics library with the mixpanel token
 */
export const initialise = () => {
  const token = getPublicEnv("NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN")
  if (token) {
    mixpanel.init(token, {
      track_pageview: true,
      ignore_dnt: true,
      api_host: "https://api-eu.mixpanel.com",
    })
    mixpanel.identify(uuid.v4())
    isInitialized = true
    console.info("Mixpanel initialized")
  } else {
    console.warn("Analytics not enabled")
  }
}
/**
 *  Track an event
 * @param event  The name of the event
 * @param properties  Additional properties to track
 */
export const trackEvent = (event: string, properties?: Properties): void => {
  try {
    // const securitySettings = getSecuritySettings(getState())
    if (isInitialized) {
      mixpanel.track(event, properties)
    } else {
      console.warn("Analytics not initialized or enabled")
    }
  } catch (e) {
    console.warn("Error tracking event", e)
  }
}
/**
 *  Track a page view
 * @param page  The name of the page
 * @param properties  Additional properties to track
 */
export const trackPage = (page: string, properties?: Dict): void => {
  try {
    // const securitySettings = getSecuritySettings(getState())

    if (isInitialized) {
      mixpanel.track_pageview({ page, ...properties })
    } else {
      console.warn("Analytics not initialized or enabled")
    }
  } catch (e) {
    console.warn("Error tracking page", e)
  }
}

export default {
  initialise,
  trackEvent,
  trackPage,
}
