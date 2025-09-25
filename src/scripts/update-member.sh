#!/bin/bash
# Member Update Helper Script with Email Validation
# This script provides easy-to-use functions for updating member details with email validation

DB_PATH="library.db"

# Function to validate email format
validate_email() {
    local email="$1"
    
    if [[ -z "$email" ]]; then
        echo "❌ Email is required"
        return 1
    fi
    
    if [[ "$email" != *"@"* ]]; then
        echo "❌ Email must contain @ symbol"
        return 1
    fi
    
    # Basic email format validation
    if [[ ! "$email" =~ ^[^@]+@[^@]+\.[^@]+$ ]]; then
        echo "❌ Invalid email format"
        return 1
    fi
    
    echo "✅ Email format is valid"
    return 0
}

# Function to update member basic info with email validation
update_member_info() {
    local member_id="$1"
    local name="$2"
    local email="$3"
    local phone="$4"
    local address="$5"
    
    echo "Validating email address..."
    if ! validate_email "$email"; then
        echo "❌ Cannot update member: Invalid email address"
        return 1
    fi
    
    # Check if email is already in use by another member
    local email_count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM members WHERE email = '$email' AND ID != '$member_id';")
    if [ "$email_count" -gt 0 ]; then
        echo "❌ Email address is already in use by another member"
        return 1
    fi
    
    echo "Updating member $member_id..."
    
    sqlite3 "$DB_PATH" "
    UPDATE members 
    SET 
        memberName = '$name',
        email = '$email',
        phone = '$phone',
        memAddress = '$address',
        updated_at = CURRENT_TIMESTAMP
    WHERE ID = '$member_id';
    "
    
    if [ $? -eq 0 ]; then
        echo "✅ Member updated successfully"
        sqlite3 "$DB_PATH" "SELECT ID, memberName, email, phone, status FROM members WHERE ID = '$member_id';"
    else
        echo "❌ Failed to update member"
    fi
}

# Function to update member status
update_member_status() {
    local member_id="$1"
    local new_status="$2"
    
    # Validate status
    if [[ "$new_status" != "active" && "$new_status" != "suspended" && "$new_status" != "inactive" ]]; then
        echo "❌ Invalid status. Must be: active, suspended, or inactive"
        return 1
    fi
    
    echo "Changing member $member_id status to $new_status..."
    
    sqlite3 "$DB_PATH" "
    UPDATE members 
    SET status = '$new_status', updated_at = CURRENT_TIMESTAMP 
    WHERE ID = '$member_id';
    "
    
    if [ $? -eq 0 ]; then
        echo "✅ Member status updated successfully"
        sqlite3 "$DB_PATH" "SELECT ID, memberName, status FROM members WHERE ID = '$member_id';"
    else
        echo "❌ Failed to update member status"
    fi
}

# Function to update borrowing limit
update_borrowing_limit() {
    local member_id="$1"
    local new_limit="$2"
    
    # Validate limit
    if ! [[ "$new_limit" =~ ^[0-9]+$ ]] || [ "$new_limit" -lt 1 ] || [ "$new_limit" -gt 10 ]; then
        echo "❌ Invalid borrowing limit. Must be a number between 1 and 10"
        return 1
    fi
    
    echo "Setting borrowing limit for member $member_id to $new_limit books..."
    
    sqlite3 "$DB_PATH" "
    UPDATE members 
    SET max_books = $new_limit, updated_at = CURRENT_TIMESTAMP 
    WHERE ID = '$member_id';
    "
    
    if [ $? -eq 0 ]; then
        echo "✅ Borrowing limit updated successfully"
        sqlite3 "$DB_PATH" "SELECT ID, memberName, max_books FROM members WHERE ID = '$member_id';"
    else
        echo "❌ Failed to update borrowing limit"
    fi
}

# Function to check member details
check_member() {
    local member_id="$1"
    
    echo "Member Details:"
    sqlite3 "$DB_PATH" "
    SELECT 
        'ID: ' || ID,
        'Name: ' || memberName,
        'Email: ' || email,
        'Phone: ' || COALESCE(phone, 'Not provided'),
        'Address: ' || COALESCE(memAddress, 'Not provided'),
        'Status: ' || COALESCE(status, 'active'),
        'Max Books: ' || COALESCE(max_books, 3),
        'Member Since: ' || COALESCE(member_since, 'N/A'),
        'Last Updated: ' || COALESCE(updated_at, 'N/A')
    FROM members 
    WHERE ID = '$member_id';
    "
}

# Function to validate email uniqueness
check_email_available() {
    local email="$1"
    local member_id="$2"
    
    # First validate email format
    if ! validate_email "$email" >/dev/null; then
        echo "❌ Email format is invalid"
        return 1
    fi
    
    local count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM members WHERE email = '$email' AND ID != '$member_id';")
    
    if [ "$count" -eq 0 ]; then
        echo "✅ Email is available"
        return 0
    else
        echo "❌ Email is already in use by another member"
        return 1
    fi
}

# Function to create a new member with email validation
create_member() {
    local name="$1"
    local email="$2"
    local phone="$3"
    local address="$4"
    
    echo "Validating email address..."
    if ! validate_email "$email"; then
        echo "❌ Cannot create member: Invalid email address"
        return 1
    fi
    
    # Check if email already exists
    local email_count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM members WHERE email = '$email';")
    if [ "$email_count" -gt 0 ]; then
        echo "❌ Email address is already in use"
        return 1
    fi
    
    # Generate UUID for new member
    local member_id=$(uuidgen)
    
    echo "Creating new member with ID $member_id..."
    
    sqlite3 "$DB_PATH" "
    INSERT INTO members (ID, memberName, email, phone, memAddress, status, max_books, member_since, updated_at)
    VALUES ('$member_id', '$name', '$email', '$phone', '$address', 'active', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    "
    
    if [ $? -eq 0 ]; then
        echo "✅ Member created successfully"
        sqlite3 "$DB_PATH" "SELECT ID, memberName, email, status FROM members WHERE ID = '$member_id';"
    else
        echo "❌ Failed to create member"
    fi
}

# Usage examples and help
show_help() {
    echo "Member Update Helper Script with Email Validation"
    echo "Usage:"
    echo "  $0 create <name> <email> <phone> <address>"
    echo "  $0 update-info <member_id> <name> <email> <phone> <address>"
    echo "  $0 update-status <member_id> <status>"
    echo "  $0 update-limit <member_id> <max_books>"
    echo "  $0 check <member_id>"
    echo "  $0 check-email <email> <member_id>"
    echo "  $0 validate-email <email>"
    echo ""
    echo "Email Requirements:"
    echo "  - Must contain @ symbol"
    echo "  - Must follow basic email format (user@domain.tld)"
    echo "  - Must be unique across all members"
    echo ""
    echo "Status Options: active, suspended, inactive"
    echo "Max Books Range: 1-10"
    echo ""
    echo "Examples:"
    echo "  $0 create 'John Smith' 'john@email.com' '555-1234' '123 Main St'"
    echo "  $0 update-info 'uuid-123' 'John Smith' 'john@email.com' '555-1234' '123 Main St'"
    echo "  $0 update-status 'uuid-123' 'suspended'"
    echo "  $0 update-limit 'uuid-123' 5"
    echo "  $0 check 'uuid-123'"
    echo "  $0 check-email 'newemail@example.com' 'uuid-123'"
    echo "  $0 validate-email 'test@example.com'"
}

# Main script logic
case "$1" in
    create)
        if [ $# -eq 5 ]; then
            create_member "$2" "$3" "$4" "$5"
        else
            echo "❌ Usage: $0 create <name> <email> <phone> <address>"
        fi
        ;;
    update-info)
        if [ $# -eq 6 ]; then
            update_member_info "$2" "$3" "$4" "$5" "$6"
        else
            echo "❌ Usage: $0 update-info <member_id> <name> <email> <phone> <address>"
        fi
        ;;
    update-status)
        if [ $# -eq 3 ]; then
            update_member_status "$2" "$3"
        else
            echo "❌ Usage: $0 update-status <member_id> <status>"
        fi
        ;;
    update-limit)
        if [ $# -eq 3 ]; then
            update_borrowing_limit "$2" "$3"
        else
            echo "❌ Usage: $0 update-limit <member_id> <max_books>"
        fi
        ;;
    check)
        if [ $# -eq 2 ]; then
            check_member "$2"
        else
            echo "❌ Usage: $0 check <member_id>"
        fi
        ;;
    check-email)
        if [ $# -eq 3 ]; then
            check_email_available "$2" "$3"
        else
            echo "❌ Usage: $0 check-email <email> <member_id>"
        fi
        ;;
    validate-email)
        if [ $# -eq 2 ]; then
            validate_email "$2"
        else
            echo "❌ Usage: $0 validate-email <email>"
        fi
        ;;
    *)
        show_help
        ;;
esac