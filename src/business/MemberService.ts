import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { Member } from '../shared/types.js';

export interface MemberBorrowedBook {
  borrowingId: string;
  bookCopyId: string;
  bookId: string;
  title: string;
  author: string;
  copyNumber: number;
  borrowedDate: string;
  dueDate: string;
  status: 'active' | 'returned' | 'overdue' | 'lost';
}

export interface IMemberService {
  getAllMembers(): Promise<{ success: boolean; data?: Member[]; error?: string }>;
  searchMembers(searchTerm: string): Promise<{ success: boolean; data?: Member[]; error?: string }>;
  getMemberById(id: string): Promise<{ success: boolean; data?: Member; error?: string }>;
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
  getMemberBorrowedBooks(
    memberId: string,
  ): Promise<{ success: boolean; data?: MemberBorrowedBook[]; error?: string }>;
  returnBook(borrowingId: string): Promise<{ success: boolean; error?: string }>;
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
        memberData.phone || null,
        memberData.memAddress || null,
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
    const params: (string | null | number)[] = [];

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
   * Get all books currently borrowed by a member
   */
  async getMemberBorrowedBooks(
    memberId: string,
  ): Promise<{ success: boolean; data?: MemberBorrowedBook[]; error?: string }> {
    if (!memberId) {
      return { success: false, error: 'Member ID is required' };
    }

    return new Promise((resolve) => {
      const query = `
        SELECT 
          b.id as borrowingId,
          b.book_copy_id as bookCopyId,
          bc.book_id as bookId,
          books.title,
          books.author,
          bc.copy_number as copyNumber,
          b.borrowed_date as borrowedDate,
          b.due_date as dueDate,
          b.status
        FROM borrowings b
        JOIN book_copies bc ON b.book_copy_id = bc.id
        JOIN books ON bc.book_id = books.id
        WHERE b.member_id = ? AND b.status = 'active'
        ORDER BY b.borrowed_date DESC
      `;

      this.db.all(query, [memberId], (err, rows: MemberBorrowedBook[]) => {
        if (err) {
          console.error('Error getting member borrowed books:', err);
          resolve({ success: false, error: 'Failed to fetch borrowed books' });
        } else {
          resolve({ success: true, data: rows });
        }
      });
    });
  }

  /**
   * Return a borrowed book
   */
  async returnBook(borrowingId: string): Promise<{ success: boolean; error?: string }> {
    if (!borrowingId) {
      return { success: false, error: 'Borrowing ID is required' };
    }

    return new Promise((resolve) => {
      const db = this.db;

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Update borrowing record
        const updateBorrowingQuery = `
          UPDATE borrowings 
          SET status = 'returned', 
              returned_date = DATE('now'),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND status = 'active'
        `;

        db.run(updateBorrowingQuery, [borrowingId], function (err) {
          if (err) {
            console.error('Error updating borrowing record:', err);
            db.run('ROLLBACK');
            resolve({ success: false, error: 'Failed to update borrowing record' });
            return;
          }

          if (this.changes === 0) {
            db.run('ROLLBACK');
            resolve({ success: false, error: 'Borrowing not found or already returned' });
            return;
          }

          // Update book copy status to available
          const updateCopyQuery = `
            UPDATE book_copies 
            SET status = 'available', 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = (
              SELECT book_copy_id 
              FROM borrowings 
              WHERE id = ?
            )
          `;

          db.run(updateCopyQuery, [borrowingId], (err: Error | null) => {
            if (err) {
              console.error('Error updating book copy status:', err);
              db.run('ROLLBACK');
              resolve({ success: false, error: 'Failed to update book copy status' });
              return;
            }

            db.run('COMMIT');
            resolve({ success: true });
          });
        });
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
