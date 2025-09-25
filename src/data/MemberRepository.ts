import type { Database } from "sqlite3";
import { v4 as uuidv4 } from "uuid";
import type {
  CreateMemberRequest,
  Member,
  UpdateMemberRequest,
} from "../shared/types.js";
import { validateAndSanitizeEmail } from "../shared/validation.js";

export interface IMemberRepository {
  getAllMembers(): Promise<Member[]>;
  getMemberById(id: string): Promise<Member | null>;
  getMemberByEmail(email: string): Promise<Member | null>;
  createMember(memberData: CreateMemberRequest): Promise<Member>;
  updateMember(id: string, updates: UpdateMemberRequest): Promise<Member>;
  deleteMember(id: string): Promise<boolean>;
  memberExists(id: string): Promise<boolean>;
  emailExists(email: string, excludeId?: string): Promise<boolean>;
}

export class MemberRepository implements IMemberRepository {
  private db: Database;
  constructor(database: Database) {
    this.db = database;
  }

  /**
   * Get all members from the database
   */
  getAllMembers(): Promise<Member[]> {
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
          updated_at
        FROM members 
        ORDER BY memberName ASC
      `;

      this.db.all(query, [], (err, rows: Member[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Get a member by ID
   */
  getMemberById(id: string): Promise<Member | null> {
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
          updated_at
        FROM members 
        WHERE ID = ?
      `;

      this.db.get(query, [id], (err, row: Member) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? row : null);
        }
      });
    });
  }

  /**
   * Create a new member with email validation
   */
  createMember(memberData: CreateMemberRequest): Promise<Member> {
    return new Promise((resolve, reject) => {
      // Validate email
      const emailValidation = validateAndSanitizeEmail(memberData.email);
      if (!emailValidation.isValid) {
        reject(new Error(emailValidation.error || "Invalid email"));
        return;
      }

      // Validate required fields
      if (!memberData.memberName?.trim()) {
        reject(new Error("Member name is required"));
        return;
      }

      const id = uuidv4();
      const sanitizedEmail = emailValidation.sanitizedEmail;

      // Check if email already exists
      this.emailExists(sanitizedEmail, id)
        .then((exists) => {
          if (exists) {
            reject(new Error("Email address is already in use"));
            return;
          }

          const query = `
          INSERT INTO members (ID, memberName, email, phone, memAddress, max_books, status, member_since, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;

          const params = [
            id,
            memberData.memberName.trim(),
            sanitizedEmail,
            memberData.phone || null,
            memberData.memAddress || null,
            memberData.max_books || 3,
          ];

          this.db.run(query, params, (err) => {
            if (err) {
              if (err.message.includes("UNIQUE constraint failed")) {
                reject(new Error("Email address is already in use"));
              } else if (err.message.includes("CHECK constraint failed")) {
                reject(new Error("Email must contain @ symbol"));
              } else {
                reject(err);
              }
            } else {
              // Fetch the created member
              resolve({
                id,
                memberName: memberData.memberName.trim(),
                email: sanitizedEmail,
                phone: memberData.phone || undefined,
                memAddress: memberData.memAddress || undefined,
                max_books: memberData.max_books || 3,
                status: "active",
              });
            }
          });
        })
        .catch(reject);
    });
  }

  /**
   * Update an existing member with email validation
   */
  updateMember(id: string, memberData: UpdateMemberRequest): Promise<Member> {
    return new Promise((resolve, reject) => {
      // Validate email if provided
      if (memberData.email) {
        const emailValidation = validateAndSanitizeEmail(memberData.email);
        if (!emailValidation.isValid) {
          reject(new Error(emailValidation.error || "Invalid email"));
          return;
        }
        memberData.email = emailValidation.sanitizedEmail;

        // Check if email is already in use by another member
        this.emailExists(memberData.email, id)
          .then((exists) => {
            if (exists) {
              reject(
                new Error("Email address is already in use by another member"),
              );
              return;
            }
            this.performUpdate(id, memberData, resolve, reject);
          })
          .catch(reject);
      } else {
        this.performUpdate(id, memberData, resolve, reject);
      }
    });
  }

  /**
   * Check if a member exists by ID
   */
  memberExists(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = "SELECT COUNT(*) as count FROM members WHERE ID = ?";
      this.db.get(query, [id], (err, row: { count: number }) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count > 0);
        }
      });
    });
  }

  /**
   * Check if email exists (public method for interface compliance)
   */
  emailExists(email: string, excludeId?: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const emailValidation = validateAndSanitizeEmail(email);
      if (!emailValidation.isValid) {
        reject(new Error(emailValidation.error || "Invalid email"));
        return;
      }

      let query: string;
      let params: string[];

      if (excludeId) {
        query =
          "SELECT COUNT(*) as count FROM members WHERE email = ? AND ID != ?";
        params = [emailValidation.sanitizedEmail, excludeId];
      } else {
        query = "SELECT COUNT(*) as count FROM members WHERE email = ?";
        params = [emailValidation.sanitizedEmail];
      }

      this.db.get(query, params, (err, row: { count: number }) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count > 0);
        }
      });
    });
  }

  /**
   * Perform the actual update operation
   */
  private performUpdate(
    id: string,
    memberData: UpdateMemberRequest,
    resolve: (value: Member) => void,
    reject: (reason: Error) => void,
  ): void {
    const updateFields: string[] = [];
    const params: (string | number)[] = [];

    if (memberData.memberName !== undefined) {
      if (!memberData.memberName.trim()) {
        reject(new Error("Member name cannot be empty"));
        return;
      }
      updateFields.push("memberName = ?");
      params.push(memberData.memberName.trim());
    }

    if (memberData.email !== undefined) {
      updateFields.push("email = ?");
      params.push(memberData.email);
    }

    if (memberData.phone !== undefined) {
      updateFields.push("phone = ?");
      params.push(memberData.phone);
    }

    if (memberData.memAddress !== undefined) {
      updateFields.push("memAddress = ?");
      params.push(memberData.memAddress);
    }

    if (memberData.status !== undefined) {
      updateFields.push("status = ?");
      params.push(memberData.status);
    }

    if (memberData.max_books !== undefined) {
      if (memberData.max_books < 1 || memberData.max_books > 10) {
        reject(new Error("Max books must be between 1 and 10"));
        return;
      }
      updateFields.push("max_books = ?");
      params.push(memberData.max_books);
    }

    if (updateFields.length === 0) {
      reject(new Error("No fields to update"));
      return;
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);

    const query = `UPDATE members SET ${updateFields.join(", ")} WHERE ID = ?`;

    this.db.run(query, params, (err) => {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          reject(new Error("Email address is already in use"));
        } else if (err.message.includes("CHECK constraint failed")) {
          reject(
            new Error(
              "Invalid data: Email must contain @ symbol or status/max_books values are invalid",
            ),
          );
        } else {
          reject(err);
        }
      } else {
        // Fetch the updated member
        this.getMemberById(id)
          .then((member) => {
            if (member) {
              resolve(member);
            } else {
              reject(new Error("Member not found after update"));
            }
          })
          .catch(reject);
      }
    });
  }

  /**
   * Delete a member
   */
  deleteMember(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = "DELETE FROM members WHERE ID = ?";

      this.db.run(query, [id], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  /**
   * Get member by email
   */
  getMemberByEmail(email: string): Promise<Member | null> {
    return new Promise((resolve, reject) => {
      const emailValidation = validateAndSanitizeEmail(email);
      if (!emailValidation.isValid) {
        reject(new Error(emailValidation.error || "Invalid email"));
        return;
      }

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
        WHERE email = ?
      `;

      this.db.get(
        query,
        [emailValidation.sanitizedEmail],
        (err, row: Member) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? row : null);
          }
        },
      );
    });
  }
}
