import { constants, promises as fs } from 'node:fs'
import path from 'node:path'

import { CreateMyrnAppError } from './errors.js'

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

export async function ensureTargetDirectory(targetPath: string): Promise<{
  existedBefore: boolean
}> {
  const exists = await pathExists(targetPath)

  if (!exists) {
    await fs.mkdir(targetPath, { recursive: true })
    return { existedBefore: false }
  }

  const stats = await fs.stat(targetPath)
  if (!stats.isDirectory()) {
    throw new CreateMyrnAppError(`"${targetPath}" already exists and is not a directory.`)
  }

  const entries = await fs.readdir(targetPath)
  if (entries.length > 0) {
    throw new CreateMyrnAppError(`"${path.basename(targetPath)}" already exists and is not empty.`, {
      suggestion: 'Choose a different project name or remove the existing directory first.',
    })
  }

  return { existedBefore: true }
}

export async function removePath(targetPath: string): Promise<void> {
  await fs.rm(targetPath, {
    recursive: true,
    force: true,
  })
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    const rawContent = await fs.readFile(filePath, 'utf8')
    return JSON.parse(rawContent) as T
  } catch (error) {
    throw new CreateMyrnAppError(`Unable to read JSON file at "${filePath}".`, {
      cause: error,
    })
  }
}

export async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
