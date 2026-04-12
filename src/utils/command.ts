import { execa } from 'execa'

export async function runCommand(
  command: string,
  args: string[],
  options: {
    cwd: string
  },
): Promise<void> {
  await execa(command, args, {
    cwd: options.cwd,
    stdio: 'inherit',
  })
}

export async function commandExists(command: string): Promise<boolean> {
  try {
    await execa(command, ['--version'], {
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
}
