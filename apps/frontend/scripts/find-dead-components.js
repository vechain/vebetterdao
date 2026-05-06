#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("fs")
const path = require("path")

const ts = require("typescript")

const projectRoot = path.resolve(__dirname, "..")

const defaultDirectories = ["src/components", "src/app/components"]

const args = process.argv.slice(2)
let requestedDirs = []
let outputJson = false
let includeTestsAsUsage = false

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i]
  switch (arg) {
    case "--dir":
    case "-d": {
      const value = args[i + 1]
      if (!value) {
        console.error("Missing value for --dir")
        process.exit(1)
      }
      requestedDirs.push(value)
      i += 1
      break
    }
    case "--json":
      outputJson = true
      break
    case "--include-tests":
      includeTestsAsUsage = true
      break
    case "--help":
    case "-h":
      printHelp()
      process.exit(0)
    default:
      console.error(`Unknown argument: ${arg}`)
      printHelp()
      process.exit(1)
  }
}

if (requestedDirs.length === 0) {
  requestedDirs = defaultDirectories.filter(dir => fs.existsSync(path.resolve(projectRoot, dir)))
  if (requestedDirs.length === 0) {
    console.error("No default component directories found. Please specify at least one with --dir.")
    process.exit(1)
  }
}

const targetDirs = requestedDirs
  .map(dir => {
    const resolvedBase = path.resolve(projectRoot)
    const resolvedTarget = path.resolve(resolvedBase, dir)
    const relativePath = path.relative(resolvedBase, resolvedTarget)
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      console.error("Invalid directory path")
      process.exit(1)
    }
    return normalizePath(resolvedTarget)
  })
  .sort()

const configPath = ts.findConfigFile(projectRoot, ts.sys.fileExists, "tsconfig.json")
if (!configPath) {
  console.error("Unable to find tsconfig.json from project root")
  process.exit(1)
}

const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
if (configFile.error) {
  reportTSDiagnostic(configFile.error)
  process.exit(1)
}

const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configPath))
const program = ts.createProgram({ rootNames: parsedConfig.fileNames, options: parsedConfig.options })

const moduleResolutionCache = ts.createModuleResolutionCache(
  projectRoot,
  ts.sys.useCaseSensitiveFileNames ? s => s : s => s.toLowerCase(),
  parsedConfig.options,
)

const resolutionHost = {
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  directoryExists: ts.sys.directoryExists ? ts.sys.directoryExists : undefined,
  getDirectories: ts.sys.getDirectories ? ts.sys.getDirectories : undefined,
  realpath: ts.sys.realpath ? ts.sys.realpath : undefined,
}

const graph = new Map()
const edgeKinds = new Map()

for (const sourceFile of program.getSourceFiles()) {
  if (!sourceFile || sourceFile.isDeclarationFile) continue
  const filePath = normalizePath(sourceFile.fileName)
  if (!filePath.startsWith(projectRoot)) continue
  if (filePath.includes("node_modules")) continue

  const moduleNode = ensureModule(graph, filePath, targetDirs)
  moduleNode.usesJsx = containsJsx(sourceFile)
  moduleNode.isTestLike = isTestLike(filePath)

  const visit = node => {
    if (ts.isImportDeclaration(node)) {
      if (!isRuntimeImport(node)) {
        return
      }
      const target = resolveSpecifier(node.moduleSpecifier, filePath, "import")
      addEdge(graph, edgeKinds, moduleNode.path, target, "import")
      return
    }

    if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      if (node.isTypeOnly) {
        return
      }
      const target = resolveSpecifier(node.moduleSpecifier, filePath, "re-export")
      addEdge(graph, edgeKinds, moduleNode.path, target, "re-export")
      return
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      const target = resolveSpecifier(node.arguments[0], filePath, "dynamic-import")
      addEdge(graph, edgeKinds, moduleNode.path, target, "dynamic-import")
      return
    }

    ts.forEachChild(node, visit)
  }

  ts.forEachChild(sourceFile, visit)
}

const seeds = []
for (const moduleNode of graph.values()) {
  if (moduleNode.isTarget) continue
  if (!includeTestsAsUsage && moduleNode.isTestLike) continue
  moduleNode.used = true
  seeds.push(moduleNode.path)
}

propagateUsage(graph, seeds, includeTestsAsUsage)

const unusedComponents = []
for (const moduleNode of graph.values()) {
  if (!moduleNode.isTarget) continue
  if (!moduleNode.usesJsx) continue
  if (moduleNode.isTestLike) continue
  if (moduleNode.used) continue

  unusedComponents.push({
    path: path.relative(projectRoot, moduleNode.path),
    importedBy: Array.from(moduleNode.importers).map(importer => ({
      path: path.relative(projectRoot, importer),
      used: Boolean(graph.get(importer) && graph.get(importer).used),
    })),
    referencedVia: describeReferenceKinds(edgeKinds, moduleNode.path),
  })
}

unusedComponents.sort((a, b) => a.path.localeCompare(b.path))

if (outputJson) {
  console.log(JSON.stringify({ unusedComponents }, null, 2))
  process.exit(0)
}

if (unusedComponents.length === 0) {
  console.log("No unused components detected.")
  process.exit(0)
}

console.log(`Unused components (${unusedComponents.length}):`)
for (const entry of unusedComponents) {
  const importerInfo = entry.importedBy.length
    ? `referenced by ${entry.importedBy.map(item => `${item.path}${item.used ? "" : " (unused)"}`).join(", ")}`
    : "not referenced by any tracked module"
  const descriptor = entry.referencedVia.length ? ` via ${entry.referencedVia.join(", ")}` : ""
  console.log(` - ${entry.path} (${importerInfo})${descriptor}`)
}

function printHelp() {
  console.log(
    `Usage: node scripts/find-dead-components.js [options]\n\nOptions:\n  -d, --dir <path>        Component directory to analyze (can repeat)\n  --json                  Output results as JSON\n  --include-tests         Treat tests and stories as usage seeds\n  -h, --help              Show this help message`,
  )
}

function reportTSDiagnostic(diagnostic) {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
  if (diagnostic.file) {
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start || 0)
    console.error(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`)
  } else {
    console.error(message)
  }
}

function normalizePath(p) {
  return path.resolve(p).replace(/\\/g, "/")
}

function isSubPath(child, parent) {
  if (child === parent) return true
  return child.startsWith(parent.endsWith("/") ? parent : `${parent}/`)
}

function ensureModule(graphMap, modulePath, targetDirectories) {
  const existing = graphMap.get(modulePath)
  if (existing) {
    return existing
  }
  const node = {
    path: modulePath,
    imports: new Set(),
    importers: new Set(),
    isTarget: targetDirectories.some(dir => isSubPath(modulePath, dir)),
    usesJsx: false,
    isTestLike: false,
    used: false,
  }
  graphMap.set(modulePath, node)
  return node
}

function resolveSpecifier(moduleSpecifier, fromFile, kind) {
  if (!moduleSpecifier || !ts.isStringLiteralLike(moduleSpecifier)) return null
  const raw = moduleSpecifier.text
  const result = ts.resolveModuleName(raw, fromFile, parsedConfig.options, resolutionHost, moduleResolutionCache)
  const resolved = result.resolvedModule ? result.resolvedModule.resolvedFileName : undefined
  if (!resolved) return null
  const extension = path.extname(resolved)
  if (!extension || ![".ts", ".tsx", ".js", ".jsx"].includes(extension)) {
    return null
  }
  const normalized = normalizePath(resolved)
  if (!normalized.startsWith(projectRoot)) {
    return null
  }
  if (normalized.includes("node_modules")) {
    return null
  }
  if (kind === "re-export" && result.resolvedModule && result.resolvedModule.isExternalLibraryImport) {
    return null
  }
  return normalized
}

function addEdge(graphMap, kindsMap, fromPath, targetPath, kind) {
  if (!targetPath) return
  const fromNode = ensureModule(graphMap, fromPath, targetDirs)
  const toNode = ensureModule(graphMap, targetPath, targetDirs)
  fromNode.imports.add(toNode.path)
  toNode.importers.add(fromNode.path)

  if (!kindsMap.has(toNode.path)) {
    kindsMap.set(toNode.path, new Map())
  }
  const bySource = kindsMap.get(toNode.path)
  if (!bySource.has(fromNode.path)) {
    bySource.set(fromNode.path, new Set())
  }
  bySource.get(fromNode.path).add(kind)
}

function containsJsx(sourceFile) {
  let found = false
  const visit = node => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
      found = true
      return
    }
    ts.forEachChild(node, visit)
  }
  ts.forEachChild(sourceFile, visit)
  return found
}

function isTestLike(filePath) {
  const normalized = filePath.toLowerCase()
  if (normalized.includes("/__tests__/")) return true
  if (normalized.includes("/stories/")) return true
  const endings = [
    ".test.ts",
    ".test.tsx",
    ".spec.ts",
    ".spec.tsx",
    ".stories.tsx",
    ".story.tsx",
    ".stories.ts",
    ".story.ts",
  ]
  return endings.some(ending => normalized.endsWith(ending))
}

function isRuntimeImport(node) {
  const clause = node.importClause
  if (!clause) {
    return true
  }
  if (clause.isTypeOnly) {
    return false
  }
  if (clause.name) {
    return true
  }
  if (!clause.namedBindings) {
    return true
  }
  if (ts.isNamespaceImport(clause.namedBindings)) {
    return true
  }
  if (ts.isNamedImports(clause.namedBindings)) {
    return clause.namedBindings.elements.some(el => !el.isTypeOnly)
  }
  return true
}

function propagateUsage(graphMap, queue, allowTests) {
  const seen = new Set(queue)
  while (queue.length > 0) {
    const currentPath = queue.shift()
    const node = graphMap.get(currentPath)
    if (!node) continue
    for (const dependency of node.imports) {
      const targetNode = graphMap.get(dependency)
      if (!targetNode) continue
      if (!allowTests && targetNode.isTestLike) {
        continue
      }
      if (!targetNode.used) {
        targetNode.used = true
      }
      if (!seen.has(targetNode.path)) {
        seen.add(targetNode.path)
        queue.push(targetNode.path)
      }
    }
  }
}

function describeReferenceKinds(kindsMap, modulePath) {
  const mapping = kindsMap.get(modulePath)
  if (!mapping) return []
  const descriptors = new Set()
  for (const kindSet of mapping.values()) {
    for (const kind of kindSet) {
      descriptors.add(kind)
    }
  }
  return Array.from(descriptors).sort()
}
