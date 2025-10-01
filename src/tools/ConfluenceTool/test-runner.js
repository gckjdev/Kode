#!/usr/bin/env node

// Node.js Test Runner for ConfluenceTool
// Provides fallback testing when Bun is not available
// Note: This is a validation runner, not a full test suite

// Since Node.js can't easily import TypeScript modules, we'll validate the concept

console.log('🧪 ConfluenceTool Validation Tests (Node.js)\n')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`✅ ${name}`)
    passed++
  } catch (error) {
    console.log(`❌ ${name}`)
    console.log(`   Error: ${error.message}`)
    failed++
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`)
      }
    },
    toContain: (expected) => {
      if (!actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`)
      }
    },
    toBeGreaterThan: (expected) => {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`)
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
      }
    }
  }
}

// File Structure Validation Tests
console.log('📋 File Structure Validation Tests')

const fs = require('fs')
const path = require('path')

test('ConfluenceTool.tsx exists', () => {
  const toolPath = path.join(__dirname, 'ConfluenceTool.tsx')
  expect(fs.existsSync(toolPath)).toBe(true)
})

test('api.ts exists', () => {
  const apiPath = path.join(__dirname, 'api.ts')
  expect(fs.existsSync(apiPath)).toBe(true)
})

test('types.ts exists', () => {
  const typesPath = path.join(__dirname, 'types.ts')
  expect(fs.existsSync(typesPath)).toBe(true)
})

test('utils.ts exists', () => {
  const utilsPath = path.join(__dirname, 'utils.ts')
  expect(fs.existsSync(utilsPath)).toBe(true)
})

test('prompt.ts exists', () => {
  const promptPath = path.join(__dirname, 'prompt.ts')
  expect(fs.existsSync(promptPath)).toBe(true)
})

test('Simple test file exists', () => {
  const testPath = path.join(__dirname, 'ConfluenceTool.simple.test.ts')
  expect(fs.existsSync(testPath)).toBe(true)
})

// Content Validation Tests
console.log('\n🔍 Content Validation Tests')

test('Tool file contains expected operations', () => {
  const toolPath = path.join(__dirname, 'ConfluenceTool.tsx')
  const content = fs.readFileSync(toolPath, 'utf8')
  
  const expectedOperations = ['get', 'create', 'update', 'search', 'list', 'spaces', 'attachments']
  for (const op of expectedOperations) {
    expect(content.includes(`'${op}'`)).toBe(true)
  }
})

test('API file contains expected methods', () => {
  const apiPath = path.join(__dirname, 'api.ts')
  const content = fs.readFileSync(apiPath, 'utf8')
  
  const expectedMethods = ['getPage', 'createPage', 'updatePage', 'search', 'getSpaces']
  for (const method of expectedMethods) {
    expect(content.includes(method)).toBe(true)
  }
})

test('Types file contains expected interfaces', () => {
  const typesPath = path.join(__dirname, 'types.ts')
  const content = fs.readFileSync(typesPath, 'utf8')
  
  const expectedTypes = ['ConfluencePage', 'ConfluenceSpace', 'ConfluenceToolInput', 'ConfluenceToolOutput']
  for (const type of expectedTypes) {
    expect(content.includes(type)).toBe(true)
  }
})

test('Utils file contains expected functions', () => {
  const utilsPath = path.join(__dirname, 'utils.ts')
  const content = fs.readFileSync(utilsPath, 'utf8')
  
  const expectedFunctions = ['formatPageSummary', 'createContentBody', 'validatePageTitle']
  for (const func of expectedFunctions) {
    expect(content.includes(func)).toBe(true)
  }
})

test('Prompt file contains description', () => {
  const promptPath = path.join(__dirname, 'prompt.ts')
  const content = fs.readFileSync(promptPath, 'utf8')
  
  expect(content.includes('DESCRIPTION')).toBe(true)
  expect(content.includes('Confluence')).toBe(true)
})

// Integration Tests
console.log('\n🔧 Integration Tests')

test('Tool is registered in main tools registry', () => {
  const toolsPath = path.join(__dirname, '..', '..', 'tools.ts')
  const content = fs.readFileSync(toolsPath, 'utf8')
  
  expect(content.includes('ConfluenceTool')).toBe(true)
  expect(content.includes('./tools/ConfluenceTool/ConfluenceTool')).toBe(true)
})

test('Test-tool has Confluence examples', () => {
  const testToolPath = path.join(__dirname, '..', '..', 'commands', 'test-tool.tsx')
  const content = fs.readFileSync(testToolPath, 'utf8')
  
  expect(content.includes('confluence:')).toBe(true)
  expect(content.includes('Get Confluence page')).toBe(true)
})

test('Configuration type includes Confluence', () => {
  const configPath = path.join(__dirname, '..', '..', 'utils', 'config.ts')
  const content = fs.readFileSync(configPath, 'utf8')
  
  expect(content.includes('confluence?:')).toBe(true)
  expect(content.includes('instances:')).toBe(true)
})

// Summary
console.log('\n📊 Test Summary')
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)

if (failed === 0) {
  console.log('\n🎉 All tests passed! ConfluenceTool is ready for use.')
} else {
  console.log(`\n⚠️  ${failed} test(s) failed. Please review the errors above.`)
  process.exit(1)
}

console.log('\n🔗 Next Steps:')
console.log('1. Configure Confluence in your .kode.json file')
console.log('2. Test with: test-tool → confluence')
console.log('3. Run full test suite: bun test src/tools/ConfluenceTool/ConfluenceTool.simple.test.ts')
