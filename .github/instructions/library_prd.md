# Book Library Web App - Product Requirements Document

## 1. Product Overview

### 1.1 Purpose
A web-based library management system that enables librarians to efficiently manage books, track member borrowing, and generate insights through statistical reporting.

### 1.2 Goals
- Streamline book and member management processes
- Provide real-time tracking of book borrowing and returns
- Generate actionable insights through borrowing statistics
- Maintain accurate inventory of books and their copies
- Enforce borrowing limits and policies

## 2. Core Features

### 2.1 Book Management

#### 2.1.1 Book Catalog
- **Add New Books**: Create book records with title, author(s), ISBN, genre, publication year, description
- **Edit Book Information**: Modify book details
- **Delete Books**: Remove books from catalog (with validation for active borrows)
- **Search & Filter**: Find books by title, author, ISBN, genre, or publication year
- **Book Details View**: Comprehensive view showing all book information and copies available

#### 2.1.2 Copy Management
- **Add Copies**: Register multiple physical copies of the same book with unique copy IDs
- **Track Copy Status**: Monitor each copy's availability (Available, Borrowed)
- **Copy History**: View borrowing history for individual copies

### 2.2 Member Management

#### 2.2.1 Member Registration
- **Add Members**: Register new members with name, contact information, address, member ID
- **Edit Member Information**: Update member details and contact information
- **Search Members**: Find members by name or ID

#### 2.2.2 Member Profile
- **Borrowing History**: Complete record of all borrowed books
- **Current Borrows**: List of currently borrowed books with due dates
- **Overdue Items**: Highlight overdue books
- **Borrowing Limits**: Display current borrowing count against maximum allowed (3 books)

### 2.3 Borrowing System

#### 2.3.1 Check-Out Process
- **Book Search**: Quick search for available books and copies
- **Member Verification**: Confirm member status and borrowing eligibility
- **Borrowing Limits**: Enforce maximum of 3 books per member
- **Due Date Assignment**: Automatic calculation of return due dates (default 14 days)
- **Transaction Recording**: Log all borrowing transactions with timestamps

#### 2.3.2 Return Process
- **Check-In**: Process book returns
- **Automatic Availability Update**: Mark copies as available upon return

#### 2.3.3 Borrowing Rules & Policies
- **Maximum Books**: 3 books per member at any time
- **Loan Period**: 14-day standard borrowing period
- **Overdue Restrictions**: Block new borrowing for members with overdue items

### 2.4 Statistics & Reporting

#### 2.4.1 Popular Books Analytics
- **Weekly Reports**: Most borrowed books in the past week
- **Monthly Reports**: Top books by borrowing frequency per month
- **Annual Reports**: Yearly borrowing trends and popular titles
- **Genre Analytics**: Most popular genres by time period
- **Author Analytics**: Most borrowed authors

#### 2.4.2 Library Usage Statistics
- **Member Activity**: Active members, new registrations, borrowing patterns
- **Collection Utilization**: Books never borrowed, high-demand titles
- **Borrowing Trends**: Peak borrowing times, seasonal patterns
- **Copy Efficiency**: Utilization rate of multiple copies

#### 2.4.3 Operational Reports
- **Overdue Summary**: List of overdue books and members
- **Inventory Status**: Available vs. borrowed copies
- **Member Compliance**: Members at borrowing limits
- **Collection Gaps**: Identify popular books needing more copies

## 3. User Interface Requirements

### 3.1 Dashboard
- **Overview Cards**: Quick stats (total books, available copies, active members, overdue items)
- **Recent Activity**: Latest borrowing and return transactions
- **Alerts**: Overdue books, low inventory warnings
- **Quick Actions**: Fast access to common tasks

### 3.2 Navigation Structure
- **Books Section**: Catalog management and copy tracking
- **Members Section**: Member profiles and management
- **Borrowing Section**: Check-out/in processes and transaction history
- **Reports Section**: Statistics and analytics dashboards
- **Search**: Global search functionality across all sections

### 3.3 Data Tables & Lists
- **Sortable Columns**: Enable sorting by relevant fields
- **Filtering Options**: Multi-criteria filtering capabilities
- **Pagination**: Handle large datasets efficiently
- **Bulk Actions**: Select multiple items for batch operations
- **Export Options**: CSV/PDF export for reports and lists

## 4. Business Rules & Constraints

### 4.1 Borrowing Constraints
- Maximum 3 books per member at any time
- 14-day standard loan period
- No new borrowing allowed with overdue items

### 4.2 Book Management Rules
- Cannot delete books with active borrows
- ISBN must be unique per book (not per copy)
- Copy IDs must be unique across entire collection

### 4.3 Member Management Rules
- Each member must have unique member ID
- Cannot delete members with active borrows

## 5. Data Management

### 5.1 Book Data Structure
- Book metadata (title, author, ISBN, genre, etc.)
- Copy tracking (copy ID, status, borrower)
- Borrowing history per book and copy

### 5.2 Member Data Structure
- Personal information and contact details
- Borrowing history and current loans
- Membership status and dates

### 5.3 Transaction Data
- Borrowing records (member, book copy, dates)
- Return records (condition, late fees)
- Statistical aggregation data for reporting

## 6. Success Metrics

### 6.1 Operational Efficiency
- Reduction in book checkout/return processing time
- Improved accuracy in inventory tracking
- Decreased manual data entry errors

### 6.2 Library Usage Insights
- Enhanced understanding of collection popularity
- Better inventory planning based on demand patterns
- Improved member engagement through data-driven decisions

### 6.3 Member Experience
- Faster service during book transactions
- Clear visibility of borrowing status and history
- Consistent enforcement of library policies