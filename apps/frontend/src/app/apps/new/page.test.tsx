import { expect, test } from "vitest"
import NewApp from "./page"
import { render, screen } from "../../../../test"

test("NewApp", async () => {
  render(<NewApp />)
  expect(await screen.findByTestId("new-app")).toBeInTheDocument()
})
