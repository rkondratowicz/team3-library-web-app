# Task 2.3: Create Member Repository

## Objective
Implement the complete data access layer for member operations, including all CRUD operations, search functionality, and validation methods.

## Current State
- Members table created in database
- TypeScript interfaces defined
- Need to implement repository pattern following BookRepository structure

## What You Will Create
- Complete IMemberRepository interface
- Full MemberRepository implementation
- All member CRUD operations
- Search and filtering capabilities
- Email validation and uniqueness checking

## Step-by-Step Instructions

### Step 1: Create the Member Repository File

1. **Create `src/data/MemberRepository.ts`:**
   ```bash
   touch src/data/MemberRepository.ts
   ```

### Step 2: Add Imports and Interface Definition

1. **Add the following content to `src/data/MemberRepository.ts`:**
   ```typescript
   import { dirname, join } from 'node:path';
   import { fileURLToPath } from 'node:url';
   import sqlite3 from 'sqlite3';
   import type { 
     Member, 
     CreateMemberRequest, 
     UpdateMemberRequest, 
     MemberSearchFilters 
   } from '../shared/types.js';

   export interface IMemberRepository {
     // Basic CRUD operations
     getAllMembers(): Promise<Member[]>;
     getMemberById(id: string): Promise<Member | null>;
     getMemberByEmail(email: string): Promise<Member | null>;
     createMember(member: Member): Promise<void>;
     updateMember(id: string, updates: Partial<Member>): Promise<boolean>;
     deleteMember(id: string): Promise<boolean>;
     
     // Search and filtering
     searchMembers(filters: MemberSearchFilters): Promise<Member[]>;
     getMembersByStatus(status: string): Promise<Member[]>;
     
     // Validation methods
     memberExists(id: string): Promise<boolean>;
     emailExists(email: string, excludeId?: string): Promise<boolean>;
     
     // Statistics methods (for integration with Person 3)
     getMemberCount(): Promise<number>;
     getActiveMemberCount(): Promise<number>;
     getMembersRegisteredSince(date: string): Promise<Member[]>;
   }
   ```

### Step 3: Implement the MemberRepository Class

1. **Add the class implementation:**
   ```typescript
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

     async getAllMembers(): Promise<Member[]> {
       return new Promise((resolve, reject) => {
         const sql = `
           SELECT id, name, email, phone, address, member_since, status, max_books, created_at, updated_at
           FROM members 
           ORDER BY name ASC
         `;
         
         this.db.all(sql, [], (err: Error | null, rows: any[]) => {
           if (err) {
             console.error('Error in getAllMembers:', err);
             reject(err);
           } else {
             const members: Member[] = rows.map(row => ({
               id: row.id,
               name: row.name,
               email: row.email,
               phone: row.phone,
               address: row.address,
               member_since: row.member_since,
               status: row.status,
               max_books: row.max_books,
               created_at: row.created_at,
               updated_at: row.updated_at
             }));
             resolve(members);
           }
         });
       });
     }

     async getMemberById(id: string): Promise<Member | null> {
       return new Promise((resolve, reject) => {
         const sql = `
           SELECT id, name, email, phone, address, member_since, status, max_books, created_at, updated_at
           FROM members 
           WHERE id = ?
         `;
         
         this.db.get(sql, [id], (err: Error | null, row: any) => {
           if (err) {
             console.error('Error in getMemberById:', err);
             reject(err);
           } else if (row) {
             const member: Member = {
               id: row.id,
               name: row.name,
               email: row.email,
               phone: row.phone,
               address: row.address,
               member_since: row.member_since,
               status: row.status,
               max_books: row.max_books,
               created_at: row.created_at,
               updated_at: row.updated_at
             };
             resolve(member);
           } else {
             resolve(null);
           }
         });
       });
     }

     async getMemberByEmail(email: string): Promise<Member | null> {
       return new Promise((resolve, reject) => {
         const sql = `
           SELECT id, name, email, phone, address, member_since, status, max_books, created_at, updated_at
           FROM members 
           WHERE email = ?
         `;
         
         this.db.get(sql, [email], (err: Error | null, row: any) => {
           if (err) {
             console.error('Error in getMemberByEmail:', err);
             reject(err);
           } else if (row) {
             const member: Member = {
               id: row.id,
               name: row.name,
               email: row.email,
               phone: row.phone,
               address: row.address,
               member_since: row.member_since,
               status: row.status,
               max_books: row.max_books,
               created_at: row.created_at,
               updated_at: row.updated_at
             };
             resolve(member);
           } else {
             resolve(null);
           }
         });
       });
     }

     async createMember(member: Member): Promise<void> {
       return new Promise((resolve, reject) => {
         const sql = `
           INSERT INTO members (id, name, email, phone, address, member_since, status, max_books, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         `;
         
         this.db.run(
           sql,
           [
             member.id,
             member.name,
             member.email,
             member.phone,
             member.address,
             member.member_since,
             member.status,
             member.max_books,
             member.created_at,
             member.updated_at
           ],
           function (err: Error | null) {
             if (err) {
               console.error('Error in createMember:', err);
               reject(err);
             } else {
               resolve();
             }
           }
         );
       });
     }

     async updateMember(id: string, updates: Partial<Member>): Promise<boolean> {
       return new Promise((resolve, reject) => {
         const updateFields: string[] = [];
         const values: any[] = [];
         
         if (updates.name !== undefined) {
           updateFields.push('name = ?');
           values.push(updates.name);
         }
         if (updates.email !== undefined) {
           updateFields.push('email = ?');
           values.push(updates.email);
         }
         if (updates.phone !== undefined) {
           updateFields.push('phone = ?');
           values.push(updates.phone);
         }
         if (updates.address !== undefined) {
           updateFields.push('address = ?');
           values.push(updates.address);
         }
         if (updates.status !== undefined) {
           updateFields.push('status = ?');
           values.push(updates.status);
         }
         if (updates.max_books !== undefined) {
           updateFields.push('max_books = ?');
           values.push(updates.max_books);
         }
         
         if (updateFields.length === 0) {
           resolve(false);
           return;
         }
         
         // Always update the updated_at field
         updateFields.push('updated_at = CURRENT_TIMESTAMP');
         values.push(id);
         
         const sql = `UPDATE members SET ${updateFields.join(', ')} WHERE id = ?`;
         
         this.db.run(sql, values, function (err: Error | null) {
           if (err) {
             console.error('Error in updateMember:', err);
             reject(err);
           } else {
             resolve(this.changes > 0);
           }
         });
       });
     }

     async deleteMember(id: string): Promise<boolean> {
       return new Promise((resolve, reject) => {
         const sql = 'DELETE FROM members WHERE id = ?';
         
         this.db.run(sql, [id], function (err: Error | null) {
           if (err) {
             console.error('Error in deleteMember:', err);
             reject(err);
           } else {
             resolve(this.changes > 0);
           }
         });
       });
     }
   ```

### Step 4: Add Search and Filter Methods

1. **Add the search methods:**
   ```typescript
     async searchMembers(filters: MemberSearchFilters): Promise<Member[]> {
       return new Promise((resolve, reject) => {
         let sql = `
           SELECT id, name, email, phone, address, member_since, status, max_books, created_at, updated_at
           FROM members
         `;
         
         const conditions: string[] = [];
         const values: any[] = [];
         
         if (filters.name) {
           conditions.push(`name LIKE ?`);
           values.push(`%${filters.name}%`);
         }
         
         if (filters.email) {
           conditions.push(`email LIKE ?`);
           values.push(`%${filters.email}%`);
         }
         
         if (filters.status) {
           conditions.push(`status = ?`);
           values.push(filters.status);
         }
         
         if (filters.member_since_from) {
           conditions.push(`member_since >= ?`);
           values.push(filters.member_since_from);
         }
         
         if (filters.member_since_to) {
           conditions.push(`member_since <= ?`);
           values.push(filters.member_since_to);
         }
         
         if (conditions.length > 0) {
           sql += ` WHERE ${conditions.join(' AND ')}`;
         }
         
         sql += ` ORDER BY name ASC`;
         
         if (filters.limit) {
           sql += ` LIMIT ?`;
           values.push(filters.limit);
           
           if (filters.offset) {
             sql += ` OFFSET ?`;
             values.push(filters.offset);
           }
         }
         
         this.db.all(sql, values, (err: Error | null, rows: any[]) => {
           if (err) {
             console.error('Error in searchMembers:', err);
             reject(err);
           } else {
             const members: Member[] = rows.map(row => ({
               id: row.id,
               name: row.name,
               email: row.email,
               phone: row.phone,
               address: row.address,
               member_since: row.member_since,
               status: row.status,
               max_books: row.max_books,
               created_at: row.created_at,
               updated_at: row.updated_at
             }));
             resolve(members);
           }
         });
       });
     }

     async getMembersByStatus(status: string): Promise<Member[]> {
       return this.searchMembers({ status: status as any });
     }
   ```

### Step 5: Add Validation Methods

1. **Add validation helper methods:**
   ```typescript
     async memberExists(id: string): Promise<boolean> {
       return new Promise((resolve, reject) => {
         const sql = 'SELECT 1 FROM members WHERE id = ?';
         
         this.db.get(sql, [id], (err: Error | null, row: any) => {
           if (err) {
             console.error('Error in memberExists:', err);
             reject(err);
           } else {
             resolve(!!row);
           }
         });
       });
     }

     async emailExists(email: string, excludeId?: string): Promise<boolean> {
       return new Promise((resolve, reject) => {
         let sql = 'SELECT 1 FROM members WHERE email = ?';
         const params: any[] = [email];
         
         if (excludeId) {
           sql += ' AND id != ?';
           params.push(excludeId);
         }
         
         this.db.get(sql, params, (err: Error | null, row: any) => {
           if (err) {
             console.error('Error in emailExists:', err);
             reject(err);
           } else {
             resolve(!!row);
           }
         });
       });
     }
   ```

### Step 6: Add Statistics Methods

1. **Add statistics methods for analytics integration:**
   ```typescript
     async getMemberCount(): Promise<number> {
       return new Promise((resolve, reject) => {
         const sql = 'SELECT COUNT(*) as count FROM members';
         
         this.db.get(sql, [], (err: Error | null, row: any) => {
           if (err) {
             console.error('Error in getMemberCount:', err);
             reject(err);
           } else {
             resolve(row.count || 0);
           }
         });
       });
     }

     async getActiveMemberCount(): Promise<number> {
       return new Promise((resolve, reject) => {
         const sql = "SELECT COUNT(*) as count FROM members WHERE status = 'active'";
         
         this.db.get(sql, [], (err: Error | null, row: any) => {
           if (err) {
             console.error('Error in getActiveMemberCount:', err);
             reject(err);
           } else {
             resolve(row.count || 0);
           }
         });
       });
     }

     async getMembersRegisteredSince(date: string): Promise<Member[]> {
       return this.searchMembers({ member_since_from: date });
     }
   }
   ```

### Step 7: Test the Repository

1. **Compile TypeScript to check for errors:**
   ```bash
   npm run build
   ```

2. **Create a simple test to verify the repository works:**
   ```bash
   # Test that we can query the members table
   sqlite3 library.db "INSERT INTO members (id, name, email) VALUES ('test-repo', 'Test Repository', 'test-repo@example.com');"
   sqlite3 library.db "SELECT id, name, email FROM members WHERE id = 'test-repo';"
   sqlite3 library.db "DELETE FROM members WHERE id = 'test-repo';"
   ```

## Expected Results
- ✅ Complete IMemberRepository interface defined
- ✅ Full MemberRepository class implemented
- ✅ All CRUD operations functional
- ✅ Search and filtering capabilities working
- ✅ Email validation and uniqueness checking
- ✅ Statistics methods for analytics integration
- ✅ TypeScript compilation successful
- ✅ Database operations tested

## Troubleshooting

### If compilation fails:
1. Check that all imported types exist in types.ts
2. Verify method signatures match interface exactly
3. Ensure all Promise return types are correct

### If database operations fail:
1. Verify table name and column names match schema
2. Check that database connection is working
3. Test SQL queries manually in sqlite3 CLI

### If email uniqueness doesn't work:
1. Verify UNIQUE constraint exists on email column
2. Test constraint with manual INSERT statements
3. Check error handling for constraint violations

## Next Steps
After completing this task, proceed to Task 2.4: Create Member Service.

## Files Created
- ✅ `src/data/MemberRepository.ts` (new, complete implementation)