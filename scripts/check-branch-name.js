#!/usr/bin/env node

import { execSync } from 'node:child_process'

const allowedPattern = /^(feat|fix|issue|release)\/[a-z0-9._-]+$/
const automationPattern = /^cursor\/[a-z0-9._/-]+$/

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
  console.log(`Branch "${branchName}" is allowed.`)
  process.exit(0)
}

if (allowedPattern.test(branchName)) {
  console.log(`Branch "${branchName}" is allowed.`)
  process.exit(0)
}

// Keep automation-compatible branches from blocking current agent workflows.
if (automationPattern.test(branchName)) {
  console.warn(
    `Branch "${branchName}" is allowed for automation only. Use feat/, fix/, issue/, or release/ for regular work.`,
  )
  process.exit(0)
}

console.error(
  [
    `Invalid branch name: "${branchName}".`,
    'Use one of these prefixes: feat/, fix/, issue/, release/.',
    'Example: feat/login-screen, fix/auth-token-refresh, or release/v1.2.0.',
  ].join(' '),
)
process.exit(1)
