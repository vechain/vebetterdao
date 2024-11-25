"use client"
import { useState, useEffect } from "react"

/**
 * Load a script from a url and return the loaded state of the script
 * @param url  the url of the script to load
 * @param isAsync  if the script should be loaded async
 * @param beforeInitScript  a function to call before init the script
 * @returns  the loaded state of the script
 */
export const useScript = (url: string, isAsync = true, runBeforeInit?: () => void, runAfterInit?: () => void) => {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)
  }, [url, isAsync, runBeforeInit, runAfterInit])

  return { loaded }
}
