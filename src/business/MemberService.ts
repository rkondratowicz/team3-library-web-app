import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';

import type { BusinessResult, Member, MemberWithBorrowings } from '../shared/types.js';

export interface IMemberService {
  getAllMembers(): Promise<{ success: boolean; data?: Member[]; error?: string }>;
  searchMembers(searchTerm: string): Promise<{ success: boolean; data?: Member[]; error?: string }>;
  getMemberById(id: string): Promise<{ success: boolean; data?: Member; error?: string }>;
  getMemberWithBorrowings(id: string): Promise<BusinessResult<MemberWithBorrowings>>;
  createMember(memberData: {
    memberName: string;
    email: string;
    phone?: string;
    memAddress?: string;
  }): Promise<{ success: boolean; data?: Member; error?: string }>;
  updateMember(
    id: string,
    memberData: { memberName?: string; email?: string; phone?: string; memAddress?: string },
  ): Promise<{ success: boolean; data?: Member; error?: string }>;
  deleteMember(id: string): Promise<{ success: boolean; error?: string }>;
}

export class MemberService implements IMemberService {
  private db: sqlite3.Database;

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    this.db = new sqlite3.Database(join(__dirname, '../../library.db'), (err) => {
      if (err) {
        console.error('Error opening member database:', err);
      }
    });
  }

  /**
   * Get all members
   */
  async getAllMembers(): Promise<{ success: boolean; data?: Member[]; error?: string }> {
    return new Promise((resolve) => {
      const query = `
        SELECT 
          ID as id,
          memberName,
          email,
          phone,
          memAddress,
          status,
          max_books,
          member_since,
          updated_at
        FROM members 
        ORDER BY memberName ASC
      `;

      this.db.all(query, [], (err, rows: Member[]) => {
        if (err) {
          console.error('Error fetching members:', err);
          resolve({ success: false, error: 'Failed to fetch members' });
        } else {
          resolve({ success: true, data: rows });
        }
      });
    });
  }

  /**
   * Search members by name, email, or phone
   */
  async searchMembers(
    searchTerm: string,
  ): Promise<{ success: boolean; data?: Member[]; error?: string }> {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return this.getAllMembers();
    }

    return new Promise((resolve) => {
      const query = `
        SELECT 
          ID as id,
          memberName,
          email,
          phone,
          memAddress,
          status,
          max_books,
          member_since,
          updated_at
        FROM members 
        WHERE 
          memberName LIKE ? OR 
          email LIKE ? OR 
          COALESCE(phone, '') LIKE ?
        ORDER BY memberName ASC
      `;

      const searchPattern = `%${searchTerm.trim()}%`;
      const params = [searchPattern, searchPattern, searchPattern];

      this.db.all(query, params, (err, rows: Member[]) => {
        if (err) {
          console.error('Error searching members:', err);
          resolve({ success: false, error: 'Failed to search members' });
        } else {
          resolve({ success: true, data: rows });
        }
      });
    });
  }

  /**
   * Get member by ID
   */
  async getMemberById(id: string): Promise<{ success: boolean; data?: Member; error?: string }> {
    if (!id) {
      return { success: false, error: 'Member ID is required' };
    }

    return new Promise((resolve) => {
      const query = `
        SELECT 
          ID as id,
          memberName,
          email,
          phone,
          memAddress,
          status,
          max_books,
          member_since,
          updated_at
        FROM members 
        WHERE ID = ?
      `;

      this.db.get(query, [id], (err, row: Member) => {
        if (err) {
          console.error('Error fetching member by ID:', err);
          resolve({ success: false, error: 'Failed to fetch member' });
        } else if (!row) {
          resolve({ success: false, error: 'Member not found' });
        } else {
          resolve({ success: true, data: row });
        }
      });
    });
  }

  /**
   * Get member with their current borrowings and overdue status
   */
  async getMemberWithBorrowings(id: string): Promise<BusinessResult<MemberWithBorrowings>> {
    if (!id) {
      return { success: false, error: 'Member ID is required', statusCode: 400 };
    }

    return new Promise((resolve) => {
      // First get the member details
      const memberQuery = `
        SELECT 
          ID as id,
          memberName,
          email,
          phone,
          memAddress,
          status,
          max_books,
          member_since,
          updated_at
        FROM members 
        WHERE ID = ?
      `;

      this.db.get(memberQuery, [id], (err, member: Member) => {
        if (err) {
          console.error('Error fetching member by ID:', err);
          resolve({ success: false, error: 'Failed to fetch member', statusCode: 500 });
          return;
        }

        if (!member) {
          resolve({ success: false, error: 'Member not found', statusCode: 404 });
          return;
        }

        // Now get their current borrowings with book details
        const borrowingsQuery = `
          SELECT 
            b.id,
            b.member_id,
            b.book_copy_id,
            b.borrowed_date,
            b.due_date,
            b.returned_date,
            b.renewal_count,
            b.status,
            b.notes,
            b.created_at,
            b.updated_at,
            m.memberName as member_name,
            m.email as member_email,
            bk.title as book_title,
            bk.author as book_author,
            bk.isbn as book_isbn,
            bc.copy_number,
            -- Calculate days borrowed
            CASE 
              WHEN b.returned_date IS NOT NULL 
              THEN julianday(b.returned_date) - julianday(b.borrowed_date)
              ELSE julianday('now') - julianday(b.borrowed_date)
            END as days_borrowed,
            -- Calculate overdue days
            CASE 
              WHEN b.returned_date IS NULL AND julianday('now') > julianday(b.due_date)
              THEN julianday('now') - julianday(b.due_date)
              ELSE 0
            END as overdue_days,
            -- Check if overdue
            CASE 
              WHEN b.returned_date IS NULL AND julianday('now') > julianday(b.due_date)
              THEN 1 
              ELSE 0 
            END as is_overdue,
            -- Check if can renew (less than 3 renewals and not overdue)
            CASE 
              WHEN b.returned_date IS NULL AND b.renewal_count < 3 AND julianday('now') <= julianday(b.due_date)
              THEN 1 
              ELSE 0 
            END as can_renew
          FROM borrowings b
          JOIN members m ON b.member_id = m.ID
          JOIN book_copies bc ON b.book_copy_id = bc.id
          JOIN books bk ON bc.book_id = bk.id
          WHERE b.member_id = ? AND b.returned_date IS NULL
          ORDER BY b.due_date ASC
        `;

        interface BorrowingQueryRow {
          id: string;
          member_id: string;
          book_copy_id: string;
          borrowed_date: string;
          due_date: string;
          returned_date: string | null; // SQL result can be null
          renewal_count: number;
          status: string;
          notes: string | null; // SQL result can be null
          created_at: string;
          updated_at: string;
          member_name: string;
          member_email: string;
          book_title: string;
          book_author: string;
          book_isbn: string | null; // SQL result can be null
          copy_number: number;
          days_borrowed: number;
          overdue_days: number;
          is_overdue: number;
          can_renew: number;
        }

        this.db.all(borrowingsQuery, [id], (borrowErr, borrowings: BorrowingQueryRow[]) => {
          if (borrowErr) {
            console.error('Error fetching member borrowings:', borrowErr);
            resolve({
              success: false,
              error: 'Failed to fetch borrowing details',
              statusCode: 500,
            });
            return;
          }

          // Process borrowings and add computed fields
          const processedBorrowings = borrowings.map((row) => ({
            id: row.id,
            member_id: row.member_id,
            book_copy_id: row.book_copy_id,
            borrowed_date: row.borrowed_date,
            due_date: row.due_date,
            returned_date: row.returned_date || undefined, // Convert null to undefined
            renewal_count: row.renewal_count,
            status: row.status as import('../shared/types.js').BorrowingStatus,
            notes: row.notes || undefined, // Convert null to undefined
            created_at: row.created_at,
            updated_at: row.updated_at,
            member_name: row.member_name,
            member_email: row.member_email,
            book_title: row.book_title,
            book_author: row.book_author,
            book_isbn: row.book_isbn || undefined, // Convert null to undefined
            copy_number: row.copy_number,
            days_borrowed: Math.round(row.days_borrowed * 10) / 10, // Round to 1 decimal
            overdue_days: Math.max(0, Math.floor(row.overdue_days)), // Round down to full days
            is_overdue: Boolean(row.is_overdue),
            can_renew: Boolean(row.can_renew),
          }));

          const overdueCount = processedBorrowings.filter((b) => b.is_overdue).length;
          const canBorrowMore =
            member.status === 'active' &&
            processedBorrowings.length < (member.max_books || 3) &&
            overdueCount === 0;

          const memberWithBorrowings: MemberWithBorrowings = {
            ...member,
            current_borrowings: processedBorrowings,
            borrowing_count: processedBorrowings.length,
            overdue_count: overdueCount,
            can_borrow_more: canBorrowMore,
          };

          resolve({
            success: true,
            data: memberWithBorrowings,
            statusCode: 200,
          });
        });
      });
    });
  }

  /**
   * Create new member
   */
  async createMember(memberData: {
    memberName: string;
    email: string;
    phone?: string;
    memAddress?: string;
  }): Promise<{ success: boolean; data?: Member; error?: string }> {
    if (!memberData.memberName?.trim()) {
      return { success: false, error: 'Member name is required' };
    }

    if (!memberData.email?.trim()) {
      return { success: false, error: 'Email is required' };
    }

    const id = this.generateId();

    return new Promise((resolve) => {
      const query = `
        INSERT INTO members (ID, memberName, email, phone, memAddress)
        VALUES (?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        memberData.memberName.trim(),
        memberData.email.trim(),
        memberData.phone || undefined,
        memberData.memAddress || undefined,
      ];

      this.db.run(query, params, (err) => {
        if (err) {
          console.error('Error creating member:', err);
          if (err.message.includes('UNIQUE constraint failed')) {
            resolve({ success: false, error: 'Email address is already in use' });
          } else {
            resolve({ success: false, error: 'Failed to create member' });
          }
        } else {
          // Fetch the created member
          this.getMemberById(id).then((result) => {
            resolve(result);
          });
        }
      });
    });
  }

  /**
   * Update member
   */
  async updateMember(
    id: string,
    memberData: {
      memberName?: string;
      email?: string;
      phone?: string;
      memAddress?: string;
      status?: string;
      max_books?: number;
    },
  ): Promise<{ success: boolean; data?: Member; error?: string }> {
    if (!id) {
      return { success: false, error: 'Member ID is required' };
    }

    const updateFields: string[] = [];
    const params: (string | undefined | number)[] = [];

    if (memberData.memberName !== undefined) {
      if (!memberData.memberName.trim()) {
        return { success: false, error: 'Member name cannot be empty' };
      }
      updateFields.push('memberName = ?');
      params.push(memberData.memberName.trim());
    }

    if (memberData.email !== undefined) {
      updateFields.push('email = ?');
      params.push(memberData.email);
    }

    if (memberData.phone !== undefined) {
      updateFields.push('phone = ?');
      params.push(memberData.phone);
    }

    if (memberData.memAddress !== undefined) {
      updateFields.push('memAddress = ?');
      params.push(memberData.memAddress);
    }

    if (memberData.status !== undefined) {
      updateFields.push('status = ?');
      params.push(memberData.status);
    }

    if (memberData.max_books !== undefined) {
      updateFields.push('max_books = ?');
      params.push(memberData.max_books);
    }

    if (updateFields.length === 0) {
      return { success: false, error: 'No fields to update' };
    }

    params.push(id);

    return new Promise((resolve) => {
      const query = `UPDATE members SET ${updateFields.join(', ')} WHERE ID = ?`;

      this.db.run(query, params, function (err) {
        if (err) {
          console.error('Error updating member:', err);
          if (err.message.includes('UNIQUE constraint failed')) {
            resolve({ success: false, error: 'Email address is already in use' });
          } else {
            resolve({ success: false, error: 'Failed to update member' });
          }
        } else if (this.changes === 0) {
          resolve({ success: false, error: 'Member not found' });
        } else {
          // Return success without fetching the updated member for simplicity
          resolve({ success: true });
        }
      });
    });
  }

  /**
   * Delete member
   */
  async deleteMember(id: string): Promise<{ success: boolean; error?: string }> {
    if (!id) {
      return { success: false, error: 'Member ID is required' };
    }

    return new Promise((resolve) => {
      const query = 'DELETE FROM members WHERE ID = ?';

      this.db.run(query, [id], function (err) {
        if (err) {
          console.error('Error deleting member:', err);
          resolve({ success: false, error: 'Failed to delete member' });
        } else if (this.changes === 0) {
          resolve({ success: false, error: 'Member not found' });
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  /**
   * Generate a unique ID for new members
   */
  private generateId(): string {
    return uuidv4();
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
