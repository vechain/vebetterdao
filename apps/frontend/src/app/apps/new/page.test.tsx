import { expect, test } from "vitest"

import { render, screen } from "../../../../test"

import NewApp from "./page"

test("NewApp", async () => {
  render(<NewApp />)
  expect(await screen.findByTestId("new-app")).toBeInTheDocument()
})
