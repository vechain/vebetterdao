#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

// Configuration
const SRC_DIR = path.join(__dirname, "../src")
const LANGUAGES_DIR = path.join(__dirname, "../src/i18n/languages")
const EN_FILE = path.join(LANGUAGES_DIR, "en.json")

// Load the English translation file
function loadTranslations() {
  if (!fs.existsSync(EN_FILE)) {
    console.error("English translations file not found:", EN_FILE)
    process.exit(1)
  }

  const content = fs.readFileSync(EN_FILE, "utf8")
  return JSON.parse(content)
}

// Get all TypeScript and TSX files
function getAllSourceFiles(dir) {
  const files = []

  function walkDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        walkDir(fullPath)
      } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
        files.push(fullPath)
      }
    }
  }

  walkDir(dir)
  return files
}

// Extract translation keys from a file content
function extractTranslationKeys(content) {
  const keys = new Set()

  // Pattern 1: t('key') or t("key")
  const pattern1 = /\bt\(\s*["'`]([^"'`\)]+)["'`]\s*(?:,|\))/g
  let match
  while ((match = pattern1.exec(content)) !== null) {
    keys.add(match[1])
  }

  // Pattern 2: t('key', {...}) or t("key", {...})
  const pattern2 = /\bt\(\s*["'`]([^"'`]+)["'`]\s*,/g
  while ((match = pattern2.exec(content)) !== null) {
    keys.add(match[1])
  }

  // Pattern 3: Check for template literals with t(`key`)
  const pattern3 = /\bt\(\s*`([^`]+)`\s*(?:,|\))/g
  while ((match = pattern3.exec(content)) !== null) {
    // For template literals, we need to be more careful
    // Only add if it doesn't contain ${} interpolation at the key level
    if (!match[1].includes("${")) {
      keys.add(match[1])
    }
  }

  return Array.from(keys)
}

// Find all used translation keys
function findUsedKeys() {
  const sourceFiles = getAllSourceFiles(SRC_DIR)
  const usedKeys = new Set()

  for (const file of sourceFiles) {
    try {
      const content = fs.readFileSync(file, "utf8")
      const keys = extractTranslationKeys(content)
      keys.forEach(key => usedKeys.add(key))
    } catch (error) {
      console.warn(`Warning: Could not read file ${file}: ${error.message}`)
    }
  }

  return Array.from(usedKeys)
}

// Main function
function main() {
  // Load translations
  const translations = loadTranslations()
  const allKeys = Object.keys(translations)

  // Find used keys
  const usedKeys = findUsedKeys()

  // Find unused keys
  const unusedKeys = allKeys.filter(key => !usedKeys.includes(key))

  if (unusedKeys.length > 0) {
    // Exit with error code for precommit hook
    if (unusedKeys.length > 0) {
      console.error("\n❌ ERROR: Unused translations detected!")
      console.error(`Unused keys:\n${unusedKeys.join("\n")}`)

      process.exit(1)
    } else console.log("No unused translations found")
  }
}

if (require.main === module) {
  main()
}
