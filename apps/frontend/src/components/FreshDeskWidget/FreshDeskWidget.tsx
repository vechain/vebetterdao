// eslint-disable-next-line
// @ts-nocheck
import { useScript } from "@/hooks/useScript"

import React from "react"

const runBeforeInit = (widgetId: number | string) => () => {
    window.fwSettings = {
        widget_id: widgetId,
    }
    if ("function" != typeof window.FreshworksWidget) {
        const n = function (...args) {
            n.q.push(args)
        }
        ;(n.q = []), (window.FreshworksWidget = n)
    }
}

/**
 *  Initialize FreshDesk widget loading a script
 * @returns React.ReactNode
 */
type Props = {
    widgetId: number | string
}
export const FreshDeskWidget: React.FC<Props> = ({ widgetId }) => {
    console.log("process.env", process.env.NODE_ENV)
    useScript(
        `https://euc-widget.freshworks.com/widgets/${widgetId}.js`,
        true,
        runBeforeInit(widgetId),
    )

    return <></>
}
