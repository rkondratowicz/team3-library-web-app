# Task 2.1: Create Member Database Schema

## Objective
Design and implement the complete member database structure to support all member-related functionality as specified in the PRD.

## Current State
- No member-related database tables exist
- Need to build member system from scratch
- Existing project uses SQLite with proper migration structure

## What You Will Create
- Complete `members` table with all required fields
- Proper indexes for performance
- Migration script following project conventions

## Step-by-Step Instructions

### Step 1: Understand Member Requirements

1. **Review the PRD requirements for members:**
   - Member registration with name, contact info, address
   - Unique member identification
   - Member status tracking (active, suspended, expired)
   - Borrowing limits (default 3 books)
   - Member activity tracking

### Step 2: Create Member Table Migration

1. **Create the migration file:**
   ```bash
   touch src/data/migrations/04-create-members-table.sql
   ```

2. **Add the following content to `src/data/migrations/04-create-members-table.sql`:**
   ```sql
   -- Create members table for library member management
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

   -- Create indexes for efficient queries
   CREATE INDEX idx_members_email ON members(email);
   CREATE INDEX idx_members_status ON members(status);
   CREATE INDEX idx_members_name ON members(name);
   CREATE INDEX idx_members_member_since ON members(member_since);

   -- Create trigger to update updated_at timestamp
   CREATE TRIGGER update_members_updated_at
   AFTER UPDATE ON members
   BEGIN
       UPDATE members SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END;
   ```

### Step 3: Run the Migration

1. **Execute the migration:**
   ```bash
   sqlite3 library.db < src/data/migrations/04-create-members-table.sql
   ```

2. **Verify the table was created:**
   ```bash
   sqlite3 library.db ".schema members"
   ```

   **Expected output should show:**
   ```sql
   CREATE TABLE members (
       id TEXT PRIMARY KEY,
       name VARCHAR(255) NOT NULL,
       email VARCHAR(255) UNIQUE NOT NULL,
       phone VARCHAR(20),
       address TEXT,
       member_since DATE DEFAULT CURRENT_DATE,
       status VARCHAR(20) DEFAULT 'active',
       max_books INTEGER DEFAULT 3,
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
   );
   ```

### Step 4: Validate the Database Structure

1. **Check table information:**
   ```bash
   sqlite3 library.db "PRAGMA table_info(members);"
   ```

   **Expected columns:**
   - 0|id|TEXT|0||1
   - 1|name|VARCHAR(255)|1||0
   - 2|email|VARCHAR(255)|1||0
   - 3|phone|VARCHAR(20)|0||0
   - 4|address|TEXT|0||0
   - 5|member_since|DATE|0|CURRENT_DATE|0
   - 6|status|VARCHAR(20)|0|'active'|0
   - 7|max_books|INTEGER|0|3|0
   - 8|created_at|DATETIME|0|CURRENT_TIMESTAMP|0
   - 9|updated_at|DATETIME|0|CURRENT_TIMESTAMP|0

2. **Check indexes were created:**
   ```bash
   sqlite3 library.db "PRAGMA index_list(members);"
   ```

   **Should show indexes for email, status, name, and member_since**

3. **Test unique email constraint:**
   ```bash
   # This should work
   sqlite3 library.db "INSERT INTO members (id, name, email) VALUES ('test-1', 'Test User 1', 'test1@example.com');"
   
   # This should fail with UNIQUE constraint error
   sqlite3 library.db "INSERT INTO members (id, name, email) VALUES ('test-2', 'Test User 2', 'test1@example.com');" || echo "Unique constraint working correctly"
   
   # Clean up test data
   sqlite3 library.db "DELETE FROM members WHERE id LIKE 'test-%';"
   ```

### Step 5: Test Default Values and Triggers

1. **Test default values:**
   ```bash
   # Insert a minimal member record
   sqlite3 library.db "INSERT INTO members (id, name, email) VALUES ('default-test', 'Default Test', 'default@test.com');"
   
   # Check default values were applied
   sqlite3 library.db "SELECT id, name, email, status, max_books, member_since FROM members WHERE id = 'default-test';"
   
   # Should show: default-test|Default Test|default@test.com|active|3|[today's date]
   ```

2. **Test update trigger:**
   ```bash
   # Get initial updated_at value
   INITIAL_TIME=$(sqlite3 library.db "SELECT updated_at FROM members WHERE id = 'default-test';")
   echo "Initial updated_at: $INITIAL_TIME"
   
   # Wait a moment and update the record
   sleep 2
   sqlite3 library.db "UPDATE members SET name = 'Updated Name' WHERE id = 'default-test';"
   
   # Check that updated_at changed
   UPDATED_TIME=$(sqlite3 library.db "SELECT updated_at FROM members WHERE id = 'default-test';")
   echo "Updated updated_at: $UPDATED_TIME"
   
   # Clean up
   sqlite3 library.db "DELETE FROM members WHERE id = 'default-test';"
   ```

### Step 6: Create Member Data Validation

1. **Test data constraints:**
   ```bash
   # Test NOT NULL constraints
   echo "Testing NOT NULL constraint on name"
   sqlite3 library.db "INSERT INTO members (id, email) VALUES ('null-test', 'null@test.com');" || echo "Name NOT NULL constraint working"
   
   echo "Testing NOT NULL constraint on email"
   sqlite3 library.db "INSERT INTO members (id, name) VALUES ('null-test', 'Null Test');" || echo "Email NOT NULL constraint working"
   ```

### Step 7: Document Member Schema

1. **Create `src/docs/member-schema.md`:**
   ```markdown
   # Member Database Schema

   ## Table: members

   | Column | Type | Constraints | Default | Description |
   |--------|------|-------------|---------|-------------|
   | id | TEXT | PRIMARY KEY | - | Unique member identifier (UUID) |
   | name | VARCHAR(255) | NOT NULL | - | Full name of the member |
   | email | VARCHAR(255) | UNIQUE, NOT NULL | - | Email address (used for uniqueness) |
   | phone | VARCHAR(20) | - | - | Phone number (optional) |
   | address | TEXT | - | - | Physical address (optional) |
   | member_since | DATE | - | CURRENT_DATE | Date when member joined |
   | status | VARCHAR(20) | - | 'active' | Member status: active, suspended, expired |
   | max_books | INTEGER | - | 3 | Maximum books member can borrow |
   | created_at | DATETIME | - | CURRENT_TIMESTAMP | Record creation timestamp |
   | updated_at | DATETIME | - | CURRENT_TIMESTAMP | Last update timestamp |

   ## Indexes

   - `idx_members_email`: Fast email lookups
   - `idx_members_status`: Filter by member status
   - `idx_members_name`: Search by member name
   - `idx_members_member_since`: Sort/filter by membership date

   ## Business Rules

   1. **Email Uniqueness**: Each member must have a unique email address
   2. **Required Fields**: Name and email are mandatory
   3. **Status Values**: Must be 'active', 'suspended', or 'expired'
   4. **Borrowing Limit**: Default is 3 books, but can be customized per member
   5. **Timestamps**: Automatically managed by database triggers

   ## Status Meanings

   - **active**: Member can borrow books normally
   - **suspended**: Member cannot borrow books (disciplinary action)
   - **expired**: Membership has expired, needs renewal

   ## Integration Points

   - Will be referenced by borrowing_transactions table (foreign key)
   - Member deletion should be prevented if active borrows exist
   - Status affects borrowing eligibility
   ```

## Expected Results
- ✅ Members table created with all required fields
- ✅ All indexes created for performance
- ✅ Unique email constraint working
- ✅ Default values properly set
- ✅ Update trigger functioning
- ✅ NOT NULL constraints enforced
- ✅ Schema documented

## Troubleshooting

### If migration fails:
1. Check SQLite syntax: `sqlite3 library.db ".read src/data/migrations/04-create-members-table.sql"`
2. Verify database file exists and is writable
3. Check for typos in column names or SQL keywords

### If constraints don't work:
1. Verify SQLite version supports the constraint type
2. Check that constraint syntax is correct
3. Test constraints individually

### If triggers don't work:
1. Ensure trigger syntax is correct for SQLite
2. Check that column names match exactly
3. Test trigger manually with UPDATE statements

## Next Steps
After completing this task, proceed to Task 2.2: Create Member TypeScript Interfaces.

## Files Created/Modified
- ✅ `src/data/migrations/04-create-members-table.sql` (new)
- ✅ `src/docs/member-schema.md` (new)
- ✅ `library.db` (members table added)