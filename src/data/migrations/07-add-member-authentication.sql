-- Migration: Add authentication columns to members table
-- Description: Add username and password columns for member login functionality

-- Add username column
ALTER TABLE members ADD COLUMN username TEXT;

-- Add password column (hashed password)
ALTER TABLE members ADD COLUMN password_hash TEXT;

-- Create index on username for faster login lookups
CREATE INDEX idx_members_username ON members(username);

-- Update existing members with default usernames (they can change later)
-- Using email prefix as default username
UPDATE members 
SET username = SUBSTR(email, 1, INSTR(email, '@') - 1)
WHERE username IS NULL;