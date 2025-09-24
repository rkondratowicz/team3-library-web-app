# Task 2.2: Create Member TypeScript Interfaces

## Objective
Define comprehensive TypeScript interfaces and types for all member-related data structures and operations.

## Current State
- Member database schema created
- Need TypeScript interfaces to match database structure
- Must integrate with existing types.ts file

## What You Will Create
- Core Member interface
- Request/Response interfaces
- Search and filtering interfaces
- Member profile and status interfaces

## Step-by-Step Instructions

### Step 1: Add Core Member Interface

1. **Open `src/shared/types.ts`**

2. **Add the Member interface after existing interfaces:**
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
   ```

### Step 2: Add Member Request Interfaces

1. **Add member request interfaces:**
   ```typescript
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
   ```

### Step 3: Add Member Search and Filter Interfaces

1. **Add search interfaces:**
   ```typescript
   export interface MemberSearchFilters {
     name?: string;
     email?: string;
     status?: 'active' | 'suspended' | 'expired';
     member_since_from?: string;
     member_since_to?: string;
     limit?: number;
     offset?: number;
   }
   ```

### Step 4: Add Enhanced Member Interfaces

1. **Add composite member interfaces:**
   ```typescript
   export interface MemberProfile extends Member {
     current_borrowed_count: number;
     current_borrowed_books: BorrowingTransactionDetails[]; // Will be defined by Person 3
     overdue_count: number;
     total_books_borrowed: number;
     borrowing_history: BorrowingTransactionDetails[]; // Will be defined by Person 3
   }

   export interface MemberBorrowingStatus {
     member_id: string;
     member_name: string;
     current_borrowed_count: number;
     max_books: number;
     overdue_count: number;
     can_borrow: boolean;
     status: 'active' | 'suspended' | 'expired';
     restrictions: string[];
   }
   ```

### Step 5: Add Member Response Interfaces

1. **Add response type interfaces:**
   ```typescript
   // Member response types
   export interface MemberResponse {
     member: Member;
   }

   export interface MembersResponse {
     members: Member[];
   }

   export interface MemberProfileResponse {
     profile: MemberProfile;
   }

   export interface MemberSearchResponse {
     members: Member[];
     total: number;
     page: number;
     limit: number;
   }

   export interface MemberBorrowingStatusResponse {
     status: MemberBorrowingStatus;
   }
   ```

### Step 6: Validate TypeScript Compilation

1. **Build to check for errors:**
   ```bash
   npm run build
   ```

2. **Fix any compilation errors**

## Expected Results
- ✅ Complete Member interface matching database schema
- ✅ All request/response interfaces defined
- ✅ Search and filtering interfaces ready
- ✅ Enhanced member profile interfaces prepared
- ✅ TypeScript compilation successful

## Files Modified
- ✅ `src/shared/types.ts` (member interfaces added)