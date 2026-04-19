#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Command } from 'commander'

import { createApp } from './actions/create-app.js'
import { CreateMyrnAppError, toErrorMessage } from './utils/errors.js'
import { logger } from './utils/logger.js'

interface CliOptions {
  packageName?: string
  bundleId?: string
}

async function main(): Promise<void> {
  const program = new Command()

  program
    .name('create-myrn-app')
    .description('Bootstrap a React Native project from the MyRN template.')
    .version(getPackageVersion())
    .showHelpAfterError()
    .showSuggestionAfterError()
    .argument('<project-name>', 'Project directory name')
    .option('--package-name <package-name>', 'Custom Android package name (reverse-DNS format)')
    .option('--bundle-id <bundle-id>', 'Custom iOS bundle identifier (reverse-DNS format)')
    .action(async (projectName: string, options: CliOptions) => {
      await createApp(projectName, options)
    })

  await program.parseAsync(process.argv)
}

void main().catch((error: unknown) => {
  logger.error(toErrorMessage(error))

  if (error instanceof CreateMyrnAppError && error.suggestion) {
    logger.info(error.suggestion)
  }

  process.exitCode = 1
})

function getPackageVersion(): string {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
  const packageJsonPath = path.resolve(currentDirectory, '..', 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
    version?: string
  }

  return packageJson.version ?? '0.0.0'
}
