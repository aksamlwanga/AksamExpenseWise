class BudgetForm {
  constructor(options) {
    this.onSave = options.onSave || (() => {});
    this.onUpdate = options.onUpdate || (() => {});
    this.onCancel = options.onCancel || (() => {});
    this.budget = null;
    this.categories = [];
  }

  render(budget = null, categories = []) {
    this.budget = budget;
    this.categories = categories;
    
    const container = document.createElement('div');
    container.className = 'container py-4';
    
    const formTitle = budget ? 'Edit Budget' : 'Create New Budget';
    
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="h3">${formTitle}</h1>
        <button id="cancel-budget" class="btn btn-outline-secondary">
          Cancel
        </button>
      </div>
      
      <div class="card bg-dark text-white">
        <div class="card-body">
          <form id="budget-form" class="needs-validation" novalidate>
            <div class="row g-3">
              <div class="col-md-6">
                <label for="budget-name" class="form-label">Budget Name</label>
                <input type="text" class="form-control" id="budget-name" value="${budget ? budget.name : ''}" required>
                <div class="invalid-feedback">Please provide a name for this budget.</div>
              </div>
              
              <div class="col-md-6">
                <label for="budget-amount" class="form-label">Budget Amount</label>
                <div class="input-group">
                  <span class="input-group-text">UGX</span>
                  <input type="number" class="form-control" id="budget-amount" min="0.01" step="0.01" value="${budget ? budget.amount : ''}" required>
                  <div class="invalid-feedback">Please provide a valid amount.</div>
                </div>
              </div>
              
              <div class="col-md-6">
                <label for="budget-start-date" class="form-label">Start Date</label>
                <input type="date" class="form-control" id="budget-start-date" value="${budget ? budget.start_date : this.getFirstDayOfMonth()}" required>
                <div class="invalid-feedback">Please provide a start date.</div>
              </div>
              
              <div class="col-md-6">
                <label for="budget-end-date" class="form-label">End Date</label>
                <input type="date" class="form-control" id="budget-end-date" value="${budget ? budget.end_date : this.getLastDayOfMonth()}" required>
                <div class="invalid-feedback">Please provide an end date.</div>
              </div>
              
              <div class="col-md-6">
                <label for="budget-category" class="form-label">Category</label>
                <select class="form-select" id="budget-category">
                  <option value="">All Categories</option>
                  ${this.renderCategoryOptions()}
                </select>
                <div class="form-text">Select a specific category or leave as "All Categories" for overall budget.</div>
              </div>
              
              <div class="col-md-6">
                <div class="form-check form-switch mt-4 pt-2">
                  <input class="form-check-input" type="checkbox" id="budget-active" ${budget ? (budget.is_active ? 'checked' : '') : 'checked'}>
                  <label class="form-check-label" for="budget-active">Active Budget</label>
                </div>
              </div>
              
              <div class="col-12 mt-4">
                <button type="submit" class="btn btn-primary">
                  ${budget ? 'Update Budget' : 'Create Budget'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
    
    // Initialize event listeners
    setTimeout(() => {
      const form = container.querySelector('#budget-form');
      const cancelButton = container.querySelector('#cancel-budget');
      
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!form.checkValidity()) {
          e.stopPropagation();
          form.classList.add('was-validated');
          return;
        }
        
        const formData = this.getFormData();
        
        if (this.budget) {
          this.onUpdate(formData);
        } else {
          this.onSave(formData);
        }
      });
      
      cancelButton.addEventListener('click', () => {
        this.onCancel();
      });
    }, 0);
    
    return container;
  }

  renderCategoryOptions() {
    if (!this.categories || this.categories.length === 0) {
      return '';
    }
    
    return this.categories.map(category => {
      const selected = this.budget && this.budget.category_id === category.id ? 'selected' : '';
      return `<option value="${category.id}" ${selected}>${category.name}</option>`;
    }).join('');
  }

  getFormData() {
    const name = document.getElementById('budget-name').value.trim();
    const amount = parseFloat(document.getElementById('budget-amount').value);
    const startDate = document.getElementById('budget-start-date').value;
    const endDate = document.getElementById('budget-end-date').value;
    const categoryId = document.getElementById('budget-category').value || null;
    const isActive = document.getElementById('budget-active').checked;
    
    const formData = {
      name,
      amount,
      start_date: startDate,
      end_date: endDate,
      category_id: categoryId,
      is_active: isActive
    };
    
    if (this.budget) {
      formData.id = this.budget.id;
    }
    
    return formData;
  }

  getFirstDayOfMonth() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    return this.formatDate(firstDay);
  }

  getLastDayOfMonth() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    return this.formatDate(lastDay);
  }

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}