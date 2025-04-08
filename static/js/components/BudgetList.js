class BudgetList {
  constructor(options) {
    this.onNewBudget = options.onNewBudget || (() => {});
    this.onEditBudget = options.onEditBudget || (() => {});
    this.onDeleteBudget = options.onDeleteBudget || (() => {});
    this.budgets = [];
    this.categories = [];
    this.kpiData = [];
  }

  render(budgets = [], categories = []) {
    this.budgets = budgets;
    this.categories = categories;
    
    const container = document.createElement('div');
    container.className = 'container py-4';
    
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="h3">Budget Management</h1>
        <button id="new-budget" class="btn btn-success">
          <i class="fas fa-plus"></i> New Budget
        </button>
      </div>
      
      <div class="row">
        <div class="col-md-12">
          <div class="card bg-dark text-white">
            <div class="card-header bg-dark border-success">
              <h5 class="mb-0">Your Budgets</h5>
            </div>
            <div class="card-body p-0">
              ${this.renderBudgetTable()}
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-md-6">
          <div class="card bg-dark text-white">
            <div class="card-header bg-dark border-success">
              <h5 class="mb-0">Budget Progress</h5>
            </div>
            <div class="card-body">
              ${this.renderBudgetProgress()}
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card bg-dark text-white">
            <div class="card-header bg-dark border-success">
              <h5 class="mb-0">Budget Tips</h5>
            </div>
            <div class="card-body">
              <ul class="list-group list-group-flush bg-dark">
                <li class="list-group-item bg-dark text-white border-success"><i class="fas fa-leaf text-success me-2"></i> Create budgets for different spending categories</li>
                <li class="list-group-item bg-dark text-white border-success"><i class="fas fa-leaf text-success me-2"></i> Set monthly or custom period budgets</li>
                <li class="list-group-item bg-dark text-white border-success"><i class="fas fa-leaf text-success me-2"></i> Track your progress towards financial goals</li>
                <li class="list-group-item bg-dark text-white border-success"><i class="fas fa-leaf text-success me-2"></i> Adjust budgets as your financial situation changes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Initialize event listeners
    setTimeout(() => {
      const newBudgetButton = container.querySelector('#new-budget');
      newBudgetButton.addEventListener('click', () => {
        this.onNewBudget();
      });
      
      const editButtons = container.querySelectorAll('.edit-budget');
      editButtons.forEach(button => {
        button.addEventListener('click', () => {
          const budgetId = parseInt(button.dataset.id);
          const budget = this.budgets.find(b => b.id === budgetId);
          if (budget) {
            this.onEditBudget(budget);
          }
        });
      });
      
      const deleteButtons = container.querySelectorAll('.delete-budget');
      deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
          if (confirm('Are you sure you want to delete this budget?')) {
            const budgetId = parseInt(button.dataset.id);
            this.onDeleteBudget(budgetId);
          }
        });
      });
    }, 0);
    
    return container;
  }

  async update(budgets, categories) {
    this.budgets = budgets;
    this.categories = categories;
    
    // Update the budget table
    const tableContainer = document.querySelector('.table-responsive');
    if (tableContainer) {
      tableContainer.innerHTML = this.renderBudgetTable(true);
    }
    
    // Update the budget progress section
    const progressContainer = document.querySelector('#budget-progress');
    if (progressContainer) {
      const content = await this.renderBudgetProgressContent();
      progressContainer.innerHTML = content;
    }
    
    // Reinitialize event listeners
    const editButtons = document.querySelectorAll('.edit-budget');
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const budgetId = parseInt(button.dataset.id);
        const budget = this.budgets.find(b => b.id === budgetId);
        if (budget) {
          this.onEditBudget(budget);
        }
      });
    });
    
    const deleteButtons = document.querySelectorAll('.delete-budget');
    deleteButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this budget?')) {
          const budgetId = parseInt(button.dataset.id);
          this.onDeleteBudget(budgetId);
        }
      });
    });
  }

  renderBudgetTable(contentOnly = false) {
    if (this.budgets.length === 0) {
      return contentOnly 
        ? '<div class="text-center p-4">No budgets found. Click "New Budget" to create one.</div>'
        : `
          <div class="table-responsive">
            <div class="text-center p-4">No budgets found. Click "New Budget" to create one.</div>
          </div>
        `;
    }
    
    const tableContent = `
      <table class="table table-dark table-striped table-hover mb-0">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Period</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${this.budgets.map(budget => {
            const categoryName = budget.category_name;
            const categoryColor = budget.category_color;
            const startDate = new Date(budget.start_date).toLocaleDateString();
            const endDate = new Date(budget.end_date).toLocaleDateString();
            const statusClass = budget.is_active ? 'success' : 'secondary';
            const statusText = budget.is_active ? 'Active' : 'Inactive';
            
            return `
              <tr>
                <td>${budget.name}</td>
                <td>
                  <span class="badge rounded-pill" style="background-color: ${categoryColor}">
                    ${categoryName}
                  </span>
                </td>
                <td>MYR ${budget.amount.toFixed(2)}</td>
                <td>${startDate} to ${endDate}</td>
                <td><span class="badge bg-${statusClass}">${statusText}</span></td>
                <td>
                  <button class="btn btn-sm btn-outline-primary edit-budget" data-id="${budget.id}">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger delete-budget" data-id="${budget.id}">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    
    return contentOnly ? tableContent : `<div class="table-responsive">${tableContent}</div>`;
  }

  renderBudgetProgress() {
    return `<div id="budget-progress">${this.renderBudgetProgressContent()}</div>`;
  }

  async renderBudgetProgressContent() {
    if (this.budgets.length === 0) {
      return '<div class="text-center">No active budgets to display</div>';
    }
    
    // Filter active budgets
    const activeBudgets = this.budgets.filter(budget => budget.is_active);
    
    if (activeBudgets.length === 0) {
      return '<div class="text-center">No active budgets to display</div>';
    }
    
    try {
      // Get actual KPI data for the budgets
      const budgetKPIs = await ApiService.getBudgetsKPI();
      
      if (!budgetKPIs || budgetKPIs.length === 0) {
        return '<div class="text-center">No budget data available</div>';
      }
      
      return budgetKPIs.map(kpi => {
        const percentage = kpi.percentage_used;
        let progressClass = 'success';
      
      if (percentage > 90) {
        progressClass = 'danger';
      } else if (percentage > 75) {
        progressClass = 'warning';
      }
      
      return `
        <div class="mb-3">
          <div class="d-flex justify-content-between mb-1">
            <span>${kpi.budget_name} (${kpi.category_name})</span>
            <span class="badge ${kpi.is_exceeded ? 'bg-danger' : 'bg-success'}">
              ${kpi.is_exceeded ? 'EXCEEDED' : 'ON TRACK'}
            </span>
          </div>
          <div class="d-flex justify-content-between mb-1">
            <span>Budget: MYR ${kpi.budget_amount.toFixed(2)}</span>
            <span>Spent: MYR ${kpi.total_spent.toFixed(2)}</span>
          </div>
          <div class="progress" style="height: 20px;">
            <div class="progress-bar bg-${progressClass}" role="progressbar" 
                 style="width: ${Math.min(percentage, 100)}%;" aria-valuenow="${percentage}" 
                 aria-valuemin="0" aria-valuemax="100">
              ${percentage.toFixed(1)}%
            </div>
          </div>
          <div class="d-flex justify-content-between mt-1">
            <small>Remaining: MYR ${kpi.remaining.toFixed(2)}</small>
            <small>${kpi.start_date} - ${kpi.end_date}</small>
          </div>
        </div>
      `;
    }).join('');
    } catch (error) {
      console.error('Error fetching budget KPIs:', error);
      return '<div class="text-center text-danger">Error loading budget data</div>';
    }
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(value);
  }
}