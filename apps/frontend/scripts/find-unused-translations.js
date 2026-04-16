#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs")
const path = require("path")
const vm = require("vm")

const translationFileArg = process.argv[2] || path.join("apps", "frontend", "src", "i18n", "languages", "en.json")
const translationFile = path.resolve(translationFileArg)
const roots = process.argv.slice(3).map(root => path.resolve(root))
const searchRoots = roots.length > 0 ? roots : inferDefaultRoots(translationFile)
const validExtensions = new Set([".ts", ".tsx", ".js", ".jsx"])
const ignoreDirs = new Set(["node_modules", ".next", "dist", "build", "coverage", ".git"])

function inferDefaultRoots(file) {
  const defaults = []
  const dirname = path.dirname(file)
  const relativeDir = path.relative(process.cwd(), dirname)
  const parts = relativeDir.split(path.sep).filter(Boolean)

  let baseSegments = null
  const srcIndex = parts.lastIndexOf("src")
  const testIndex = parts.lastIndexOf("test")
  if (srcIndex > -1) baseSegments = parts.slice(0, srcIndex)
  else if (testIndex > -1) baseSegments = parts.slice(0, testIndex)

  if (baseSegments) {
    const base = path.resolve(process.cwd(), ...baseSegments)
    for (const candidate of [path.join(base, "src"), path.join(base, "test")]) {
      if (!defaults.includes(candidate)) defaults.push(candidate)
    }
  }

  if (!defaults.length) {
    defaults.push(dirname)
  }

  return defaults
}

function readJson(file) {
  const absPath = path.resolve(file)
  if (path.isAbsolute(file) || file.includes('..')) {
    throw new Error(`Invalid file path`)
  }
  const raw = fs.readFileSync(absPath, "utf8")
  try {
    return JSON.parse(raw)
  } catch (error) {
    throw new Error(`Failed to parse ${absPath}: ${error.message}`)
  }
}

function collectKeys(source) {
  const stack = [{ value: source, prefix: "" }]
  const keys = new Set()
  while (stack.length) {
    const { value, prefix } = stack.pop()
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [key, nested] of Object.entries(value)) {
        const next = prefix ? `${prefix}.${key}` : key
        stack.push({ value: nested, prefix: next })
      }
    } else if (typeof value === "string") {
      keys.add(prefix)
    }
  }
  return keys
}

function decodeLiteral(quote, body) {
  if (quote === "`" && body.includes("${")) return null
  try {
    return vm.runInNewContext(`${quote}${body}${quote}`)
  } catch {
    return null
  }
}

function scanFile(filePath, keyUsage) {
  const content = fs.readFileSync(filePath, "utf8")
  const callPattern = /\b(?:i18n\.)?t\s*\(\s*(["'`])((?:\\.|(?!\1)[\s\S])*)\1/gm
  const transPattern = /i18nKey\s*=\s*\{?\s*(["'`])((?:\\.|(?!\1)[\s\S])*)\1\s*}?/gm

  let match
  while ((match = callPattern.exec(content)) !== null) {
    const literal = decodeLiteral(match[1], match[2])
    if (literal && keyUsage.has(literal)) {
      keyUsage.set(literal, true)
    }
  }

  while ((match = transPattern.exec(content)) !== null) {
    const literal = decodeLiteral(match[1], match[2])
    if (literal && keyUsage.has(literal)) {
      keyUsage.set(literal, true)
    }
  }
}

function walk(dir, visitor) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (ignoreDirs.has(entry.name)) continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, visitor)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name)
      if (validExtensions.has(ext)) {
        visitor(fullPath)
      }
    }
  }
}

function main() {
  if (!fs.existsSync(translationFile)) {
    console.error(`Translation file not found: ${translationFile}`)
    process.exit(1)
  }

  const translations = readJson(translationFile)
  const keys = collectKeys(translations)
  const keyUsage = new Map(Array.from(keys, key => [key, false]))

  const processedRoots = searchRoots.filter(root => fs.existsSync(root))
  if (processedRoots.length === 0) {
    const attempted = [...new Set(searchRoots)].map(root => path.relative(process.cwd(), root) || ".")
    console.error(`No search roots found. Checked: ${attempted.join(", ")}`)
    process.exit(1)
  }

  for (const root of processedRoots) {
    walk(root, filePath => scanFile(filePath, keyUsage))
  }

  const unused = []
  const used = []
  for (const [key, flag] of keyUsage.entries()) {
    if (flag) used.push(key)
    else unused.push(key)
  }

  console.log(`Checked ${keyUsage.size} keys in ${translationFile}`)
  console.log(`   Used: ${used.length}`)
  console.log(`   Unused: ${unused.length}`)

  if (unused.length) {
    console.log("\nUnused keys:")
    for (const key of unused) console.log(` - ${key}`)
    process.exitCode = 2
  }
}

main()
