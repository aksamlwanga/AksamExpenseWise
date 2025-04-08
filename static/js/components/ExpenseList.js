class ExpenseList {
  constructor(options) {
    this.onEdit = options.onEdit || (() => {});
    this.onDelete = options.onDelete || (() => {});
    this.onFilter = options.onFilter || (() => {});
    this.onAdd = options.onAdd || (() => {});
    this.expenses = [];
    this.categories = [];
  }

  render(expenses = [], categories = []) {
    this.expenses = expenses;
    this.categories = categories;
    
    const container = document.createElement('div');
    container.className = 'container py-4';
    
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="h3">Expenses</h1>
        <button id="add-expense" class="btn btn-primary">
          <i class="fas fa-plus"></i> Add Expense
        </button>
      </div>
      
      <div class="card bg-dark text-white mb-4">
        <div class="card-header">
          <h5 class="card-title mb-0">Filters</h5>
        </div>
        <div class="card-body">
          <form id="filter-form" class="row g-3">
            <div class="col-md-3">
              <label for="filter-start-date" class="form-label">Start Date</label>
              <input type="date" class="form-control" id="filter-start-date">
            </div>
            <div class="col-md-3">
              <label for="filter-end-date" class="form-label">End Date</label>
              <input type="date" class="form-control" id="filter-end-date">
            </div>
            <div class="col-md-3">
              <label for="filter-category" class="form-label">Category</label>
              <select class="form-select" id="filter-category">
                <option value="">All Categories</option>
                ${this.renderCategoryOptions()}
              </select>
            </div>
            <div class="col-md-3">
              <label for="filter-sort" class="form-label">Sort By</label>
              <select class="form-select" id="filter-sort">
                <option value="date-desc">Date (Newest First)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="amount-desc">Amount (Highest First)</option>
                <option value="amount-asc">Amount (Lowest First)</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
              </select>
            </div>
            <div class="col-12">
              <button type="submit" class="btn btn-primary">Apply Filters</button>
              <button type="button" id="reset-filters" class="btn btn-outline-secondary">Reset</button>
            </div>
          </form>
        </div>
      </div>
      
      <div class="card bg-dark text-white">
        <div class="card-header">
          <h5 class="card-title mb-0">Expense List</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-dark table-hover" id="expense-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Receipts</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.renderExpenseRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    // Initialize event listeners
    setTimeout(() => {
      const addButton = container.querySelector('#add-expense');
      const filterForm = container.querySelector('#filter-form');
      const resetFiltersButton = container.querySelector('#reset-filters');
      
      addButton.addEventListener('click', () => {
        this.onAdd();
      });
      
      filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.applyFilters();
      });
      
      resetFiltersButton.addEventListener('click', () => {
        this.resetFilters();
      });
      
      // Set up edit and delete buttons
      const editButtons = container.querySelectorAll('.edit-expense');
      const deleteButtons = container.querySelectorAll('.delete-expense');
      
      editButtons.forEach(button => {
        button.addEventListener('click', () => {
          const expenseId = parseInt(button.getAttribute('data-expense-id'));
          this.onEdit(expenseId);
        });
      });
      
      deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
          const expenseId = parseInt(button.getAttribute('data-expense-id'));
          this.onDelete(expenseId);
        });
      });
    }, 0);
    
    return container;
  }

  update(expenses, categories) {
    this.expenses = expenses;
    this.categories = categories;
    
    const tableBody = document.querySelector('#expense-table tbody');
    if (tableBody) {
      tableBody.innerHTML = this.renderExpenseRows();
      
      // Re-add event listeners
      const editButtons = tableBody.querySelectorAll('.edit-expense');
      const deleteButtons = tableBody.querySelectorAll('.delete-expense');
      
      editButtons.forEach(button => {
        button.addEventListener('click', () => {
          const expenseId = parseInt(button.getAttribute('data-expense-id'));
          this.onEdit(expenseId);
        });
      });
      
      deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
          const expenseId = parseInt(button.getAttribute('data-expense-id'));
          this.onDelete(expenseId);
        });
      });
    }
  }

  renderCategoryOptions() {
    if (!this.categories || this.categories.length === 0) {
      return '';
    }
    
    return this.categories.map(category => {
      return `<option value="${category.id}">${category.name}</option>`;
    }).join('');
  }

  renderExpenseRows() {
    if (!this.expenses || this.expenses.length === 0) {
      return '<tr><td colspan="6" class="text-center">No expenses found</td></tr>';
    }
    
    return this.expenses.map(expense => {
      const date = new Date(expense.date).toLocaleDateString();
      const receiptCount = expense.receipts ? expense.receipts.length : 0;
      
      return `
        <tr>
          <td>${date}</td>
          <td>${expense.title}</td>
          <td>
            <span class="badge" style="background-color: ${expense.category_color}">
              <i class="fas fa-${expense.category_icon}"></i> ${expense.category_name}
            </span>
          </td>
          <td>$${this.formatCurrency(expense.amount)}</td>
          <td>
            ${receiptCount > 0 ? 
              `<span class="badge bg-info">${receiptCount} ${receiptCount === 1 ? 'receipt' : 'receipts'}</span>` : 
              '<span class="badge bg-secondary">None</span>'}
          </td>
          <td>
            <div class="btn-group btn-group-sm" role="group">
              <button type="button" class="btn btn-outline-info edit-expense" data-expense-id="${expense.id}">
                <i class="fas fa-edit"></i>
              </button>
              <button type="button" class="btn btn-outline-danger delete-expense" data-expense-id="${expense.id}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  applyFilters() {
    const startDate = document.getElementById('filter-start-date').value;
    const endDate = document.getElementById('filter-end-date').value;
    const categoryId = document.getElementById('filter-category').value;
    const sortOption = document.getElementById('filter-sort').value;
    
    // Parse sort option
    let sortBy = 'date';
    let sortOrder = 'desc';
    
    if (sortOption) {
      const [field, order] = sortOption.split('-');
      sortBy = field;
      sortOrder = order;
    }
    
    const filters = {
      startDate: startDate || null,
      endDate: endDate || null,
      categoryId: categoryId || null,
      sortBy,
      sortOrder
    };
    
    this.onFilter(filters);
  }

  resetFilters() {
    document.getElementById('filter-start-date').value = '';
    document.getElementById('filter-end-date').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-sort').value = 'date-desc';
    
    this.onFilter({
      startDate: null,
      endDate: null,
      categoryId: null,
      sortBy: 'date',
      sortOrder: 'desc'
    });
  }

  formatCurrency(value) {
    return parseFloat(value).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }
}
