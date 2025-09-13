class ExpenseForm {
  constructor(options) {
    this.onSave = options.onSave || (() => {});
    this.onUpdate = options.onUpdate || (() => {});
    this.onCancel = options.onCancel || (() => {});
    this.expense = null;
    this.categories = [];
    this.receiptFiles = [];
  }

  render(expense = null, categories = []) {
    this.expense = expense;
    this.categories = categories;
    this.receiptFiles = [];
    
    const container = document.createElement('div');
    container.className = 'container py-4';
    
    const formTitle = expense ? 'Edit Expense' : 'Add New Expense';
    
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="h3">${formTitle}</h1>
        <button id="cancel-expense" class="btn btn-outline-secondary">
          Cancel
        </button>
      </div>
      
      <div class="card bg-dark text-white">
        <div class="card-body">
          <form id="expense-form" class="needs-validation" novalidate>
            <div class="row g-3">
              <div class="col-md-6">
                <label for="expense-title" class="form-label">Title</label>
                <input type="text" class="form-control" id="expense-title" value="${expense ? expense.title : ''}" required>
                <div class="invalid-feedback">Please provide a title.</div>
              </div>
              
              <div class="col-md-4">
                <label for="expense-amount" class="form-label">Amount</label>
                <div class="input-group">
                  <span class="input-group-text">UGX</span>
                  <input type="number" class="form-control" id="expense-amount" min="0.01" step="0.01" value="${expense ? expense.amount : ''}" required>
                  <div class="invalid-feedback">Please provide a valid amount.</div>
                </div>
              </div>
              
              <div class="col-md-2">
                <label for="expense-currency" class="form-label">Currency</label>
                <select class="form-select" id="expense-currency">
                  <option value="UGX" ${!expense || expense.currency === 'UGX' ? 'selected' : ''}>UGX</option>
                  <option value="MYR" ${expense && expense.currency === 'MYR' ? 'selected' : ''}>MYR</option>
                  <option value="USD" ${expense && expense.currency === 'USD' ? 'selected' : ''}>USD</option>
                  <option value="EUR" ${expense && expense.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                  <option value="GBP" ${expense && expense.currency === 'GBP' ? 'selected' : ''}>GBP</option>
                  <option value="AUD" ${expense && expense.currency === 'AUD' ? 'selected' : ''}>AUD</option>
                  <option value="SGD" ${expense && expense.currency === 'SGD' ? 'selected' : ''}>SGD</option>
                  <option value="JPY" ${expense && expense.currency === 'JPY' ? 'selected' : ''}>JPY</option>
                  <option value="CNY" ${expense && expense.currency === 'CNY' ? 'selected' : ''}>CNY</option>
                  <option value="THB" ${expense && expense.currency === 'THB' ? 'selected' : ''}>THB</option>
                  <option value="IDR" ${expense && expense.currency === 'IDR' ? 'selected' : ''}>IDR</option>
                </select>
              </div>
              
              <div class="col-md-6">
                <label for="expense-date" class="form-label">Date</label>
                <input type="date" class="form-control" id="expense-date" value="${expense ? expense.date : this.getTodayDate()}" required>
                <div class="invalid-feedback">Please provide a date.</div>
              </div>
              
              <div class="col-md-6">
                <label for="expense-category" class="form-label">Category</label>
                <select class="form-select" id="expense-category" required>
                  <option value="" disabled ${!expense ? 'selected' : ''}>Select a category</option>
                  ${this.renderCategoryOptions()}
                </select>
                <div class="invalid-feedback">Please select a category.</div>
              </div>
              
              <div class="col-12">
                <label for="expense-description" class="form-label">Description</label>
                <textarea class="form-control" id="expense-description" rows="3">${expense ? expense.description || '' : ''}</textarea>
              </div>
              
              <div class="col-12">
                <label for="expense-receipts" class="form-label">Upload Receipts</label>
                <input type="file" class="form-control" id="expense-receipts" multiple accept="image/*,.pdf">
                <div class="form-text">Accepted file types: Images, PDF.</div>
              </div>
              
              ${this.renderExistingReceipts()}
              
              <div class="col-12 mt-4">
                <button type="submit" class="btn btn-primary">
                  ${expense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
    
    // Initialize event listeners
    setTimeout(() => {
      const form = container.querySelector('#expense-form');
      const cancelButton = container.querySelector('#cancel-expense');
      const receiptInput = container.querySelector('#expense-receipts');
      
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!form.checkValidity()) {
          e.stopPropagation();
          form.classList.add('was-validated');
          return;
        }
        
        const formData = this.getFormData();
        
        if (this.expense) {
          this.onUpdate(formData, this.receiptFiles);
        } else {
          this.onSave(formData, this.receiptFiles);
        }
      });
      
      cancelButton.addEventListener('click', () => {
        this.onCancel();
      });
      
      receiptInput.addEventListener('change', (e) => {
        this.receiptFiles = Array.from(e.target.files);
      });
      
      // Set up delete receipt buttons
      const deleteButtons = container.querySelectorAll('.delete-receipt');
      deleteButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
          e.preventDefault();
          const receiptId = button.getAttribute('data-receipt-id');
          await this.deleteReceipt(receiptId);
        });
      });
    }, 0);
    
    return container;
  }

  renderCategoryOptions() {
    if (!this.categories || this.categories.length === 0) {
      return '';
    }
    
    return this.categories.map(category => {
      const selected = this.expense && this.expense.category_id === category.id ? 'selected' : '';
      return `<option value="${category.id}" ${selected}>${category.name}</option>`;
    }).join('');
  }

  renderExistingReceipts() {
    if (!this.expense || !this.expense.receipts || this.expense.receipts.length === 0) {
      return '';
    }
    
    return `
      <div class="col-12 mt-3">
        <label class="form-label">Existing Receipts</label>
        <div class="row g-2">
          ${this.expense.receipts.map(receipt => `
            <div class="col-6 col-md-4 col-lg-3">
              <div class="card bg-secondary">
                <div class="card-body p-2">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <small class="text-truncate">${receipt.original_filename}</small>
                    <button class="btn btn-sm btn-danger delete-receipt" data-receipt-id="${receipt.id}">
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                  <a href="/uploads/${receipt.filename}" target="_blank" class="btn btn-sm btn-outline-light w-100">
                    <i class="fas fa-eye"></i> View
                  </a>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  getFormData() {
    const title = document.getElementById('expense-title').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const currency = document.getElementById('expense-currency').value;
    const date = document.getElementById('expense-date').value;
    const categoryId = document.getElementById('expense-category').value;
    const description = document.getElementById('expense-description').value.trim();
    
    const formData = {
      title,
      amount,
      currency,
      date,
      category_id: categoryId,
      description
    };
    
    if (this.expense) {
      formData.id = this.expense.id;
    }
    
    return formData;
  }

  getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async deleteReceipt(receiptId) {
    if (!confirm('Are you sure you want to delete this receipt?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/receipts/${receiptId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete receipt');
      }
      
      // Remove the receipt from the UI
      const receiptElement = document.querySelector(`[data-receipt-id="${receiptId}"]`).closest('.col-6');
      receiptElement.remove();
      
      // Update the expense object
      if (this.expense && this.expense.receipts) {
        this.expense.receipts = this.expense.receipts.filter(receipt => receipt.id !== parseInt(receiptId));
      }
      
      alert('Receipt deleted successfully');
    } catch (error) {
      console.error('Error deleting receipt:', error);
      alert('Failed to delete receipt. Please try again.');
    }
  }
}
