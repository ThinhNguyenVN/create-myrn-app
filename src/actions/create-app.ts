import { promises as fs } from 'node:fs'
import path from 'node:path'

import chalk from 'chalk'
import degit from 'degit'

import { runCommand } from '../utils/command.js'
import { CreateMyrnAppError } from '../utils/errors.js'
import {
  ensureTargetDirectory,
  pathExists,
  readJsonFile,
  removePath,
  writeJsonFile,
} from '../utils/fs.js'
import { logger } from '../utils/logger.js'
import {
  alignLockfiles,
  getInstallCommand,
  getStartCommand,
  resolvePackageManager,
} from '../utils/package-manager.js'
import { createProjectMetadata } from '../utils/project-name.js'

const TEMPLATE_REPOSITORY = 'ThinhNguyenVN/MyRN'

interface PackageJson {
  name?: string
  displayName?: string
  [key: string]: unknown
}

interface AppJson {
  expo?: Record<string, unknown>
}

export async function createApp(projectName: string): Promise<void> {
  const metadata = createProjectMetadata(projectName)
  const targetDirectory = path.resolve(process.cwd(), metadata.directoryName)
  const targetState = await ensureTargetDirectory(targetDirectory)

  logger.start(`Creating ${chalk.cyan(metadata.directoryName)} from the MyRN template...`)

  try {
    await cloneTemplate(targetDirectory)
    await removePath(path.join(targetDirectory, '.git'))
    await updateProjectConfiguration(targetDirectory, metadata)
    await updateBranchNamingScripts(targetDirectory)
    await initializeGitRepository(targetDirectory)

    const packageManager = await resolvePackageManager(targetDirectory)
    await alignLockfiles(targetDirectory, packageManager)

    const installCommand = getInstallCommand(packageManager)
    logger.start(`Installing dependencies using ${chalk.cyan(packageManager)}...`)
    await runCommand(installCommand.command, installCommand.args, {
      cwd: targetDirectory,
    })

    logger.success(`Project ${chalk.cyan(metadata.directoryName)} is ready.`)
    printNextSteps(metadata.directoryName, getStartCommand(packageManager))
  } catch (error) {
    await cleanupOnFailure(targetDirectory, targetState.existedBefore)
    throw normalizeCreateError(error)
  }
}

async function cloneTemplate(targetDirectory: string): Promise<void> {
  try {
    logger.start(`Cloning template from ${chalk.cyan(`https://github.com/${TEMPLATE_REPOSITORY}`)}...`)

    const emitter = degit(TEMPLATE_REPOSITORY, {
      cache: false,
      force: true,
      verbose: false,
    })

    await emitter.clone(targetDirectory)
    logger.success('Template cloned successfully.')
  } catch (error) {
    throw new CreateMyrnAppError('Failed to clone the template repository.', {
      cause: error,
      suggestion: 'Check your internet connection and verify the template repository is reachable.',
    })
  }
}

async function updateProjectConfiguration(
  targetDirectory: string,
  metadata: ReturnType<typeof createProjectMetadata>,
): Promise<void> {
  logger.start('Updating project configuration...')

  const packageJsonPath = path.join(targetDirectory, 'package.json')
  const appJsonPath = path.join(targetDirectory, 'app.json')

  if (!(await pathExists(packageJsonPath))) {
    throw new CreateMyrnAppError('The template is missing package.json.')
  }

  if (!(await pathExists(appJsonPath))) {
    throw new CreateMyrnAppError('The template is missing app.json.')
  }

  const packageJson = await readJsonFile<PackageJson>(packageJsonPath)
  packageJson.name = metadata.packageName
  packageJson.displayName = metadata.displayName
  await writeJsonFile(packageJsonPath, packageJson)

  const appJson = await readJsonFile<AppJson>(appJsonPath)
  const expoConfig = asRequiredObject(appJson.expo, 'Expected "expo" configuration inside app.json.')

  expoConfig.name = metadata.expoName
  expoConfig.slug = metadata.expoSlug
  expoConfig.scheme = metadata.expoScheme
  delete expoConfig.owner
  expoConfig.android = {
    ...asOptionalObject(expoConfig.android),
    package: metadata.androidPackageName,
  }
  expoConfig.ios = {
    ...asOptionalObject(expoConfig.ios),
    bundleIdentifier: metadata.iosBundleIdentifier,
  }
  expoConfig.extra = sanitizeExpoExtra(expoConfig.extra)

  appJson.expo = expoConfig
  await writeJsonFile(appJsonPath, appJson)

  logger.success('Project configuration updated.')
}

async function initializeGitRepository(targetDirectory: string): Promise<void> {
  try {
    logger.start('Initializing a new git repository...')
    await runCommand('git', ['init', '--initial-branch=main'], { cwd: targetDirectory })
    logger.success('Git repository initialized.')
  } catch (error) {
    throw new CreateMyrnAppError('Failed to initialize a new git repository.', {
      cause: error,
      suggestion: 'Make sure git is installed and available on your PATH.',
    })
  }
}

async function cleanupOnFailure(targetDirectory: string, existedBefore: boolean): Promise<void> {
  if (existedBefore) {
    return
  }

  await removePath(targetDirectory)
}

function asRequiredObject(
  value: unknown,
  errorMessage = 'Expected a JSON object.',
): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  throw new CreateMyrnAppError(errorMessage)
}

function asOptionalObject(value: unknown): Record<string, unknown> {
  if (!value) {
    return {}
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  throw new CreateMyrnAppError('Expected a JSON object.')
}

function sanitizeExpoExtra(value: unknown): Record<string, unknown> {
  const extra = asOptionalObject(value)
  const eas = asOptionalObject(extra.eas)

  delete eas.projectId

  if (Object.keys(eas).length > 0) {
    extra.eas = eas
  } else {
    delete extra.eas
  }

  return extra
}

async function updateBranchNamingScripts(targetDirectory: string): Promise<void> {
  const createBranchScriptPath = path.join(targetDirectory, 'scripts', 'create-branch-name.js')
  const checkBranchScriptPath = path.join(targetDirectory, 'scripts', 'check-branch-name.js')

  if (await pathExists(createBranchScriptPath)) {
    await fs.writeFile(createBranchScriptPath, getCreateBranchScriptContent(), 'utf8')
  }

  if (await pathExists(checkBranchScriptPath)) {
    await fs.writeFile(checkBranchScriptPath, getCheckBranchScriptContent(), 'utf8')
  }
}

function getCreateBranchScriptContent(): string {
  return `const allowedTypes = new Set(['feat', 'fix', 'issue', 'release'])

const [, , typeArg, ...nameParts] = process.argv

if (!allowedTypes.has(typeArg)) {
  console.error('Branch type must be one of: feat, fix, issue, release.')
  process.exit(1)
}

const rawName = nameParts.join(' ').trim()

if (!rawName) {
  console.error('Branch description is required. Example: yarn branch:create feat login screen')
  process.exit(1)
}

const slug = rawName
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

if (!slug) {
  console.error('Branch description must contain letters or numbers.')
  process.exit(1)
}

console.log(\`\${typeArg}/\${slug}\`)
`
}

function getCheckBranchScriptContent(): string {
  return `const { execSync } = require('node:child_process')

const allowedPattern = /^(feat|fix|issue|release)\\/[a-z0-9._-]+$/

const candidate =
  process.env.BRANCH_NAME ||
  process.env.GITHUB_HEAD_REF ||
  process.env.GITHUB_REF_NAME ||
  process.env.CI_COMMIT_REF_NAME

let branchName = candidate || ''

if (!branchName) {
  branchName = execSync('git branch --show-current', { encoding: 'utf8' }).trim()
}

if (!branchName) {
  console.error('Unable to determine branch name for validation.')
  process.exit(1)
}

if (branchName === 'main' || branchName === 'master') {
  console.log(\`Branch "\${branchName}" is allowed.\`)
  process.exit(0)
}

if (allowedPattern.test(branchName)) {
  console.log(\`Branch "\${branchName}" is allowed.\`)
  process.exit(0)
}

console.error(
  [
    \`Invalid branch name: "\${branchName}".\`,
    'Use one of these prefixes: feat/, fix/, issue/, release/.',
    'Example: feat/login-screen, fix/auth-token-refresh, or release/v1.2.0.',
  ].join(' '),
)
process.exit(1)
`
}

function normalizeCreateError(error: unknown): CreateMyrnAppError {
  if (error instanceof CreateMyrnAppError) {
    return error
  }

  return new CreateMyrnAppError('Failed to create the application.', {
    cause: error,
  })
}

function printNextSteps(projectName: string, startCommand: string): void {
  const changeDirectoryCommand = chalk.cyan(`cd ${projectName}`)
  const startAppCommand = chalk.cyan(startCommand)
  const runAndroidCommand = chalk.cyan('npx expo run:android')
  const runIosCommand = chalk.cyan('npx expo run:ios')

  console.log()
  console.log(chalk.green('Success! Your React Native app is ready.'))
  console.log()
  console.log('Next steps:')
  console.log(`  ${changeDirectoryCommand}`)
  console.log(`  ${startAppCommand}`)
  console.log(`  ${runAndroidCommand}`)
  console.log(`  ${runIosCommand}`)
  console.log()
}
