#!/usr/bin/env node

import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { execa } from 'execa'

const projectName = 'create-myrn-app-smoke'
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(scriptDirectory, '..')
const smokeTestRoot = path.join(workspaceRoot, '.smoke-test')
const targetDirectory = path.join(smokeTestRoot, projectName)
const cliPath = path.join(workspaceRoot, 'dist', 'cli.js')
const forwardedArgs = process.argv.slice(2)

async function main() {
  await mkdir(smokeTestRoot, { recursive: true })
  await rm(targetDirectory, { recursive: true, force: true })

  await execa('node', [cliPath, projectName, ...forwardedArgs], {
    cwd: smokeTestRoot,
    stdio: 'inherit',
  })

  console.log()
  console.log(`Smoke test project path: ${targetDirectory}`)
  console.log(`Open it with: cd ${targetDirectory}`)
  console.log()
}

void main().catch((error) => {
  if (error instanceof Error) {
    console.error(error.message)
  } else {
    console.error('Smoke test failed.')
  }

  process.exitCode = 1
})
