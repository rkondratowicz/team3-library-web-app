# Person 2: Member Management System

## Overview
You are responsible for building the complete member management system from scratch. Currently, there is no member functionality in the application. You need to create the entire member system including database schema, business logic, API endpoints, and integration points for the borrowing system.

## Current State Analysis
**What's Already Implemented:**
- Nothing for members - you're building from scratch
- Existing project structure with TypeScript, Express, SQLite
- Patterns established in book management system

**What You Need to Build:**
- Complete member database schema
- Member TypeScript interfaces and types
- Member repository, service, and controller layers
- All member management API endpoints
- Member validation and business rules

## Day 1 Tasks

### Task 2.1: Create Member Database Schema
**Objective:** Design and implement complete member data structure

1. **Create member table migration**
   - Create file: `src/data/migrations/04-create-members-table.sql`
   ```sql
   CREATE TABLE members (
       id TEXT PRIMARY KEY,
       name VARCHAR(255) NOT NULL,
       email VARCHAR(255) UNIQUE NOT NULL,
       phone VARCHAR(20),
       address TEXT,
       member_since DATE DEFAULT CURRENT_DATE,
       status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'expired'
       max_books INTEGER DEFAULT 3,
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
   );

   CREATE INDEX idx_members_email ON members(email);
   CREATE INDEX idx_members_status ON members(status);
   ```

2. **Run migration**
   ```bash
   sqlite3 library.db < src/data/migrations/04-create-members-table.sql
   ```

### Task 2.2: Create Member TypeScript Interfaces
**Objective:** Define all member-related types and interfaces

1. **Add to `src/shared/types.ts`**
   ```typescript
   // Member interfaces
   export interface Member {
     id: string;
     name: string;
     email: string;
     phone?: string;
     address?: string;
     member_since: string;
     status: 'active' | 'suspended' | 'expired';
     max_books: number;
     created_at: string;
     updated_at: string;
   }

   export interface CreateMemberRequest {
     name: string;
     email: string;
     phone?: string;
     address?: string;
   }

   export interface UpdateMemberRequest {
     name?: string;
     email?: string;
     phone?: string;
     address?: string;
     status?: 'active' | 'suspended' | 'expired';
     max_books?: number;
   }

   export interface MemberSearchFilters {
     name?: string;
     email?: string;
     status?: 'active' | 'suspended' | 'expired';
   }

   export interface MemberProfile extends Member {
     current_borrowed_count: number;
     current_borrowed_books: any[]; // Will be defined after borrowing system
     overdue_count: number;
     total_books_borrowed: number;
   }

   // Response types
   export interface MemberResponse {
     member: Member;
   }

   export interface MembersResponse {
     members: Member[];
   }

   export interface MemberProfileResponse {
     profile: MemberProfile;
   }
   ```

### Task 2.3: Create Member Repository
**Objective:** Implement data access layer for members

1. **Create `src/data/MemberRepository.ts`**
   ```typescript
   import { dirname, join } from 'node:path';
   import { fileURLToPath } from 'node:url';
   import sqlite3 from 'sqlite3';
   import type { Member, CreateMemberRequest, UpdateMemberRequest, MemberSearchFilters } from '../shared/types.js';

   export interface IMemberRepository {
     getAllMembers(): Promise<Member[]>;
     getMemberById(id: string): Promise<Member | null>;
     getMemberByEmail(email: string): Promise<Member | null>;
     createMember(member: Member): Promise<void>;
     updateMember(id: string, updates: Partial<Member>): Promise<boolean>;
     deleteMember(id: string): Promise<boolean>;
     searchMembers(filters: MemberSearchFilters): Promise<Member[]>;
     memberExists(id: string): Promise<boolean>;
     emailExists(email: string, excludeId?: string): Promise<boolean>;
   }

   export class MemberRepository implements IMemberRepository {
     private db: sqlite3.Database;

     constructor() {
       const __filename = fileURLToPath(import.meta.url);
       const __dirname = dirname(__filename);
       
       this.db = new sqlite3.Database(
         join(__dirname, '..', '..', 'library.db'),
         (err: Error | null) => {
           if (err) {
             console.error('Error opening database:', err.message);
           } else {
             console.log('Connected to the SQLite database for Members.');
           }
         }
       );
     }

     // Implement all interface methods with proper SQLite queries
     // Use the same patterns as BookRepository
   }
   ```

2. **Implement all repository methods:**
   - Follow the same patterns used in BookRepository
   - Include proper error handling and Promise wrapping
   - Add validation for email uniqueness
   - Implement search functionality

### Task 2.4: Create Member Service
**Objective:** Implement business logic for member operations

1. **Create `src/business/MemberService.ts`**
   ```typescript
   import { v4 as uuidv4 } from 'uuid';
   import type { IMemberRepository } from '../data/MemberRepository.js';
   import type {
     Member,
     CreateMemberRequest,
     UpdateMemberRequest,
     MemberSearchFilters,
     BusinessResult,
   } from '../shared/types.js';

   export interface IMemberService {
     getAllMembers(): Promise<BusinessResult<Member[]>>;
     getMemberById(id: string): Promise<BusinessResult<Member>>;
     createMember(memberData: CreateMemberRequest): Promise<BusinessResult<Member>>;
     updateMember(id: string, updates: UpdateMemberRequest): Promise<BusinessResult<Member>>;
     deleteMember(id: string): Promise<BusinessResult<void>>;
     searchMembers(filters: MemberSearchFilters): Promise<BusinessResult<Member[]>>;
     validateMemberEligibility(memberId: string): Promise<BusinessResult<boolean>>;
   }

   export class MemberService implements IMemberService {
     constructor(private memberRepository: IMemberRepository) {}

     // Implement all service methods with business logic
   }
   ```

2. **Implement business rules:**
   - Email format validation
   - Unique email constraint
   - Member status validation
   - Cannot delete members with active borrows (placeholder for Day 2)

## Day 2 Tasks

### Task 2.5: Create Member Controller
**Objective:** Implement API endpoints for member operations

1. **Create `src/presentation/MemberController.ts`**
   ```typescript
   import type { Request, Response } from 'express';
   import type { IMemberService } from '../business/MemberService.js';
   import type {
     MemberResponse,
     MembersResponse,
     CreateMemberRequest,
     UpdateMemberRequest,
     ErrorResponse,
     MemberSearchFilters,
   } from '../shared/types.js';

   export class MemberController {
     constructor(private memberService: IMemberService) {}

     // GET /members - Get all members
     getAllMembers = async (
       req: Request,
       res: Response<MembersResponse | ErrorResponse>
     ): Promise<void> => {
       // Implementation following BookController patterns
     };

     // GET /members/:id - Get member by ID
     getMemberById = async (
       req: Request,
       res: Response<MemberResponse | ErrorResponse>
     ): Promise<void> => {
       // Implementation
     };

     // POST /members - Create new member
     createMember = async (
       req: Request<{}, MemberResponse | ErrorResponse, CreateMemberRequest>,
       res: Response<MemberResponse | ErrorResponse>
     ): Promise<void> => {
       // Implementation
     };

     // PUT /members/:id - Update member
     updateMember = async (
       req: Request<{ id: string }, MemberResponse | ErrorResponse, UpdateMemberRequest>,
       res: Response<MemberResponse | ErrorResponse>
     ): Promise<void> => {
       // Implementation
     };

     // DELETE /members/:id - Delete member
     deleteMember = async (
       req: Request,
       res: Response<{} | ErrorResponse>
     ): Promise<void> => {
       // Implementation
     };

     // GET /members/search - Search members
     searchMembers = async (
       req: Request,
       res: Response<MembersResponse | ErrorResponse>
     ): Promise<void> => {
       // Implementation
     };
   }
   ```

### Task 2.6: Create Member Routes
**Objective:** Set up routing for member endpoints

1. **Create member routes function**
   - Add to `src/presentation/routes.ts` or create separate file:
   ```typescript
   import express from 'express';
   import type { MemberController } from './MemberController.js';

   export function createMemberRoutes(memberController: MemberController): express.Router {
     const router = express.Router();

     // GET /members - Get all members
     router.get('/', memberController.getAllMembers);

     // GET /members/search - Search members (must be before /:id)
     router.get('/search', memberController.searchMembers);

     // GET /members/:id - Get member by ID
     router.get('/:id', memberController.getMemberById);

     // POST /members - Create new member
     router.post('/', memberController.createMember);

     // PUT /members/:id - Update member
     router.put('/:id', memberController.updateMember);

     // DELETE /members/:id - Delete member
     router.delete('/:id', memberController.deleteMember);

     return router;
   }
   ```

### Task 2.7: Update Main Application
**Objective:** Integrate member system into main app

1. **Update `src/app.ts`**
   - Import member classes
   - Initialize member repository, service, and controller
   - Add member routes to app
   - Follow the same pattern used for books

### Task 2.8: Create Member Seed Data
**Objective:** Add sample members for testing

1. **Create `src/data/seeds/members.sql`**
   ```sql
   INSERT INTO members (id, name, email, phone, address, member_since, status, max_books) VALUES
   ('550e8400-e29b-41d4-a716-446655440001', 'John Doe', 'john.doe@email.com', '555-0101', '123 Main St, City, State 12345', '2024-01-15', 'active', 3),
   ('550e8400-e29b-41d4-a716-446655440002', 'Jane Smith', 'jane.smith@email.com', '555-0102', '456 Oak Ave, City, State 12345', '2024-02-20', 'active', 3),
   ('550e8400-e29b-41d4-a716-446655440003', 'Bob Johnson', 'bob.johnson@email.com', '555-0103', '789 Pine Rd, City, State 12345', '2024-03-10', 'active', 3),
   ('550e8400-e29b-41d4-a716-446655440004', 'Alice Brown', 'alice.brown@email.com', '555-0104', '321 Elm St, City, State 12345', '2024-01-05', 'suspended', 3);
   ```

2. **Run seed data:**
   ```bash
   sqlite3 library.db < src/data/seeds/members.sql
   ```

### Task 2.9: Advanced Member Features
**Objective:** Implement member profile and borrowing integration

1. **Add member profile functionality:**
   - Create methods to get member borrowing statistics
   - Implement member eligibility checking
   - Add overdue tracking (coordinate with Person 3)

2. **Member validation and business rules:**
   - Validate borrowing limits
   - Check member status before allowing operations
   - Implement member compliance tracking

### Task 2.10: Testing and Integration
**Objective:** Ensure all components work correctly

1. **Test all member endpoints:**
   - Member CRUD operations
   - Search functionality
   - Email uniqueness validation
   - Member profile features

2. **Integration points:**
   - Prepare for borrowing system integration (Day 2 coordination with Person 3)
   - Member eligibility checking
   - Cannot delete members with active borrows

## Technical Requirements

### Validation Rules
- Email format validation using regex
- Phone number format (optional but if provided, must be valid)
- Name cannot be empty
- Unique email addresses

### Error Handling
- Duplicate email errors
- Invalid member ID errors
- Member not found errors
- Cannot delete member with active borrows

### Database Considerations
- Use UUIDs for member IDs
- Index email field for fast lookups
- Proper foreign key constraints for future borrowing table

## Integration Points
- **With Person 3 (Borrowing System):** Member borrowing history, current loans, overdue tracking
- **With Person 1 (Books):** Member profiles showing borrowed books

## Success Criteria
- [ ] Member database schema created and populated
- [ ] All member TypeScript interfaces defined
- [ ] Member repository with all CRUD operations
- [ ] Member service with business logic
- [ ] Member controller with all endpoints
- [ ] Member routes properly configured
- [ ] Integration with main app completed
- [ ] Member search functionality working
- [ ] Email validation and uniqueness enforced
- [ ] Sample member data loaded
- [ ] All endpoints tested and functional
- [ ] Ready for borrowing system integration