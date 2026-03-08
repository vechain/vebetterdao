"use client"

import dynamic from "next/dynamic"

const RunRelayer = dynamic(() => import("./RunRelayer").then(m => m.RunRelayer), {
  ssr: false,
})

export default function RunPage() {
  return <RunRelayer />
}
