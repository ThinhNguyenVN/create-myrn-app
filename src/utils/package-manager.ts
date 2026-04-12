import path from 'node:path'

import { commandExists } from './command'
import { pathExists, removePath } from './fs'

export type PackageManager = 'npm' | 'yarn'

export async function resolvePackageManager(targetDirectory: string): Promise<PackageManager> {
  const userAgent = process.env.npm_config_user_agent ?? ''

  if (userAgent.startsWith('yarn/')) {
    return 'yarn'
  }

  if (userAgent.startsWith('npm/')) {
    return 'npm'
  }

  const hasYarnLock = await pathExists(path.join(targetDirectory, 'yarn.lock'))
  if (hasYarnLock && (await commandExists('yarn'))) {
    return 'yarn'
  }

  return 'npm'
}

export async function alignLockfiles(
  targetDirectory: string,
  packageManager: PackageManager,
): Promise<void> {
  const lockfilesToRemove =
    packageManager === 'yarn'
      ? ['package-lock.json', 'pnpm-lock.yaml']
      : ['yarn.lock', 'pnpm-lock.yaml']

  await Promise.all(
    lockfilesToRemove.map(async (lockfile) => {
      await removePath(path.join(targetDirectory, lockfile))
    }),
  )
}

export function getInstallCommand(packageManager: PackageManager): {
  command: PackageManager
  args: string[]
} {
  if (packageManager === 'yarn') {
    return {
      command: 'yarn',
      args: ['install'],
    }
  }

  return {
    command: 'npm',
    args: ['install'],
  }
}

export function getStartCommand(packageManager: PackageManager): string {
  return packageManager === 'yarn' ? 'yarn start' : 'npm run start'
}
