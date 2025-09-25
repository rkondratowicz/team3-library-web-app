import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sqlite3 from 'sqlite3';
import type { Member } from '../shared/types.js';

interface MemberRow {
  id: string;
  memberName: string;
  email: string;
  phone: string | null;
  memAddress: string | null;
  status: string;
  max_books: number;
  username: string | null;
  password_hash: string | null;
}

export interface IMemberRepository {
  getMemberById(id: string): Promise<Member | null>;
  getMemberByEmail(email: string): Promise<Member | null>;
  getMemberByUsername(username: string): Promise<Member | null>;
  getAllMembers(): Promise<Member[]>;
  createMember(member: Omit<Member, 'id'>): Promise<Member | null>;
  updateMember(id: string, updates: Partial<Member>): Promise<Member | null>;
  deleteMember(id: string): Promise<boolean>;
  setMemberPassword(id: string, passwordHash: string): Promise<boolean>;
  memberExists(id: string): Promise<boolean>;
}

export class MemberRepository implements IMemberRepository {
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

  async getMemberById(id: string): Promise<Member | null> {
    return new Promise((resolve, reject) => {
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
          updated_at,
          username,
          password_hash
        FROM members 
        WHERE ID = ?
      `;

      this.db.get(query, [id], (err: Error | null, row: MemberRow | undefined) => {
        if (err) {
          reject(new Error(`Failed to get member by ID: ${err.message}`));
        } else {
          resolve((row as Member) || null);
        }
      });
    });
  }

  async getMemberByEmail(email: string): Promise<Member | null> {
    return new Promise((resolve, reject) => {
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
          updated_at,
          username,
          password_hash
        FROM members 
        WHERE email = ?
      `;

      this.db.get(query, [email], (err: Error | null, row: MemberRow | undefined) => {
        if (err) {
          reject(new Error(`Failed to get member by email: ${err.message}`));
        } else {
          resolve((row as Member) || null);
        }
      });
    });
  }

  async getMemberByUsername(username: string): Promise<Member | null> {
    return new Promise((resolve, reject) => {
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
          updated_at,
          username,
          password_hash
        FROM members 
        WHERE username = ?
      `;

      this.db.get(query, [username], (err: Error | null, row: MemberRow | undefined) => {
        if (err) {
          reject(new Error(`Failed to get member by username: ${err.message}`));
        } else {
          resolve((row as Member) || null);
        }
      });
    });
  }

  async getAllMembers(): Promise<Member[]> {
    return new Promise((resolve, reject) => {
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
          updated_at,
          username,
          password_hash
        FROM members 
        ORDER BY memberName
      `;

      this.db.all(query, [], (err: Error | null, rows: MemberRow[]) => {
        if (err) {
          reject(new Error(`Failed to get all members: ${err.message}`));
        } else {
          resolve((rows as Member[]) || []);
        }
      });
    });
  }

  async createMember(member: Omit<Member, 'id'>): Promise<Member | null> {
    return new Promise((resolve, reject) => {
      const id = `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const query = `
        INSERT INTO members (
          ID, memberName, email, phone, memAddress, status, max_books, username, password_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        id,
        member.memberName,
        member.email,
        member.phone || null,
        member.memAddress || null,
        member.status || 'active',
        member.max_books || 3,
        member.username || null,
        member.password_hash || null,
      ];

      this.db.run(query, values, (err: Error | null) => {
        if (err) {
          reject(new Error(`Failed to create member: ${err.message}`));
        } else {
          // Return the created member
          resolve({
            id,
            ...member,
          } as Member);
        }
      });
    });
  }

  async updateMember(id: string, updates: Partial<Member>): Promise<Member | null> {
    return new Promise((resolve, reject) => {
      // Build dynamic UPDATE query
      const updateFields: string[] = [];
      const values: (string | number | null)[] = [];

      if (updates.memberName !== undefined) {
        updateFields.push('memberName = ?');
        values.push(updates.memberName);
      }
      if (updates.email !== undefined) {
        updateFields.push('email = ?');
        values.push(updates.email);
      }
      if (updates.phone !== undefined) {
        updateFields.push('phone = ?');
        values.push(updates.phone);
      }
      if (updates.memAddress !== undefined) {
        updateFields.push('memAddress = ?');
        values.push(updates.memAddress);
      }
      if (updates.status !== undefined) {
        updateFields.push('status = ?');
        values.push(updates.status);
      }
      if (updates.max_books !== undefined) {
        updateFields.push('max_books = ?');
        values.push(updates.max_books);
      }
      if (updates.username !== undefined) {
        updateFields.push('username = ?');
        values.push(updates.username);
      }
      if (updates.password_hash !== undefined) {
        updateFields.push('password_hash = ?');
        values.push(updates.password_hash);
      }

      if (updateFields.length === 0) {
        resolve(null);
        return;
      }

      values.push(id); // For WHERE clause

      const query = `
        UPDATE members 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE ID = ?
      `;

      this.db.run(query, values, async (err: Error | null) => {
        if (err) {
          reject(new Error(`Failed to update member: ${err.message}`));
        } else {
          // Return updated member
          try {
            const updated = await this.getMemberById(id);
            resolve(updated);
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  }

  async deleteMember(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM members WHERE ID = ?';

      this.db.run(query, [id], (err: Error | null) => {
        if (err) {
          reject(new Error(`Failed to delete member: ${err.message}`));
        } else {
          resolve(true);
        }
      });
    });
  }

  async setMemberPassword(id: string, passwordHash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE members 
        SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE ID = ?
      `;

      this.db.run(query, [passwordHash, id], function (err: Error | null) {
        if (err) {
          reject(new Error(`Failed to set member password: ${err.message}`));
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async memberExists(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT 1 FROM members WHERE ID = ? LIMIT 1',
        [id],
        (err: Error | null, row: unknown) => {
          if (err) {
            reject(new Error(`Failed to check member existence: ${err.message}`));
          } else {
            resolve(!!row);
          }
        },
      );
    });
  }
}
