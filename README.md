# team3-library-web-app

A TypeScript Express API for managing books.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development mode:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Run production build:
   ```bash
   npm start
   ```

## Code Quality & Formatting

This project uses [Biome](https://biomejs.dev/) for code formatting, linting, and import organization.

### Available Scripts

**Development:**
- `npm run dev` - Start development server
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Run production build

**Code Quality:**
- `npm run format` - Format code with auto-fix
- `npm run format:check` - Check formatting without changes
- `npm run lint` - Run linter
- `npm run lint:fix` - Run linter with safe fixes
- `npm run check` - Run all checks (format + lint + import sort)
- `npm run check:fix` - Apply all safe fixes
- `npm run check:unsafe` - Apply all fixes including unsafe ones

### Biome Configuration

The project is configured with:
- 2-space indentation
- Single quotes
- 100 character line width
- Automatic import organization
- TypeScript-specific linting rules
- Node.js import protocol enforcement

## API Endpoints

- `GET /` - Returns a list of books
- `POST /books` - Creates a new book
- `GET /greet?q=name` - Returns a greeting message

## Project Structure

- `src/index.ts` - Main application file (TypeScript)
- `dist/` - Compiled JavaScript output
- `tsconfig.json` - TypeScript configuration
- `biome.json` - Biome configuration for formatting and linting
- `.biomeignore` - Files to ignore during Biome checks
- `package.json` - Project dependencies and scripts
- `.vscode/` - VS Code workspace settings and extension recommendations