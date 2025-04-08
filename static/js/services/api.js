/**
 * API Service for handling all API requests
 */
class ApiService {
  /**
   * Get all expenses with optional filtering
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Array of expenses
   */
  static async getExpenses(filters = {}) {
    const { startDate, endDate, categoryId, sortBy, sortOrder } = filters;
    let queryParams = new URLSearchParams();
    
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (categoryId) queryParams.append('category_id', categoryId);
    if (sortBy) queryParams.append('sort_by', sortBy);
    if (sortOrder) queryParams.append('sort_order', sortOrder);
    
    const url = `/api/expenses?${queryParams.toString()}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Get a specific expense by ID
   * @param {number} expenseId - The expense ID
   * @returns {Promise<Object>} The expense object
   */
  static async getExpense(expenseId) {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch expense details');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Create a new expense
   * @param {Object} expense - The expense data
   * @param {Array} files - Optional receipt files
   * @returns {Promise<Object>} The created expense
   */
  static async createExpense(expense, files = []) {
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
    
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create expense');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Update an existing expense
   * @param {Object} expense - The expense data
   * @param {Array} files - Optional receipt files
   * @returns {Promise<Object>} The updated expense
   */
  static async updateExpense(expense, files = []) {
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
    
    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PUT',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update expense');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Delete an expense
   * @param {number} expenseId - The expense ID
   * @returns {Promise<Object>} The response message
   */
  static async deleteExpense(expenseId) {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete expense');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Get all categories
   * @returns {Promise<Array>} Array of categories
   */
  static async getCategories() {
    try {
      const response = await fetch('/api/categories');
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Create a new category
   * @param {Object} category - The category data
   * @returns {Promise<Object>} The created category
   */
  static async createCategory(category) {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(category)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create category');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Delete a receipt
   * @param {number} receiptId - The receipt ID
   * @returns {Promise<Object>} The response message
   */
  static async deleteReceipt(receiptId) {
    try {
      const response = await fetch(`/api/receipts/${receiptId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete receipt');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  /**
   * Get all budgets
   * @returns {Promise<Array>} Array of budgets
   */
  static async getBudgets() {
    try {
      const response = await fetch('/api/budgets');
      
      if (!response.ok) {
        throw new Error('Failed to fetch budgets');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific budget by ID
   * @param {number} budgetId - The budget ID
   * @returns {Promise<Object>} The budget object
   */
  static async getBudget(budgetId) {
    try {
      const response = await fetch(`/api/budgets/${budgetId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch budget details');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  /**
   * Create a new budget
   * @param {Object} budget - The budget data
   * @returns {Promise<Object>} The created budget
   */
  static async createBudget(budget) {
    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(budget)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create budget');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing budget
   * @param {Object} budget - The budget data
   * @returns {Promise<Object>} The updated budget
   */
  static async updateBudget(budget) {
    try {
      const response = await fetch(`/api/budgets/${budget.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(budget)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update budget');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  /**
   * Delete a budget
   * @param {number} budgetId - The budget ID
   * @returns {Promise<Object>} The response message
   */
  static async deleteBudget(budgetId) {
    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete budget');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Get monthly expense report
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Monthly report data
   */
  static async getMonthlyReport(filters = {}) {
    const { startDate, endDate, year } = filters;
    let queryParams = new URLSearchParams();
    
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (year) queryParams.append('year', year);
    
    const url = `/api/reports/monthly?${queryParams.toString()}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch monthly report');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Get category expense report
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Category report data
   */
  static async getCategoryReport(filters = {}) {
    const { startDate, endDate } = filters;
    let queryParams = new URLSearchParams();
    
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    
    const url = `/api/reports/category?${queryParams.toString()}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch category report');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Get expense summary report
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Summary report data
   */
  static async getSummaryReport(filters = {}) {
    const { startDate, endDate } = filters;
    let queryParams = new URLSearchParams();
    
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    
    const url = `/api/reports/summary?${queryParams.toString()}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch summary report');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  /**
   * Get budget KPI data for all active budgets
   * @returns {Promise<Array>} Array of budget KPI data objects
   */
  static async getBudgetsKPI() {
    try {
      const response = await fetch('/api/budgets/kpi');
      
      if (!response.ok) {
        throw new Error('Failed to fetch budget KPI data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  /**
   * Get KPI data for a specific budget
   * @param {number} budgetId - The budget ID
   * @returns {Promise<Object>} The budget KPI data
   */
  static async getBudgetKPI(budgetId) {
    try {
      const response = await fetch(`/api/budgets/${budgetId}/kpi`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch budget KPI data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
}
