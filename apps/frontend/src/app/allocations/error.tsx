// TODO: generic error page to be designed
"use client" // Error boundaries must be Client Components

import { useEffect } from "react"
import { useTranslation } from "react-i18next"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useTranslation()
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>{t("Something went wrong!")}</h2>
      <button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }>
        {t("Try again")}
      </button>
    </div>
  )
}
