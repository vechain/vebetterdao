import { expect, test } from "vitest"

import { render, screen } from "../../../../../test"

import NewAppForm from "./page"

test("NewAppForm", async () => {
  render(<NewAppForm />)
  expect(await screen.findByTestId("new-app-form")).toBeInTheDocument()
})
