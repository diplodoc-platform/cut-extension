# AGENTS.md

This file contains instructions for AI agents working with the `@diplodoc/cut-extension` project.

## Common Rules and Standards

**Important**: This package follows common rules and standards defined in the Diplodoc metapackage. When working in metapackage mode, refer to:

- **`.agents/style-and-testing.md`** in the metapackage root for:
  - Code style guidelines
  - **Language requirements** (commit messages, comments, docs MUST be in English)
  - Commit message format (Conventional Commits)
  - Pre-commit hooks rules (**CRITICAL**: Never commit with `--no-verify`)
  - Testing standards
  - Documentation requirements
- **`.agents/core.md`** for core concepts
- **`.agents/monorepo.md`** for workspace and dependency management
- **`.agents/dev-infrastructure.md`** for build and CI/CD

**Note**: In standalone mode (when this package is used independently), these rules still apply. If you need to reference the full documentation, check the [Diplodoc metapackage repository](https://github.com/diplodoc-platform/diplodoc).

## Project Description

`@diplodoc/cut-extension` is a Diplodoc platform extension that provides collapsible sections (cuts) in documentation. It includes both a MarkdownIt transform plugin and a runtime component for interactive behavior.

**Key Features**:

- MarkdownIt transform plugin for processing cut directives in YFM
- Runtime component for interactive cut behavior (expand/collapse)
- SCSS styles for cut appearance
- Support for grouped cuts (mutually exclusive expansion)
- URL hash navigation to specific cuts
- Accessibility features (keyboard navigation, ARIA attributes)

**Primary Use Case**: Enables documentation authors to create collapsible sections that can be expanded or collapsed by users, improving readability and allowing progressive disclosure of information.

## Project Structure

### Main Directories

- `src/` — source code
  - `plugin/` — MarkdownIt transform plugin
    - `index.ts` — main plugin export
    - `plugin.ts` — plugin implementation
    - `transform.ts` — transformation logic
    - `directive.ts` — directive parsing
    - `helpers.ts` — helper functions
    - `utils.ts` — utility functions
    - `const.ts` — constants
  - `runtime/` — browser runtime component
    - `index.ts` — runtime entry point
    - `controller.ts` — cut controller implementation
    - `const.ts` — runtime constants
    - `styles/` — SCSS styles
      - `cut.scss` — cut component styles
- `tests/` — test suite
  - `src/plugin.test.ts` — plugin tests
  - `jest.config.js` — Jest configuration
- `build/` — compiled output (generated)
  - `plugin/` — compiled plugin code
  - `runtime/` — compiled runtime code
- `esbuild/` — build configuration
  - `build.mjs` — esbuild configuration

### Configuration Files

- `package.json` — package metadata and dependencies
- `tsconfig.json` — TypeScript configuration (development)
- `tsconfig.publish.json` — TypeScript configuration (for publishing)
- `CHANGELOG.md` — change log (managed by release-please)
- `CONTRIBUTING.md` — contribution guidelines

## Tech Stack

This package follows the standard Diplodoc platform tech stack. See `.agents/dev-infrastructure.md` and `.agents/style-and-testing.md` in the metapackage root for detailed information.

**Package-specific details**:

- **Language**: TypeScript
- **Build**: esbuild for bundling, tsc for type declarations
- **Testing**: Jest
- **Styling**: SCSS (compiled to CSS)
- **Dependencies**:
  - `@diplodoc/directive` — directive parsing utilities
  - `@diplodoc/utils` — shared utilities
- **Dev Dependencies**:
  - `@diplodoc/lint` — linting infrastructure
  - `@diplodoc/tsconfig` — TypeScript configuration
  - `esbuild` — fast bundler
  - `esbuild-sass-plugin` — SCSS compilation
  - `markdown-it` — Markdown parser (for testing)

## Usage Modes

This package can be used in two different contexts:

### 1. As Part of Metapackage (Workspace Mode)

When `@diplodoc/cut-extension` is part of the Diplodoc metapackage:

- Located at `extensions/cut/` in the metapackage
- Linked via npm workspaces
- Dependencies are shared from metapackage root `node_modules`
- Can be developed alongside other packages
- Changes are immediately available to other packages via workspace linking

**Development in Metapackage**:

```bash
# From metapackage root
cd extensions/cut

# Install dependencies (from root)
npm install

# Build
npm run build

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

### 2. Standalone Mode

When `@diplodoc/cut-extension` is used as a standalone npm package:

- Installed via `npm install @diplodoc/cut-extension`
- All dependencies must be installed locally
- Can be used in any Node.js project

**Usage in Standalone Mode**:

```bash
# Install
npm install @diplodoc/cut-extension

# Use in code
import cutExtension from '@diplodoc/cut-extension';
import '@diplodoc/cut-extension/runtime';
import '@diplodoc/cut-extension/runtime/styles.css';
```

## Build System

The package uses **esbuild** for fast builds:

- **Plugin build** (`build:js`):
  - Entry: `src/plugin/index.ts`
  - Output: `build/plugin/index.js`
  - Bundles plugin code

- **Runtime build** (part of `build:js`):
  - Entry: `src/runtime/index.ts`
  - Output: `build/runtime/index.js` and `build/runtime/index.css`
  - Bundles runtime code and compiles SCSS

- **Type declarations** (`build:declarations`):
  - Uses `tsconfig.publish.json`
  - Output: `build/plugin/index.d.ts` and `build/runtime/index.d.ts`
  - Generates TypeScript declaration files

**Build Process**:

1. `build:js` — Bundles JavaScript and compiles SCSS using esbuild
2. `build:declarations` — Generates TypeScript declarations using `tsconfig.publish.json`
3. `build` — Runs both build steps in parallel

## Package Exports

The package exports:

- **Main export** (`.`): Plugin transform function
  - `types`: `./build/plugin/index.d.ts`
  - `default`: `./build/plugin/index.js`

- **Runtime export** (`./runtime`): Runtime component
  - `types`: `./build/runtime/index.d.ts`
  - `style`: `./build/runtime/index.css`
  - `default`: `./build/runtime/index.js`

- **Style exports**:
  - `./runtime/styles` → `./build/runtime/index.css`
  - `./runtime/styles.css` → `./build/runtime/index.css`

## Testing

The package uses **Jest** for testing:

- Configuration: `tests/jest.config.js`
- Test files: `tests/src/**/*.test.ts`
- Snapshots: `tests/src/__snapshots__/`

**Test Commands**:

```bash
# Run tests
npm test

# Run tests in watch mode (if configured)
npm test -- --watch
```

**Test Structure**:

- Tests are in a separate `tests/` directory with their own `package.json`
- This allows testing the built package as it would be used by consumers
- Tests import from the built output in `build/`

## Linting and Code Quality

Linting is configured via `@diplodoc/lint`:

- ESLint for JavaScript/TypeScript
- Prettier for code formatting
- Stylelint for SCSS
- Git hooks via Husky
- Pre-commit checks via lint-staged

Configuration files are automatically managed by `@diplodoc/lint`:

- `.eslintrc.js`
- `.prettierrc.js`
- `.stylelintrc.js`
- `.editorconfig`
- `.lintstagedrc.js`
- `.husky/pre-commit`
- `.husky/commit-msg`

**Lint Commands**:

```bash
# Update lint configurations
npm run lint

# Fix linting issues
npm run lint:fix

# Pre-commit hook (runs automatically)
npm run pre-commit
```

## Important Notes

1. **Metapackage vs Standalone**: This package can be used both as part of the metapackage (workspace mode) and as a standalone npm package. All scripts must work in both contexts.

2. **Linting**: Linting infrastructure is managed by `@diplodoc/lint`. Run `npx @diplodoc/lint update` to sync configurations.

3. **Build Output**: The build outputs files to the `build/` directory. The `package.json` `files` field specifies what gets published to npm.

4. **Type Exports**: Ensure `package.json` has correct `types` field pointing to declaration files in `build/` directory.

5. **Runtime Styles**: SCSS files are compiled to CSS during build. The CSS is included in the runtime export.

6. **Plugin vs Runtime**: The package provides both a transform plugin (for build time) and a runtime component (for browser). Make sure both are properly built and exported.

7. **package.json Maintenance**: Periodically check that `package.json` fields (description, repository URL, bugs URL, etc.) are accurate and up-to-date. Verify that dependency versions are current and compatible with the project standards.

## CI/CD

The package includes GitHub Actions workflows:

- **tests.yml**: Runs tests, type checking, linting, and build on multiple platforms
- **quality.yaml**: Code quality checks
- **security.yml**: Weekly security audits via npm audit
- **release-please.yml**: Automated versioning and changelog generation based on conventional commits
- **release.yaml**: Publishes package to npm when a release is created
- **update-deps.yml**: Automated dependency updates

### Release Process

The package uses **release-please** for automated versioning and publishing:

1. **Release-please workflow** (`.github/workflows/release-please.yml`):
   - Runs on push to `master`
   - Analyzes conventional commits to determine version bumps
   - Creates release PRs with updated version and CHANGELOG.md
   - When release PR is merged, creates a GitHub release with tag `v1.0.0`

2. **Publish workflow** (`.github/workflows/release.yaml`):
   - Triggers automatically when a release is created
   - Runs tests, type checking, and build
   - Verifies package contents and version matching
   - Publishes to npm with provenance

**Workflow**:

1. Developer makes conventional commits (e.g., `feat: add new feature`)
2. Release-please creates/updates release PR with version bump and changelog
3. Release PR is reviewed and merged
4. Release-please creates GitHub release
5. Publish workflow automatically publishes to npm

**Version Bump Rules**:

- `feat`: Minor version bump
- `fix`: Patch version bump
- Breaking changes (e.g., `feat!: breaking change`): Major version bump
- `chore`, `docs`, `refactor`: No version bump (unless breaking)

## GitHub Integration

- **Issue templates**: Bug reports and feature requests (`.github/ISSUE_TEMPLATE/`)
- **Pull request template**: Standardized PR format (`.github/pull_request_template.md`)
- **Dependabot**: Automated dependency updates (`.github/dependabot.yml`)

## Documentation Files

- **README.md**: Package documentation with usage examples
- **CHANGELOG.md**: Change log (managed by release-please)
- **CONTRIBUTING.md**: Contribution guidelines and development workflow
- **AGENTS.md**: This file - guide for AI coding agents
- **LICENSE**: MIT license

## Additional Resources

- Metapackage `.agents/` - Platform-wide agent documentation
- `@diplodoc/lint` documentation - Linting and formatting setup
- `@diplodoc/tsconfig` - TypeScript configuration reference
- `@diplodoc/directive` - Directive parsing utilities
- `@diplodoc/utils` - Shared utilities
