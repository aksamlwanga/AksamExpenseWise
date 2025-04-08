// Main application entry point
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the application
  const app = new ExpenseTrackerApp();
  app.initialize();
});

class ExpenseTrackerApp {
  constructor() {
    this.currentView = null;
    this.components = {};
    this.state = {
      expenses: [],
      categories: [],
      reports: {
        monthly: [],
        category: [],
        summary: {}
      },
      filters: {
        startDate: null,
        endDate: null,
        categoryId: null,
        sortBy: 'date',
        sortOrder: 'desc'
      }
    };
  }

  async initialize() {
    // Initialize navigation
    this.components.navigation = new Navigation({
      onNavigate: (view) => this.navigateTo(view)
    });

    // Initialize all components
    this.components.dashboard = new Dashboard({
      onRefresh: () => this.loadDashboardData()
    });
    
    this.components.expenseForm = new ExpenseForm({
      onSave: (expense, files) => this.saveExpense(expense, files),
      onUpdate: (expense, files) => this.updateExpense(expense, files),
      onCancel: () => this.navigateTo('expenseList')
    });
    
    this.components.expenseList = new ExpenseList({
      onEdit: (expenseId) => this.editExpense(expenseId),
      onDelete: (expenseId) => this.deleteExpense(expenseId),
      onFilter: (filters) => this.applyFilters(filters),
      onAdd: () => this.navigateTo('expenseForm')
    });
    
    this.components.expenseReport = new ExpenseReport({
      onFilter: (filters) => this.applyReportFilters(filters)
    });
    
    this.components.receiptUpload = new ReceiptUpload({
      onUpload: (files, expenseId) => this.uploadReceipts(files, expenseId)
    });

    // Load initial data
    await this.loadCategories();
    
    // Navigate to the dashboard view by default
    this.navigateTo('dashboard');
  }

  navigateTo(view, params = {}) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';
    
    // Update navigation active state
    this.components.navigation.setActive(view);
    
    // Render the appropriate view
    switch(view) {
      case 'dashboard':
        mainContent.appendChild(this.components.dashboard.render());
        this.loadDashboardData();
        break;
      case 'expenseList':
        mainContent.appendChild(this.components.expenseList.render(this.state.expenses, this.state.categories));
        this.loadExpenses();
        break;
      case 'expenseForm':
        if (params.expense) {
          mainContent.appendChild(this.components.expenseForm.render(params.expense, this.state.categories));
        } else {
          mainContent.appendChild(this.components.expenseForm.render(null, this.state.categories));
        }
        break;
      case 'expenseReport':
        mainContent.appendChild(this.components.expenseReport.render(this.state.reports, this.state.categories));
        this.loadReportData();
        break;
      default:
        mainContent.appendChild(this.components.dashboard.render());
        this.loadDashboardData();
    }
    
    this.currentView = view;
  }

  async loadCategories() {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to load categories');
      }
      
      this.state.categories = await response.json();
    } catch (error) {
      console.error('Error loading categories:', error);
      this.showError('Failed to load categories. Please try again.');
    }
  }

  async loadExpenses() {
    try {
      // Build query string based on filters
      const { startDate, endDate, categoryId, sortBy, sortOrder } = this.state.filters;
      let queryParams = new URLSearchParams();
      
      if (startDate) queryParams.append('start_date', startDate);
      if (endDate) queryParams.append('end_date', endDate);
      if (categoryId) queryParams.append('category_id', categoryId);
      if (sortBy) queryParams.append('sort_by', sortBy);
      if (sortOrder) queryParams.append('sort_order', sortOrder);
      
      const url = `/api/expenses?${queryParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to load expenses');
      }
      
      this.state.expenses = await response.json();
      
      // Update the expense list component if currently viewing
      if (this.currentView === 'expenseList') {
        this.components.expenseList.update(this.state.expenses, this.state.categories);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      this.showError('Failed to load expenses. Please try again.');
    }
  }

  async loadDashboardData() {
    try {
      // Load summary report
      const summaryResponse = await fetch('/api/reports/summary');
      if (!summaryResponse.ok) {
        throw new Error('Failed to load summary data');
      }
      
      this.state.reports.summary = await summaryResponse.json();
      
      // Load category report
      const categoryResponse = await fetch('/api/reports/category');
      if (!categoryResponse.ok) {
        throw new Error('Failed to load category data');
      }
      
      this.state.reports.category = await categoryResponse.json();
      
      // Load monthly report
      const currentYear = new Date().getFullYear();
      const monthlyResponse = await fetch(`/api/reports/monthly?year=${currentYear}`);
      if (!monthlyResponse.ok) {
        throw new Error('Failed to load monthly data');
      }
      
      this.state.reports.monthly = await monthlyResponse.json();
      
      // Update the dashboard component if currently viewing
      if (this.currentView === 'dashboard') {
        this.components.dashboard.update(this.state.reports);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.showError('Failed to load dashboard data. Please try again.');
    }
  }

  async loadReportData() {
    try {
      // Build query string based on filters
      const { startDate, endDate } = this.state.filters;
      let queryParams = new URLSearchParams();
      
      if (startDate) queryParams.append('start_date', startDate);
      if (endDate) queryParams.append('end_date', endDate);
      
      // Load monthly report
      const monthlyUrl = `/api/reports/monthly?${queryParams.toString()}`;
      const monthlyResponse = await fetch(monthlyUrl);
      if (!monthlyResponse.ok) {
        throw new Error('Failed to load monthly report data');
      }
      
      this.state.reports.monthly = await monthlyResponse.json();
      
      // Load category report
      const categoryUrl = `/api/reports/category?${queryParams.toString()}`;
      const categoryResponse = await fetch(categoryUrl);
      if (!categoryResponse.ok) {
        throw new Error('Failed to load category report data');
      }
      
      this.state.reports.category = await categoryResponse.json();
      
      // Load summary data
      const summaryUrl = `/api/reports/summary?${queryParams.toString()}`;
      const summaryResponse = await fetch(summaryUrl);
      if (!summaryResponse.ok) {
        throw new Error('Failed to load summary report data');
      }
      
      this.state.reports.summary = await summaryResponse.json();
      
      // Update the report component if currently viewing
      if (this.currentView === 'expenseReport') {
        this.components.expenseReport.update(this.state.reports, this.state.categories);
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      this.showError('Failed to load report data. Please try again.');
    }
  }

  async saveExpense(expense, files) {
    try {
      const formData = new FormData();
      
      // Add expense data to form data
      Object.keys(expense).forEach(key => {
        formData.append(key, expense[key]);
      });
      
      // Add receipt files if any
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          formData.append('receipts', files[i]);
        }
      }
      
      const response = await fetch('/api/expenses', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save expense');
      }
      
      this.showSuccess('Expense saved successfully');
      
      // Navigate back to expense list
      this.navigateTo('expenseList');
      
      // Refresh data
      this.loadExpenses();
      this.loadDashboardData();
    } catch (error) {
      console.error('Error saving expense:', error);
      this.showError(error.message || 'Failed to save expense. Please try again.');
    }
  }

  async updateExpense(expense, files) {
    try {
      const formData = new FormData();
      
      // Add expense data to form data
      Object.keys(expense).forEach(key => {
        if (key !== 'id' && key !== 'receipts') {
          formData.append(key, expense[key]);
        }
      });
      
      // Add receipt files if any
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          formData.append('receipts', files[i]);
        }
      }
      
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PUT',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update expense');
      }
      
      this.showSuccess('Expense updated successfully');
      
      // Navigate back to expense list
      this.navigateTo('expenseList');
      
      // Refresh data
      this.loadExpenses();
      this.loadDashboardData();
    } catch (error) {
      console.error('Error updating expense:', error);
      this.showError(error.message || 'Failed to update expense. Please try again.');
    }
  }

  async deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete expense');
      }
      
      this.showSuccess('Expense deleted successfully');
      
      // Refresh data
      this.loadExpenses();
      this.loadDashboardData();
    } catch (error) {
      console.error('Error deleting expense:', error);
      this.showError(error.message || 'Failed to delete expense. Please try again.');
    }
  }

  async editExpense(expenseId) {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load expense details');
      }
      
      const expense = await response.json();
      
      // Navigate to expense form with expense data
      this.navigateTo('expenseForm', { expense });
    } catch (error) {
      console.error('Error loading expense details:', error);
      this.showError('Failed to load expense details. Please try again.');
    }
  }

  async uploadReceipts(files, expenseId) {
    try {
      const formData = new FormData();
      
      // Add receipt files
      for (let i = 0; i < files.length; i++) {
        formData.append('receipts', files[i]);
      }
      
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PUT',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload receipts');
      }
      
      this.showSuccess('Receipts uploaded successfully');
      
      // Refresh expense details
      return await response.json();
    } catch (error) {
      console.error('Error uploading receipts:', error);
      this.showError(error.message || 'Failed to upload receipts. Please try again.');
      return null;
    }
  }

  applyFilters(filters) {
    this.state.filters = { ...this.state.filters, ...filters };
    this.loadExpenses();
  }

  applyReportFilters(filters) {
    this.state.filters = { ...this.state.filters, ...filters };
    this.loadReportData();
  }

  showSuccess(message) {
    // Create and show a Bootstrap toast for success messages
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      const newContainer = document.createElement('div');
      newContainer.id = 'toast-container';
      newContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(newContainer);
    }
    
    const toastElement = document.createElement('div');
    toastElement.className = 'toast align-items-center text-white bg-success border-0';
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    
    toastElement.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    
    document.getElementById('toast-container').appendChild(toastElement);
    
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
  }

  showError(message) {
    // Create and show a Bootstrap toast for error messages
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      const newContainer = document.createElement('div');
      newContainer.id = 'toast-container';
      newContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(newContainer);
    }
    
    const toastElement = document.createElement('div');
    toastElement.className = 'toast align-items-center text-white bg-danger border-0';
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    
    toastElement.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    
    document.getElementById('toast-container').appendChild(toastElement);
    
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
  }
}
