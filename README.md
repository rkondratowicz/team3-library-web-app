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

### Pre-commit Hooks

The project includes a pre-commit hook that runs all code quality checks. To install it:

```bash
git config core.hooksPath .githooks
```

This ensures code quality standards are maintained on every commit.

### GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/code-quality.yml`) that runs on:
- All pushes to `main` and `develop` branches
- All pull requests to `main` and `develop` branches

This prevents code quality issues from being merged.

## API Endpoints

### Books
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get book by ID
- `POST /api/books` - Create a new book
- `PUT /api/books/:id` - Update a book
- `DELETE /api/books/:id` - Delete a book

### Members  
- `GET /api/members` - Get all members
- `GET /api/members/:id` - Get member by ID
- `POST /api/members` - Create a new member
- `PUT /api/members/:id` - Update a member
- `DELETE /api/members/:id` - Delete a member

### Authentication
- `POST /api/auth/login` - Member login with username/password
- `POST /api/auth/set-password` - Set member password
- `POST /api/auth/logout` - Logout member
- `GET /api/auth/session` - Check session status

### Web Interface
- `GET /` - Home page
- `GET /books` - Books listing page
- `GET /members` - Members listing page
- `GET /login` - Login page
- `GET /account` - Member account page

## Project Structure

- `src/index.ts` - Main application file (TypeScript)
- `dist/` - Compiled JavaScript output
- `tsconfig.json` - TypeScript configuration
- `biome.json` - Biome configuration for formatting and linting
- `.biomeignore` - Files to ignore during Biome checks
- `package.json` - Project dependencies and scripts
- `.vscode/` - VS Code workspace settings and extension recommendations# Test comment
