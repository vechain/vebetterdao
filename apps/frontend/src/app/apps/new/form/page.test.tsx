import { expect, test } from "vitest"
import NewAppForm from "./page"
import { render, screen } from "../../../../../test"

test("NewAppForm", async () => {
  render(<NewAppForm />)
  expect(await screen.findByTestId("new-app-form")).toBeInTheDocument()
})
