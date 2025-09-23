---
applyTo: '**'
---

# Team 3 Library Web App - Development Guidelines

## Project Overview
This is a TypeScript Express API for managing a library's book collection. The application uses SQLite for data persistence and follows modern Node.js best practices.

## Best Practices for Using This Application

### 1. Database Management
- **Always use UUIDs** for book IDs instead of auto-incrementing integers for better scalability
- **Run migrations before seeding**: Execute table creation scripts before inserting seed data
- **Use SQLite CLI** for database inspection: `sqlite3 library.db`
- **Backup database** before making schema changes
- **Use transactions** for multiple related database operations

### 2. API Development
- **Follow RESTful conventions**:
  - GET `/books` - List all books
  - GET `/books/:id` - Get specific book by UUID
  - POST `/books` - Create new book
  - PUT `/books/:id` - Update existing book
  - DELETE `/books/:id` - Remove book
- **Always validate input data** before processing
- **Use proper HTTP status codes** (200, 201, 400, 404, 500)
- **Include error handling** for database operations
- **Implement proper TypeScript interfaces** for request/response types

### 3. Code Structure
- **Use TypeScript strictly** - no `any` types
- **Define interfaces** for all data structures
- **Separate concerns**: routes, controllers, database operations
- **Use async/await** for database operations
- **Handle errors gracefully** with try-catch blocks

### 4. Development Workflow
- **Install dependencies** first: `npm install`
- **Check for errors** regularly using TypeScript compiler
- **Use development server**: `npm run dev`
- **Build before deployment**: `npm run build`
- **Test database operations** in SQLite CLI before implementing in code

### 5. Environment Setup
- **Use ES modules** (already configured in package.json)
- **Keep TypeScript configuration strict**
- **Use ts-node for development** (already configured)
- **Maintain consistent code formatting**

### 6. Security Considerations
- **Validate all user inputs**
- **Use parameterized queries** to prevent SQL injection
- **Implement proper error messages** (don't expose internal details)
- **Add rate limiting** for API endpoints in production

### 7. Testing Guidelines
- **Test API endpoints** with tools like Postman or curl
- **Verify database operations** in SQLite CLI
- **Test error scenarios** (invalid UUIDs, missing data)
- **Check TypeScript compilation** before committing code

### 8. Common Commands
```bash
# Start development server
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Open database
sqlite3 library.db

# Run migrations
sqlite3 library.db < src/migrations/01-Create-books-table.sql

# Seed database
sqlite3 library.db < src/seeds/books.sql
```

Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.