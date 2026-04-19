import path from 'node:path'

import validatePackageName from 'validate-npm-package-name'

import { CreateMyrnAppError } from './errors.js'

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
  appName: string
  slug: string
  appId: string
}

export interface ProjectMetadataOverrides {
  appName?: string
  slug?: string
  appId?: string
}

const REVERSE_DNS_IDENTIFIER_PATTERN = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/

export function createProjectMetadata(
  projectName: string,
  overrides: ProjectMetadataOverrides = {},
): ProjectMetadata {
  const directoryName = projectName.trim()
  validateDirectoryName(directoryName)

  const words = splitIntoWords(directoryName)
  if (words.length === 0) {
    throw new CreateMyrnAppError('Project name must include at least one alphanumeric character.')
  }

  const defaultSlug = buildSlug(directoryName)
  validateSlug(defaultSlug, projectName)

  const defaultAppName = /[-_]/.test(directoryName)
    ? words.map(capitalize).join(' ')
    : directoryName
  const appNameOverride = normalizeOptionalString(overrides.appName)
  const slugOverride = normalizeOptionalString(overrides.slug)
  const appName = appNameOverride ?? (slugOverride ? buildAppNameFromSlug(slugOverride) : defaultAppName)
  const slug = slugOverride ? buildSlug(slugOverride) : appNameOverride ? buildSlug(appNameOverride) : defaultSlug

  validateNonEmpty(appName, 'app name')
  validateSlug(slug, appNameOverride ?? slugOverride ?? projectName)

  const nativeIdentifier = toNativeIdentifier(words)
  const appId = overrides.appId?.trim() || `com.${nativeIdentifier}`

  validateReverseDnsIdentifier(appId, 'app identifier')

  return {
    directoryName,
    appName,
    slug,
    appId,
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

function validateReverseDnsIdentifier(value: string, label: string): void {
  if (!REVERSE_DNS_IDENTIFIER_PATTERN.test(value)) {
    throw new CreateMyrnAppError(`Invalid ${label}: "${value}".`, {
      suggestion: `Use a reverse-DNS identifier like "com.example.app" for the ${label}.`,
    })
  }
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function validateNonEmpty(value: string, label: string): void {
  if (!value.trim()) {
    throw new CreateMyrnAppError(`Invalid ${label}: value cannot be empty.`)
  }
}

function buildSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildAppNameFromSlug(value: string): string {
  const words = value
    .split(/[^a-zA-Z0-9]+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (words.length === 0) {
    throw new CreateMyrnAppError(`Invalid slug: "${value}".`, {
      suggestion: 'Use letters, numbers, or separators like "-" and "_".',
    })
  }

  return words.map(capitalize).join(' ')
}

function validateSlug(value: string, source: string): void {
  if (!value) {
    throw new CreateMyrnAppError(`"${source}" cannot be converted into a valid slug.`, {
      suggestion: 'Use letters, numbers, dashes, or underscores for the app name or slug.',
    })
  }

  const validation = validatePackageName(value)
  if (!validation.validForNewPackages) {
    throw new CreateMyrnAppError(`"${source}" cannot be converted into a valid slug.`, {
      suggestion: 'Use letters, numbers, dashes, or underscores for the app name or slug.',
    })
  }
}
