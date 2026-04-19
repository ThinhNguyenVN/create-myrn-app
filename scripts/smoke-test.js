#!/usr/bin/env node

import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'

import { execa } from 'execa'

const smokeRootDirectory = path.resolve('.smoke-test')
const targetDirectory = path.join(smokeRootDirectory, 'create-myrn-app-smoke')
const cliPath = path.resolve('dist', 'cli.js')
const forwardedArgs = process.argv.slice(2)

async function main() {
  await rm(smokeRootDirectory, { recursive: true, force: true })
  await mkdir(smokeRootDirectory, { recursive: true })

  await execa('node', [cliPath, 'create-myrn-app-smoke', ...forwardedArgs], {
    cwd: smokeRootDirectory,
    env: {
      ...process.env,
      CREATE_MYRN_APP_DISPLAY_DIR: path.join('.smoke-test', 'create-myrn-app-smoke'),
    },
    stdio: 'inherit',
  })
}

void main().catch((error) => {
  if (error instanceof Error) {
    console.error(error.message)
  } else {
    console.error('Smoke test failed.')
  }

  process.exitCode = 1
})
