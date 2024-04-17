import { expect, test } from "vitest"
import Proposals from "./page"
import { render, screen } from "../../../test"

test("Proposals", async () => {
  render(<Proposals />)
  expect(await screen.findByTestId("proposals")).toBeInTheDocument()
})
