# TypeScript/Node-specific recipes (ts-* prefix)
# Part of multi-stack project setup
# Import this file in your main justfile: import 'typescript.just'

# Detect package manager (pnpm > npm)
# Import base recipes (catchup, branch-create, context, etc.)
import 'base.just'

# Import github workflow recipes
import 'github.just'


pm := if path_exists("pnpm-lock.yaml") == "true" { "pnpm" } else { "npm" }

# ==========================================
# TYPESCRIPT CORE RECIPES
# ==========================================

# Run TypeScript test suite
ts-test *args:
    {{pm}} test {{args}}

# Run TypeScript tests in watch mode
ts-test-watch:
    {{pm}} test -- --watch

# Run TypeScript linters (eslint + prettier check)
ts-lint:
    {{pm}} run lint
    {{pm}} run format:check 2>/dev/null || true

# Run all TypeScript CI checks
ts-ci: ts-lint ts-test ts-build
    @echo "TypeScript CI checks passed!"

# ==========================================
# TYPESCRIPT FORMATTING
# ==========================================

# Format TypeScript code with prettier
ts-fmt:
    {{pm}} run format 2>/dev/null || npx prettier --write .

# TypeScript type checking only
ts-check:
    {{pm}} run typecheck 2>/dev/null || npx tsc --noEmit

# ==========================================
# TYPESCRIPT DEPENDENCIES
# ==========================================

# Install TypeScript dependencies
ts-deps:
    {{pm}} install

# Update TypeScript dependencies
ts-deps-update:
    {{pm}} update

# Add a TypeScript dependency
ts-deps-add package:
    {{pm}} add {{package}}

# Add a TypeScript dev dependency
ts-deps-add-dev package:
    {{pm}} add -D {{package}}

# Show outdated TypeScript packages
ts-deps-outdated:
    {{pm}} outdated

# ==========================================
# TYPESCRIPT BUILDING
# ==========================================

# Build TypeScript project
ts-build:
    {{pm}} run build

# Start TypeScript development server
ts-dev:
    {{pm}} run dev

# Run any npm script
ts-run script *args:
    {{pm}} run {{script}} {{args}}

# Start TypeScript production server
ts-start:
    {{pm}} start

# Preview TypeScript production build
ts-preview:
    {{pm}} run preview 2>/dev/null || {{pm}} run start

# ==========================================
# TYPESCRIPT CLEANING
# ==========================================

# Clean TypeScript build artifacts
ts-clean:
    rm -rf dist/ build/ .next/ out/
    rm -rf node_modules/.cache/

# Deep clean TypeScript (including node_modules)
ts-clean-all: ts-clean
    rm -rf node_modules/
    @echo "Run 'just ts-deps' to reinstall dependencies"

# ==========================================
# TYPESCRIPT SECURITY
# ==========================================

# Audit TypeScript dependencies for vulnerabilities
ts-audit:
    {{pm}} audit

# Audit TypeScript with fix
ts-audit-fix:
    {{pm}} audit --fix 2>/dev/null || {{pm}} audit fix
