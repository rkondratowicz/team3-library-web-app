# Task 2.4: Create Member Service

## Objective
Implement the business logic layer for member operations, including validation rules, member eligibility checking, and preparation for borrowing system integration.

## Current State
- Member repository implemented
- Need business logic layer following BookService pattern
- Must implement member-specific validation rules

## What You Will Create
- Complete IMemberService interface
- Full MemberService implementation
- Email format validation
- Member eligibility checking
- Business rules enforcement

## Step-by-Step Instructions

### Step 1: Create the Member Service File

1. **Create `src/business/MemberService.ts`:**
   ```bash
   touch src/business/MemberService.ts
   ```

### Step 2: Add Imports and Interface Definition

1. **Add the following content to `src/business/MemberService.ts`:**
   ```typescript
   import { v4 as uuidv4 } from 'uuid';
   import type { IMemberRepository } from '../data/MemberRepository.js';
   import type {
     Member,
     CreateMemberRequest,
     UpdateMemberRequest,
     MemberSearchFilters,
     MemberBorrowingStatus,
     BusinessResult,
   } from '../shared/types.js';

   export interface IMemberService {
     // Basic CRUD operations
     getAllMembers(): Promise<BusinessResult<Member[]>>;
     getMemberById(id: string): Promise<BusinessResult<Member>>;
     getMemberByEmail(email: string): Promise<BusinessResult<Member>>;
     createMember(memberData: CreateMemberRequest): Promise<BusinessResult<Member>>;
     updateMember(id: string, updates: UpdateMemberRequest): Promise<BusinessResult<Member>>;
     deleteMember(id: string): Promise<BusinessResult<void>>;
     
     // Search and filtering
     searchMembers(filters: MemberSearchFilters): Promise<BusinessResult<Member[]>>;
     getMembersByStatus(status: string): Promise<BusinessResult<Member[]>>;
     
     // Member validation and eligibility
     validateMemberData(memberData: CreateMemberRequest | UpdateMemberRequest): BusinessResult<void>;
     validateEmailFormat(email: string): boolean;
     checkMemberEligibility(memberId: string): Promise<BusinessResult<MemberBorrowingStatus>>;
     
     // Member statistics
     getMemberStatistics(): Promise<BusinessResult<any>>;
   }
   ```

### Step 3: Implement the MemberService Class

1. **Add the class implementation:**
   ```typescript
   export class MemberService implements IMemberService {
     constructor(private memberRepository: IMemberRepository) {}

     async getAllMembers(): Promise<BusinessResult<Member[]>> {
       try {
         const members = await this.memberRepository.getAllMembers();
         return {
           success: true,
           data: members,
           statusCode: 200,
         };
       } catch (error) {
         console.error('Error in MemberService.getAllMembers:', error);
         return {
           success: false,
           error: 'Failed to retrieve members',
           statusCode: 500,
         };
       }
     }

     async getMemberById(id: string): Promise<BusinessResult<Member>> {
       try {
         if (!id || id.trim().length === 0) {
           return {
             success: false,
             error: 'Member ID is required',
             statusCode: 400,
           };
         }

         const member = await this.memberRepository.getMemberById(id);
         if (!member) {
           return {
             success: false,
             error: 'Member not found',
             statusCode: 404,
           };
         }

         return {
           success: true,
           data: member,
           statusCode: 200,
         };
       } catch (error) {
         console.error('Error in MemberService.getMemberById:', error);
         return {
           success: false,
           error: 'Failed to retrieve member',
           statusCode: 500,
         };
       }
     }

     async getMemberByEmail(email: string): Promise<BusinessResult<Member>> {
       try {
         if (!this.validateEmailFormat(email)) {
           return {
             success: false,
             error: 'Invalid email format',
             statusCode: 400,
           };
         }

         const member = await this.memberRepository.getMemberByEmail(email);
         if (!member) {
           return {
             success: false,
             error: 'Member not found',
             statusCode: 404,
           };
         }

         return {
           success: true,
           data: member,
           statusCode: 200,
         };
       } catch (error) {
         console.error('Error in MemberService.getMemberByEmail:', error);
         return {
           success: false,
           error: 'Failed to retrieve member',
           statusCode: 500,
         };
       }
     }
   ```

### Step 4: Implement Member Creation and Updates

1. **Add create and update methods:**
   ```typescript
     async createMember(memberData: CreateMemberRequest): Promise<BusinessResult<Member>> {
       try {
         // Validate input data
         const validation = this.validateMemberData(memberData);
         if (!validation.success) {
           return validation as BusinessResult<Member>;
         }

         // Check email uniqueness
         const emailExists = await this.memberRepository.emailExists(memberData.email);
         if (emailExists) {
           return {
             success: false,
             error: 'A member with this email address already exists',
             statusCode: 409,
           };
         }

         // Create the member
         const now = new Date().toISOString();
         const member: Member = {
           id: uuidv4(),
           name: memberData.name.trim(),
           email: memberData.email.toLowerCase().trim(),
           phone: memberData.phone?.trim(),
           address: memberData.address?.trim(),
           member_since: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
           status: 'active',
           max_books: 3,
           created_at: now,
           updated_at: now,
         };

         await this.memberRepository.createMember(member);

         return {
           success: true,
           data: member,
           statusCode: 201,
         };
       } catch (error) {
         console.error('Error in MemberService.createMember:', error);
         return {
           success: false,
           error: 'Failed to create member',
           statusCode: 500,
         };
       }
     }

     async updateMember(id: string, updates: UpdateMemberRequest): Promise<BusinessResult<Member>> {
       try {
         // Check if member exists
         const existingMember = await this.memberRepository.getMemberById(id);
         if (!existingMember) {
           return {
             success: false,
             error: 'Member not found',
             statusCode: 404,
           };
         }

         // Validate update data
         const validation = this.validateMemberData(updates);
         if (!validation.success) {
           return validation as BusinessResult<Member>;
         }

         // Check email uniqueness if email is being updated
         if (updates.email && updates.email !== existingMember.email) {
           const emailExists = await this.memberRepository.emailExists(updates.email, id);
           if (emailExists) {
             return {
               success: false,
               error: 'A member with this email address already exists',
               statusCode: 409,
             };
           }
         }

         // Prepare updates with proper formatting
         const memberUpdates: Partial<Member> = {};
         if (updates.name !== undefined) memberUpdates.name = updates.name.trim();
         if (updates.email !== undefined) memberUpdates.email = updates.email.toLowerCase().trim();
         if (updates.phone !== undefined) memberUpdates.phone = updates.phone?.trim();
         if (updates.address !== undefined) memberUpdates.address = updates.address?.trim();
         if (updates.status !== undefined) memberUpdates.status = updates.status;
         if (updates.max_books !== undefined) memberUpdates.max_books = updates.max_books;

         // Update the member
         const updateSuccess = await this.memberRepository.updateMember(id, memberUpdates);
         if (!updateSuccess) {
           return {
             success: false,
             error: 'Failed to update member',
             statusCode: 500,
           };
         }

         // Return updated member
         const updatedMember = await this.memberRepository.getMemberById(id);
         return {
           success: true,
           data: updatedMember!,
           statusCode: 200,
         };
       } catch (error) {
         console.error('Error in MemberService.updateMember:', error);
         return {
           success: false,
           error: 'Failed to update member',
           statusCode: 500,
         };
       }
     }

     async deleteMember(id: string): Promise<BusinessResult<void>> {
       try {
         // Check if member exists
         const member = await this.memberRepository.getMemberById(id);
         if (!member) {
           return {
             success: false,
             error: 'Member not found',
             statusCode: 404,
           };
         }

         // TODO: Check if member has active borrows (will be implemented after Person 3 creates borrowing system)
         // For now, we'll just delete the member
         // In integration, this will check: if (member has active borrows) return error

         const deleteSuccess = await this.memberRepository.deleteMember(id);
         if (!deleteSuccess) {
           return {
             success: false,
             error: 'Failed to delete member',
             statusCode: 500,
           };
         }

         return {
           success: true,
           statusCode: 204,
         };
       } catch (error) {
         console.error('Error in MemberService.deleteMember:', error);
         return {
           success: false,
           error: 'Failed to delete member',
           statusCode: 500,
         };
       }
     }
   ```

### Step 5: Add Search and Filter Methods

1. **Add search functionality:**
   ```typescript
     async searchMembers(filters: MemberSearchFilters): Promise<BusinessResult<Member[]>> {
       try {
         // Validate search parameters
         if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
           return {
             success: false,
             error: 'Limit must be between 1 and 100',
             statusCode: 400,
           };
         }

         if (filters.offset && filters.offset < 0) {
           return {
             success: false,
             error: 'Offset cannot be negative',
             statusCode: 400,
           };
         }

         // Validate email format if provided
         if (filters.email && !this.validateEmailFormat(filters.email)) {
           return {
             success: false,
             error: 'Invalid email format in search filter',
             statusCode: 400,
           };
         }

         const members = await this.memberRepository.searchMembers(filters);

         return {
           success: true,
           data: members,
           statusCode: 200,
         };
       } catch (error) {
         console.error('Error in MemberService.searchMembers:', error);
         return {
           success: false,
           error: 'Failed to search members',
           statusCode: 500,
         };
       }
     }

     async getMembersByStatus(status: string): Promise<BusinessResult<Member[]>> {
       try {
         if (!['active', 'suspended', 'expired'].includes(status)) {
           return {
             success: false,
             error: 'Invalid status. Must be: active, suspended, or expired',
             statusCode: 400,
           };
         }

         const members = await this.memberRepository.getMembersByStatus(status);

         return {
           success: true,
           data: members,
           statusCode: 200,
         };
       } catch (error) {
         console.error('Error in MemberService.getMembersByStatus:', error);
         return {
           success: false,
           error: 'Failed to get members by status',
           statusCode: 500,
         };
       }
     }
   ```

### Step 6: Add Validation Methods

1. **Add validation helper methods:**
   ```typescript
     validateEmailFormat(email: string): boolean {
       // RFC 5322 compliant email regex (simplified version)
       const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
       return emailRegex.test(email);
     }

     validateMemberData(memberData: CreateMemberRequest | UpdateMemberRequest): BusinessResult<void> {
       // Validate required fields for creation
       if ('name' in memberData && 'email' in memberData) {
         // This is a CreateMemberRequest
         if (!memberData.name || memberData.name.trim().length === 0) {
           return {
             success: false,
             error: 'Name is required and cannot be empty',
             statusCode: 400,
           };
         }

         if (!memberData.email || memberData.email.trim().length === 0) {
           return {
             success: false,
             error: 'Email is required and cannot be empty',
             statusCode: 400,
           };
         }
       }

       // Validate name if provided
       if (memberData.name !== undefined) {
         if (memberData.name.trim().length === 0) {
           return {
             success: false,
             error: 'Name cannot be empty',
             statusCode: 400,
           };
         }

         if (memberData.name.length > 255) {
           return {
             success: false,
             error: 'Name must be 255 characters or less',
             statusCode: 400,
           };
         }
       }

       // Validate email format if provided
       if (memberData.email !== undefined) {
         if (!this.validateEmailFormat(memberData.email)) {
           return {
             success: false,
             error: 'Invalid email format',
             statusCode: 400,
           };
         }

         if (memberData.email.length > 255) {
           return {
             success: false,
             error: 'Email must be 255 characters or less',
             statusCode: 400,
           };
         }
       }

       // Validate phone if provided
       if (memberData.phone !== undefined && memberData.phone) {
         if (memberData.phone.length > 20) {
           return {
             success: false,
             error: 'Phone number must be 20 characters or less',
             statusCode: 400,
           };
         }

         // Basic phone format validation (digits, spaces, hyphens, parentheses, plus)
         const phoneRegex = /^[\d\s\-\(\)\+]+$/;
         if (!phoneRegex.test(memberData.phone)) {
           return {
             success: false,
             error: 'Invalid phone number format',
             statusCode: 400,
           };
         }
       }

       // Validate status if provided
       if (memberData.status !== undefined) {
         if (!['active', 'suspended', 'expired'].includes(memberData.status)) {
           return {
             success: false,
             error: 'Invalid status. Must be: active, suspended, or expired',
             statusCode: 400,
           };
         }
       }

       // Validate max_books if provided
       if (memberData.max_books !== undefined) {
         if (memberData.max_books < 0 || memberData.max_books > 10) {
           return {
             success: false,
             error: 'Maximum books must be between 0 and 10',
             statusCode: 400,
           };
         }
       }

       return {
         success: true,
         statusCode: 200,
       };
     }
   ```

### Step 7: Add Member Eligibility Checking

1. **Add eligibility checking method (placeholder for borrowing integration):**
   ```typescript
     async checkMemberEligibility(memberId: string): Promise<BusinessResult<MemberBorrowingStatus>> {
       try {
         const member = await this.memberRepository.getMemberById(memberId);
         if (!member) {
           return {
             success: false,
             error: 'Member not found',
             statusCode: 404,
           };
         }

         // Basic eligibility check
         const restrictions: string[] = [];
         let canBorrow = true;

         // Check member status
         if (member.status !== 'active') {
           canBorrow = false;
           if (member.status === 'suspended') {
             restrictions.push('Member account is suspended');
           } else if (member.status === 'expired') {
             restrictions.push('Member account has expired');
           }
         }

         // TODO: Check current borrowed count and overdue items
         // This will be implemented after Person 3 creates the borrowing system
         const currentBorrowedCount = 0; // Placeholder
         const overdueCount = 0; // Placeholder

         if (currentBorrowedCount >= member.max_books) {
           canBorrow = false;
           restrictions.push(`Member has reached maximum borrowing limit (${member.max_books} books)`);
         }

         if (overdueCount > 0) {
           canBorrow = false;
           restrictions.push(`Member has ${overdueCount} overdue item(s)`);
         }

         const borrowingStatus: MemberBorrowingStatus = {
           member_id: member.id,
           member_name: member.name,
           current_borrowed_count: currentBorrowedCount,
           max_books: member.max_books,
           overdue_count: overdueCount,
           can_borrow: canBorrow,
           status: member.status,
           restrictions,
         };

         return {
           success: true,
           data: borrowingStatus,
           statusCode: 200,
         };
       } catch (error) {
         console.error('Error in MemberService.checkMemberEligibility:', error);
         return {
           success: false,
           error: 'Failed to check member eligibility',
           statusCode: 500,
         };
       }
     }
   ```

### Step 8: Add Statistics Method

1. **Add statistics method for analytics:**
   ```typescript
     async getMemberStatistics(): Promise<BusinessResult<any>> {
       try {
         const totalMembers = await this.memberRepository.getMemberCount();
         const activeMembers = await this.memberRepository.getActiveMemberCount();
         
         // Get members by status
         const suspendedMembers = await this.memberRepository.getMembersByStatus('suspended');
         const expiredMembers = await this.memberRepository.getMembersByStatus('expired');
         
         // Get recent registrations (last 30 days)
         const thirtyDaysAgo = new Date();
         thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
         const recentMembers = await this.memberRepository.getMembersRegisteredSince(
           thirtyDaysAgo.toISOString().split('T')[0]
         );

         const statistics = {
           total_members: totalMembers,
           active_members: activeMembers,
           suspended_members: suspendedMembers.length,
           expired_members: expiredMembers.length,
           recent_registrations: recentMembers.length,
           active_percentage: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0,
         };

         return {
           success: true,
           data: statistics,
           statusCode: 200,
         };
       } catch (error) {
         console.error('Error in MemberService.getMemberStatistics:', error);
         return {
           success: false,
           error: 'Failed to get member statistics',
           statusCode: 500,
         };
       }
     }
   }
   ```

### Step 9: Test the Service

1. **Compile TypeScript to check for errors:**
   ```bash
   npm run build
   ```

2. **Fix any compilation errors that appear**

## Expected Results
- ✅ Complete IMemberService interface defined
- ✅ Full MemberService class implemented  
- ✅ Email format validation working
- ✅ Member data validation comprehensive
- ✅ Member eligibility checking prepared
- ✅ Business rules enforced
- ✅ Search and filtering functional
- ✅ Statistics method for analytics
- ✅ TypeScript compilation successful

## Troubleshooting

### If compilation fails:
1. Check that all imported types exist in types.ts
2. Verify method signatures match interface exactly
3. Ensure all BusinessResult return types are correct

### If validation logic fails:
1. Test email validation with known valid/invalid emails
2. Verify phone number validation logic
3. Check name and field length validations

### If member creation fails:
1. Check UUID generation is working
2. Verify date formatting for member_since field
3. Test email uniqueness validation

## Next Steps
After completing this task, proceed to Task 2.5: Create Member Controller.

## Files Created
- ✅ `src/business/MemberService.ts` (new, complete implementation)