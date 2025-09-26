// Test script to verify the borrower information feature
import sqlite3 from 'sqlite3';
import { BookRepository } from './dist/data/BookRepository.js';

const db = new sqlite3.Database('library.db');
const bookRepository = new BookRepository(db);

async function testBorrowerFeature() {
  try {
    console.log('Testing borrower information feature...\n');

    // Get a book with borrowings
    const bookId = '550e8400-e29b-41d4-a716-446655440001'; // To Kill a Mockingbird

    console.log(`Testing book ID: ${bookId}\n`);

    // Test the new method
    const copiesWithBorrowers = await bookRepository.getBookCopiesWithBorrowers(bookId);

    console.log('Book copies with borrower information:');
    copiesWithBorrowers.forEach((copy) => {
      console.log(`\nCopy #${copy.copy_number}:`);
      console.log(`  Status: ${copy.status}`);
      console.log(`  Condition: ${copy.condition}`);

      if (copy.borrower) {
        console.log(`  Borrower: ${copy.borrower.name}`);
        console.log(`  Email: ${copy.borrower.email}`);
        console.log(`  Borrowed Date: ${copy.borrower.borrowed_date}`);
        console.log(`  Due Date: ${copy.borrower.due_date}`);
      } else {
        console.log(`  Borrower: None (Available)`);
      }
    });

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    db.close();
  }
}

testBorrowerFeature();
