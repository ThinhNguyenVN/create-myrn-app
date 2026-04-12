# create-myrn-app

CLI tool to bootstrap a new React Native app from the [`ThinhNguyenVN/MyRN`](https://github.com/ThinhNguyenVN/MyRN) template.

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
