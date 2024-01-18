import * as readline from "readline"

export const askUserForInput = async (
  question: string,
  isSensitive = false,
  defaultValue?: string,
): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  if (isSensitive) {
    const listener = (char: string, key: any) => {
      if (key && key.name !== "enter" && key.name !== "return" && key.name !== "backspace") {
        readline.moveCursor(process.stdout, -1, 0)
        process.stdout.write("*")
      }
    }
    process.stdin.on("keypress", listener)

    rl.on("close", () => {
      process.stdin.removeListener("keypress", listener)
    })
  }

  let answer: string | undefined
  try {
    answer = await new Promise<string>((resolve, reject) => {
      rl.question(question, (res: string) => {
        if (!res && defaultValue) {
          res = defaultValue
          if (!isSensitive) process.stdout.write(`Using default value '${defaultValue}'\n`)
        }
        if (!res || res.trim() === "") reject(Error("No input provided"))
        resolve(res.trim())
      })
    })
    return answer
  } finally {
    process.stdout.write("\n")
    rl.close()
  }
}
