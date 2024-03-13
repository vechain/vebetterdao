import { useState, useEffect } from "react"

/**
 * Load a script from a url and return the loaded state of the script
 * @param url  the url of the script to load
 * @param isAsync  if the script should be loaded async
 * @param beforeInitScript  a function to call before init the script
 * @returns  the loaded state of the script
 */
export const useScript = (
    url: string,
    isAsync = true,
    runBeforeInit?: () => void,
    runAfterInit?: () => void,
) => {
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        runBeforeInit?.()
        const script = document.createElement("script")
        script.src = url
        script.addEventListener("load", () => setLoaded(true))
        script.defer = true
        script.async = isAsync

        document.head.appendChild(script)

        runAfterInit?.()
        return () => {
            document.head.removeChild(script)
        }
    }, [url, isAsync, runBeforeInit, runAfterInit])

    return { loaded }
}
