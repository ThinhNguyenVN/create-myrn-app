#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Command } from 'commander'

import { createApp } from './actions/create-app.js'
import { CreateMyrnAppError, toErrorMessage } from './utils/errors.js'
import { logger } from './utils/logger.js'

interface CliOptions {
  appName?: string
  slug?: string
  appId?: string
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
    .option('--app-name <app-name>', 'Custom display name written to template.config.json')
    .option('--slug <slug>', 'Custom Expo slug; if omitted it is derived from app name')
    .option(
      '--app-id <app-id>',
      'Custom app identifier used for both Android package name and iOS bundle id (reverse-DNS format)',
    )
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
