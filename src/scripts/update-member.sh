#!/bin/bash
# Member Update Helper Script
# This script provides easy-to-use functions for updating member details

DB_PATH="library.db"

# Function to update member basic info
update_member_info() {
    local member_id="$1"
    local name="$2"
    local email="$3"
    local phone="$4"
    local address="$5"
    
    echo "Updating member $member_id..."
    
    sqlite3 "$DB_PATH" "
    UPDATE members 
    SET 
        name = '$name',
        email = '$email',
        phone = '$phone',
        address = '$address',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = '$member_id';
    "
    
    if [ $? -eq 0 ]; then
        echo "✅ Member updated successfully"
        sqlite3 "$DB_PATH" "SELECT id, name, email, phone, status FROM members WHERE id = '$member_id';"
    else
        echo "❌ Failed to update member"
    fi
}

# Function to update member status
update_member_status() {
    local member_id="$1"
    local new_status="$2"
    
    echo "Changing member $member_id status to $new_status..."
    
    sqlite3 "$DB_PATH" "
    UPDATE members 
    SET status = '$new_status', updated_at = CURRENT_TIMESTAMP 
    WHERE id = '$member_id';
    "
    
    if [ $? -eq 0 ]; then
        echo "✅ Member status updated successfully"
        sqlite3 "$DB_PATH" "SELECT id, name, status FROM members WHERE id = '$member_id';"
    else
        echo "❌ Failed to update member status"
    fi
}

# Function to update borrowing limit
update_borrowing_limit() {
    local member_id="$1"
    local new_limit="$2"
    
    echo "Setting borrowing limit for member $member_id to $new_limit books..."
    
    sqlite3 "$DB_PATH" "
    UPDATE members 
    SET max_books = $new_limit, updated_at = CURRENT_TIMESTAMP 
    WHERE id = '$member_id' AND $new_limit BETWEEN 1 AND 10;
    "
    
    if [ $? -eq 0 ]; then
        echo "✅ Borrowing limit updated successfully"
        sqlite3 "$DB_PATH" "SELECT id, name, max_books FROM members WHERE id = '$member_id';"
    else
        echo "❌ Failed to update borrowing limit (must be between 1-10)"
    fi
}

# Function to check member details
check_member() {
    local member_id="$1"
    
    echo "Member Details:"
    sqlite3 "$DB_PATH" "
    SELECT 
        'ID: ' || id,
        'Name: ' || name,
        'Email: ' || email,
        'Phone: ' || COALESCE(phone, 'Not provided'),
        'Address: ' || COALESCE(address, 'Not provided'),
        'Status: ' || status,
        'Max Books: ' || max_books,
        'Member Since: ' || member_since,
        'Last Updated: ' || updated_at
    FROM members 
    WHERE id = '$member_id';
    "
}

# Function to validate email uniqueness
check_email_available() {
    local email="$1"
    local member_id="$2"
    
    local count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM members WHERE email = '$email' AND id != '$member_id';")
    
    if [ "$count" -eq 0 ]; then
        echo "✅ Email is available"
        return 0
    else
        echo "❌ Email is already in use by another member"
        return 1
    fi
}

# Usage examples and help
show_help() {
    echo "Member Update Helper Script"
    echo "Usage:"
    echo "  $0 update-info <member_id> <name> <email> <phone> <address>"
    echo "  $0 update-status <member_id> <status>"
    echo "  $0 update-limit <member_id> <max_books>"
    echo "  $0 check <member_id>"
    echo "  $0 check-email <email> <member_id>"
    echo ""
    echo "Examples:"
    echo "  $0 update-info 'uuid-123' 'John Smith' 'john@email.com' '555-1234' '123 Main St'"
    echo "  $0 update-status 'uuid-123' 'suspended'"
    echo "  $0 update-limit 'uuid-123' 5"
    echo "  $0 check 'uuid-123'"
    echo "  $0 check-email 'newemail@example.com' 'uuid-123'"
}

# Main script logic
case "$1" in
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
    *)
        show_help
        ;;
esac