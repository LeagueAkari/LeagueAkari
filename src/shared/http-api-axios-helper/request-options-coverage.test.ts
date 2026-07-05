import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, test } from 'vitest'

const apiRoot = path.resolve(__dirname)

const ignoredFiles = new Set([
  path.join(apiRoot, 'request-options.ts'),
  path.join(apiRoot, 'request-options.test.ts'),
  path.join(apiRoot, 'request-options-coverage.test.ts'),
  path.join(apiRoot, 'sgp', 'dto.ts'),
  path.join(apiRoot, 'sgp', 'patterns.ts')
])

const ignoredMethods = new Set(['constructor'])

function collectApiFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return collectApiFiles(fullPath)
    }

    if (
      !entry.isFile() ||
      !entry.name.endsWith('.ts') ||
      entry.name.endsWith('.test.ts') ||
      ignoredFiles.has(fullPath)
    ) {
      return []
    }

    return [fullPath]
  })
}

function hasHttpApiConstructor(node: ts.ClassDeclaration) {
  return node.members.some((member) => {
    if (!ts.isConstructorDeclaration(member)) {
      return false
    }

    return member.parameters.some((parameter) => {
      const typeText = parameter.type?.getText()
      return typeText === 'AxiosInstance'
    })
  })
}

function methodUsesOptions(method: ts.MethodDeclaration) {
  let usesOptions = false

  function visit(node: ts.Node) {
    if (
      ts.isPropertyAccessExpression(node) &&
      node.expression.getText() === 'options' &&
      node.name.text === 'signal'
    ) {
      usesOptions = true
      return
    }

    if (
      ts.isCallExpression(node) &&
      node.arguments.some((argument) => ts.isIdentifier(argument) && argument.text === 'options')
    ) {
      usesOptions = true
      return
    }

    ts.forEachChild(node, visit)
  }

  if (method.body) {
    visit(method.body)
  }

  return usesOptions
}

describe('http API request options coverage', () => {
  test('every business API method accepts and uses request options', () => {
    const missing: string[] = []

    for (const filePath of collectApiFiles(apiRoot)) {
      const sourceText = fs.readFileSync(filePath, 'utf8')
      const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true)

      for (const statement of sourceFile.statements) {
        if (!ts.isClassDeclaration(statement) || !hasHttpApiConstructor(statement)) {
          continue
        }

        for (const member of statement.members) {
          if (!ts.isMethodDeclaration(member)) {
            continue
          }

          const methodName = member.name.getText()
          if (ignoredMethods.has(methodName)) {
            continue
          }

          const lastParameter = member.parameters.at(-1)
          if (lastParameter?.name.getText() !== 'options' || !methodUsesOptions(member)) {
            missing.push(`${path.relative(apiRoot, filePath)}:${methodName}`)
          }
        }
      }
    }

    expect(missing).toEqual([])
  })
})
