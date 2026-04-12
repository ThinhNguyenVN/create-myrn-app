# create-myrn-app

CLI tool to bootstrap a new React Native app from the [`ThinhNguyenVN/MyRN`](https://github.com/ThinhNguyenVN/MyRN) template.

## Branch naming

Use branch names in this format:

- `feat/<description>`
- `fix/<description>`
- `issue/<description>`

Examples:

- `feat/branch-name-rule`
- `fix/template-config-rewrite`
- `issue/123-publish-flow`

Generate a valid branch name from the helper script:

```bash
npm run branch:create -- feat branch name rule
npm run branch:create -- fix template config rewrite
npm run branch:create -- issue 123 publish flow
```

Validate the current branch manually:

```bash
npm run check:branch-name
```

## Features

- Clone the MyRN template into a new folder
- Remove the template git history and initialize a fresh git repository
- Update app metadata automatically:
  - `package.json` → `name`, `displayName`
  - `app.json` → `expo.name`, `expo.slug`, `expo.scheme`
  - `app.json` → `android.package`, `ios.bundleIdentifier`
- Install dependencies with `npm` or `yarn`
- Print clear next steps when the app is ready

## Usage

```bash
npx create-myrn-app myApp
```

## Project structure

```text
src/
  actions/
    create-app.ts
  utils/
    command.ts
    errors.ts
    fs.ts
    logger.ts
    package-manager.ts
    project-name.ts
  cli.ts
```

## Development

```bash
npm install
npm run prepare
npm run build
npm run typecheck
```

Run the built CLI locally:

```bash
node dist/cli.js myApp
```

## Publish checklist

Before publishing to npm, bump the package version first:

```bash
npm run release:patch
# or
npm run release:minor
# or
npm run release:major
```

Then publish:

```bash
npm publish
```
