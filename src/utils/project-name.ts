import path from 'node:path'

import validatePackageName from 'validate-npm-package-name'

import { CreateMyrnAppError } from './errors'

const RESERVED_DIRECTORY_NAMES = new Set([
  '.',
  '..',
  'con',
  'prn',
  'aux',
  'nul',
  'node_modules',
])

export interface ProjectMetadata {
  directoryName: string
  packageName: string
  displayName: string
  expoName: string
  expoSlug: string
  expoScheme: string
  androidPackageName: string
  iosBundleIdentifier: string
}

export function createProjectMetadata(projectName: string): ProjectMetadata {
  const directoryName = projectName.trim()
  validateDirectoryName(directoryName)

  const words = splitIntoWords(directoryName)
  if (words.length === 0) {
    throw new CreateMyrnAppError('Project name must include at least one alphanumeric character.')
  }

  const packageName = words.map((word) => word.toLowerCase()).join('-')
  const validation = validatePackageName(packageName)
  if (!validation.validForNewPackages) {
    throw new CreateMyrnAppError(`"${projectName}" cannot be converted into a valid package name.`, {
      suggestion: 'Use letters, numbers, dashes, or underscores in the project name.',
    })
  }

  const displayName = /[-_]/.test(directoryName)
    ? words.map(capitalize).join(' ')
    : directoryName
  const nativeIdentifier = toNativeIdentifier(words)

  return {
    directoryName,
    packageName,
    displayName,
    expoName: displayName,
    expoSlug: packageName,
    expoScheme: packageName,
    androidPackageName: `com.${nativeIdentifier}`,
    iosBundleIdentifier: `com.${nativeIdentifier}`,
  }
}

function validateDirectoryName(projectName: string): void {
  if (!projectName) {
    throw new CreateMyrnAppError('Project name is required.')
  }

  if (projectName !== path.basename(projectName)) {
    throw new CreateMyrnAppError('Project name must not include path separators.')
  }

  if (/\s/.test(projectName)) {
    throw new CreateMyrnAppError('Project name must not contain whitespace.', {
      suggestion: 'Use "my-app" or "myApp" instead.',
    })
  }

  if (/[<>:"/\\|?*\u0000-\u001F]/.test(projectName)) {
    throw new CreateMyrnAppError('Project name contains unsupported characters.')
  }

  if (RESERVED_DIRECTORY_NAMES.has(projectName.toLowerCase())) {
    throw new CreateMyrnAppError(`"${projectName}" is a reserved name and cannot be used.`)
  }
}

function splitIntoWords(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

function toNativeIdentifier(words: string[]): string {
  const normalized = words.join('').toLowerCase().replace(/[^a-z0-9]/g, '')

  if (!normalized) {
    return 'app'
  }

  return /^[a-z]/.test(normalized) ? normalized : `app${normalized}`
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}
