# create-myrn-app

CLI tool to bootstrap a new React Native app from the [`ThinhNguyenVN/MyRN`](https://github.com/ThinhNguyenVN/MyRN) template.

## Branch naming

Use branch names in this format:

- `feat/<description>`
- `fix/<description>`
- `issue/<description>`
- `release/<description>`

Examples:

- `feat/branch-name-rule`
- `fix/template-config-rewrite`
- `issue/123-publish-flow`
- `release/v1-0-0`

Generate a valid branch name from the helper script:

```bash
npm run branch:create -- feat branch name rule
npm run branch:create -- fix template config rewrite
npm run branch:create -- issue 123 publish flow
npm run branch:create -- release v1 0 0
```

Validate the current branch manually:

```bash
npm run check:branch-name
```

## Features

- Clone the MyRN template into a new folder
- Remove the template git history and initialize a fresh git repository
- Update `template.config.json` automatically:
  - `appName`
  - `slug`
  - `appId` mapped to both `packageName` and `bundleId`
- Install dependencies with `npm` or `yarn`
- Print clear next steps when the app is ready

## Usage

```bash
npx create-myrn-app myApp
```

Override the display name, slug, or native app id when needed:

```bash
# custom app id for both Android + iOS
npx create-myrn-app myApp --app-id com.company.myapp

# custom app name, slug auto-generated from app name
npx create-myrn-app myApp --app-name "My Custom App"

# custom slug, app name auto-generated from slug
npx create-myrn-app myApp --slug my-custom-app
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

Run a one-command local smoke test:

```bash
npm run smoke:test
```

The smoke test creates the generated project in:

```bash
tmp/smoke-test
```

This directory is ignored by git.

Smoke test with custom identifiers:

```bash
npm run smoke:test -- --app-id com.company.demo
```

Smoke test with custom app name or slug:

```bash
npm run smoke:test -- --app-name "Smoke Test App"
npm run smoke:test -- --slug smoke-test-app
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

## GitHub Actions publish workflow

The repository includes a manual GitHub Actions workflow named `Publish Package`.

It:
- lets you choose `patch`, `minor`, or `major`
- only allows publishing from the `main` branch
- runs `npm version <level>`
- builds and validates the package
- verifies npm authentication with `npm whoami`
- blocks the publish if the bumped version already exists on npm
- publishes to npm
- ensures a `v<version>` git tag exists for the published release
- pushes the version commit and git tag back to `main`

### Required setup

Create this repository secret in GitHub:

- `NPM_TOKEN`

The token should be an npm access token with permission to publish the `create-myrn-app` package.

### Recommended repository settings

- allow GitHub Actions to create and approve pull requests if your repo policy requires it
- keep the default `GITHUB_TOKEN` permission for `contents: write` so the workflow can push the version commit and tag

### How to use it

1. Open **Actions** in GitHub
2. Select **Publish Package**
3. Click **Run workflow**
4. Make sure the branch selector is set to `main`
5. Choose one of:
   - `patch`
   - `minor`
   - `major`
