// eslint-disable-next-line
// @ts-nocheck
import React, { useState, useEffect } from "react"

import { useScript } from "@/hooks/useScript"
import "./FreshDeskWidget.css"

const runBeforeInit = (widgetId: number | string) => () => {
  window.fwSettings = {
    widget_id: widgetId,
  }
  if ("function" != typeof window.FreshworksWidget) {
    const n = function (...args) {
      n.q.push(args)
    }
    ;((n.q = []), (window.FreshworksWidget = n))
  }
}

/**
 *  Initialize FreshDesk widget with deferred loading
 *  Loads after 5 seconds or on user interaction (scroll, mousemove, click)
 * @returns React.ReactNode
 */
type Props = {
  widgetId: number | string
}

export const FreshDeskWidget: React.FC<Props> = ({ widgetId }) => {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout
    const loadWidget = () => {
      setShouldLoad(true)
      cleanup()
    }

    const cleanup = () => {
      clearTimeout(timeout)
      window.removeEventListener("scroll", loadWidget)
      window.removeEventListener("mousemove", loadWidget)
      window.removeEventListener("click", loadWidget)
      window.removeEventListener("touchstart", loadWidget)
    }

    // Load after 5 seconds
    timeout = setTimeout(loadWidget, 5000)

    // Or load on user interaction
    window.addEventListener("scroll", loadWidget, { once: true, passive: true })
    window.addEventListener("mousemove", loadWidget, { once: true, passive: true })
    window.addEventListener("click", loadWidget, { once: true, passive: true })
    window.addEventListener("touchstart", loadWidget, { once: true, passive: true })

    return cleanup
  }, [])

  useScript(shouldLoad ? `https://euc-widget.freshworks.com/widgets/${widgetId}.js` : "", true, runBeforeInit(widgetId))

  return <></>
}
