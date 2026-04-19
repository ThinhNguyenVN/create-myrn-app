#!/usr/bin/env node

import { rm } from 'node:fs/promises'
import path from 'node:path'

import { execa } from 'execa'

const targetDirectory = path.resolve('/tmp', 'create-myrn-app-smoke')
const cliPath = path.resolve('dist', 'cli.js')
const forwardedArgs = process.argv.slice(2)

async function main() {
  await rm(targetDirectory, { recursive: true, force: true })

  await execa('node', [cliPath, 'create-myrn-app-smoke', ...forwardedArgs], {
    cwd: '/tmp',
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
