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

## API Endpoints

- `GET /` - Returns a list of books
- `POST /books` - Creates a new book
- `GET /greet?q=name` - Returns a greeting message

## Project Structure

- `src/index.ts` - Main application file (TypeScript)
- `dist/` - Compiled JavaScript output
- `tsconfig.json` - TypeScript configuration
- `package.json` - Project dependencies and scripts