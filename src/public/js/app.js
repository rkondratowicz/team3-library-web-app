// Library Management System - Client-side JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Initialize components
  initializeSearch();
  initializeBookForm();
  initializeDeleteModal();

  // Set up event listeners
  setupEventListeners();
});

// Search and Filter functionality
function initializeSearch() {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const availabilityFilter = document.getElementById('availability-filter');

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      filterBooks();
    });

    // Real-time search
    if (searchInput) {
      searchInput.addEventListener('input', debounce(filterBooks, 300));
    }

    if (categoryFilter) {
      categoryFilter.addEventListener('change', filterBooks);
    }

    if (availabilityFilter) {
      availabilityFilter.addEventListener('change', filterBooks);
    }
  }
}

// Filter books based on search criteria
function filterBooks() {
  const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
  const categoryFilter = document.getElementById('category-filter')?.value || '';
  const availabilityFilter = document.getElementById('availability-filter')?.value || '';
  const bookCards = document.querySelectorAll('.book-card');

  let visibleCount = 0;

  bookCards.forEach((card) => {
    const title = card.dataset.title?.toLowerCase() || '';
    const author = card.dataset.author?.toLowerCase() || '';
    const isbn = card.dataset.isbn?.toLowerCase() || '';
    const category = card.dataset.category || '';
    const available = card.dataset.available === 'true';

    // Check search term
    const matchesSearch =
      searchTerm === '' ||
      title.includes(searchTerm) ||
      author.includes(searchTerm) ||
      isbn.includes(searchTerm);

    // Check category filter
    const matchesCategory = categoryFilter === '' || category === categoryFilter;

    // Check availability filter
    const matchesAvailability =
      availabilityFilter === '' ||
      (availabilityFilter === 'available' && available) ||
      (availabilityFilter === 'checked-out' && !available);

    const shouldShow = matchesSearch && matchesCategory && matchesAvailability;

    if (shouldShow) {
      card.style.display = 'block';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  // Show/hide no results message
  const booksGrid = document.getElementById('books-grid');
  const noResultsMessage = document.getElementById('no-results');

  if (visibleCount === 0 && bookCards.length > 0) {
    if (booksGrid) booksGrid.style.display = 'none';
    if (!noResultsMessage) {
      const message = createNoResultsMessage();
      document.getElementById('books-container').appendChild(message);
    }
  } else {
    if (booksGrid) booksGrid.style.display = '';
    if (noResultsMessage) {
      noResultsMessage.remove();
    }
  }
}

// Create no results message
function createNoResultsMessage() {
  const div = document.createElement('div');
  div.id = 'no-results';
  div.className = 'text-center py-5';
  div.innerHTML = `
        <i class="fas fa-search fa-4x text-muted mb-3"></i>
        <h3>No Books Found</h3>
        <p class="text-muted">Try adjusting your search criteria or filters.</p>
        <button class="btn btn-outline-primary" onclick="clearFilters()">
            <i class="fas fa-times"></i> Clear Filters
        </button>
    `;
  return div;
}

// Clear all filters
function _clearFilters() {
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const availabilityFilter = document.getElementById('availability-filter');

  if (searchInput) searchInput.value = '';
  if (categoryFilter) categoryFilter.value = '';
  if (availabilityFilter) availabilityFilter.value = '';

  filterBooks();
}

// Book form functionality
function initializeBookForm() {
  const bookForm = document.getElementById('book-form');
  if (!bookForm) return;

  const resetButton = document.getElementById('reset-form');
  const _submitButton = document.getElementById('submit-btn');

  bookForm.addEventListener('submit', handleBookFormSubmit);

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset the form?')) {
        bookForm.reset();
        clearFormErrors();
      }
    });
  }

  // Form validation
  const inputs = bookForm.querySelectorAll('input[required], select[required]');
  inputs.forEach((input) => {
    input.addEventListener('blur', validateField);
    input.addEventListener('input', function () {
      if (this.classList.contains('is-invalid')) {
        validateField.call(this);
      }
    });
  });
}

// Handle book form submission
async function handleBookFormSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const bookId = form.dataset.bookId;
  const submitButton = document.getElementById('submit-btn');
  const spinner = submitButton.querySelector('.spinner-border');

  // Validate form
  if (!validateForm(form)) {
    return;
  }

  // Prepare data
  const data = {};
  for (const [key, value] of formData.entries()) {
    if (key === 'available') {
      data[key] = true;
    } else if (value.trim() !== '') {
      data[key] = value.trim();
    }
  }

  // Convert numeric fields
  if (data.publishedYear) data.publishedYear = parseInt(data.publishedYear, 10);
  if (data.totalCopies) data.totalCopies = parseInt(data.totalCopies, 10);
  if (data.availableCopies) data.availableCopies = parseInt(data.availableCopies, 10);

  // Show loading state
  submitButton.disabled = true;
  if (spinner) spinner.style.display = 'inline-block';

  try {
    const url = bookId ? `/api/books/${bookId}` : '/api/books';
    const method = bookId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      // Success - redirect to books list or book detail
      const redirectUrl = bookId ? `/books/${bookId}` : '/books';
      window.location.href = redirectUrl;
    } else {
      showError(result.error || 'Failed to save book');
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    showError('Network error. Please try again.');
  } finally {
    // Hide loading state
    submitButton.disabled = false;
    if (spinner) spinner.style.display = 'none';
  }
}

// Validate individual field
function validateField() {
  const value = this.value.trim();
  let isValid = true;
  let errorMessage = '';

  // Required validation
  if (this.required && !value) {
    isValid = false;
    errorMessage = 'This field is required.';
  }

  // Type-specific validation
  if (isValid && value) {
    switch (this.type) {
      case 'number': {
        const num = parseInt(value, 10);
        const min = parseInt(this.min, 10);
        const max = parseInt(this.max, 10);

        if (Number.isNaN(num)) {
          isValid = false;
          errorMessage = 'Please enter a valid number.';
        } else if (min && num < min) {
          isValid = false;
          errorMessage = `Value must be at least ${min}.`;
        } else if (max && num > max) {
          isValid = false;
          errorMessage = `Value must be no more than ${max}.`;
        }
        break;
      }

      case 'text':
        if (this.name === 'isbn' && !isValidISBN(value)) {
          isValid = false;
          errorMessage = 'Please enter a valid ISBN.';
        }
        break;
    }
  }

  // Update field appearance
  if (isValid) {
    this.classList.remove('is-invalid');
    this.classList.add('is-valid');
  } else {
    this.classList.remove('is-valid');
    this.classList.add('is-invalid');

    const feedback = this.nextElementSibling;
    if (feedback?.classList.contains('invalid-feedback')) {
      feedback.textContent = errorMessage;
    }
  }

  return isValid;
}

// Validate entire form
function validateForm(form) {
  const inputs = form.querySelectorAll('input[required], select[required]');
  let isFormValid = true;

  inputs.forEach((input) => {
    if (!validateField.call(input)) {
      isFormValid = false;
    }
  });

  return isFormValid;
}

// Clear form validation errors
function clearFormErrors() {
  const form = document.getElementById('book-form');
  if (!form) return;

  const inputs = form.querySelectorAll('.is-invalid, .is-valid');
  inputs.forEach((input) => {
    input.classList.remove('is-invalid', 'is-valid');
  });

  hideError();
}

// ISBN validation
function isValidISBN(isbn) {
  // Remove hyphens and spaces
  const cleanISBN = isbn.replace(/[-\s]/g, '');

  // Check if it's 10 or 13 digits (with possible X for ISBN-10)
  return /^(\d{9}X|\d{10}|\d{13})$/.test(cleanISBN);
}

// Delete book functionality
function initializeDeleteModal() {
  const deleteModal = document.getElementById('deleteModal');
  if (!deleteModal) return;

  const confirmButton = document.getElementById('confirm-delete');
  if (confirmButton) {
    confirmButton.addEventListener('click', handleDeleteConfirm);
  }
}

let bookToDelete = null;

function _deleteBook(bookId) {
  bookToDelete = bookId;
  const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
  modal.show();
}

async function handleDeleteConfirm() {
  if (!bookToDelete) return;

  const confirmButton = document.getElementById('confirm-delete');
  confirmButton.disabled = true;
  confirmButton.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Deleting...';

  try {
    const response = await fetch(`/api/books/${bookToDelete}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      // If we're on the book detail page, redirect to books list
      if (window.location.pathname.includes('/books/')) {
        window.location.href = '/books';
      } else {
        // If we're on the books list, remove the card and refresh
        window.location.reload();
      }
    } else {
      const result = await response.json();
      showError(result.error || 'Failed to delete book');
    }
  } catch (error) {
    console.error('Error deleting book:', error);
    showError('Network error. Please try again.');
  } finally {
    confirmButton.disabled = false;
    confirmButton.innerHTML = 'Delete';
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
    if (modal) modal.hide();
  }
}

// Share book functionality
function _shareBook(bookId) {
  const url = `${window.location.origin}/books/${bookId}`;

  if (navigator.share) {
    navigator.share({
      title: 'Check out this book',
      url: url,
    });
  } else {
    // Fallback - copy to clipboard
    navigator.clipboard
      .writeText(url)
      .then(() => {
        showSuccess('Book URL copied to clipboard!');
      })
      .catch(() => {
        // Final fallback - show URL in prompt
        prompt('Copy this URL to share the book:', url);
      });
  }
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showError(message) {
  const errorAlert = document.getElementById('error-alert');
  const errorMessage = document.getElementById('error-message');

  if (errorAlert && errorMessage) {
    errorMessage.textContent = message;
    errorAlert.style.display = 'block';
    errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    alert(`Error: ${message}`);
  }
}

function hideError() {
  const errorAlert = document.getElementById('error-alert');
  if (errorAlert) {
    errorAlert.style.display = 'none';
  }
}

function showSuccess(message) {
  // Create a temporary success alert
  const alert = document.createElement('div');
  alert.className = 'alert alert-success alert-dismissible fade show position-fixed';
  alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px';
  alert.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;

  document.body.appendChild(alert);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (alert.parentElement) {
      alert.remove();
    }
  }, 5000);
}

function setupEventListeners() {
  // Handle navigation highlighting
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

  navLinks.forEach((link) => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
}

// Global error handler
window.addEventListener('error', (e) => {
  console.error('JavaScript error:', e.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});
