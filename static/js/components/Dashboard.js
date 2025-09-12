class Dashboard {
  constructor(options) {
    this.onRefresh = options.onRefresh || (() => {});
    this.reports = {
      monthly: [],
      category: [],
      summary: {}
    };
    this.charts = {};
  }

  render() {
    const container = document.createElement('div');
    container.className = 'container py-4';
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="h3"><i class="fas fa-leaf"></i> Forest Expense Dashboard</h1>
        <button id="refresh-dashboard" class="btn btn-sm btn-forest">
          <i class="fas fa-leaf fa-spin-pulse"></i> Refresh
        </button>
      </div>
      
      <div class="row mb-4">
        <div class="col-md-4 mb-3">
          <div class="card text-white h-100">
            <div class="card-body">
              <h5 class="card-title" style="color: #4caf50;"><i class="fas fa-money-bill-wave"></i> Total Expenses</h5>
              <p id="total-expenses" class="display-4">UGX 0.00</p>
              <p class="text-muted small">All time</p>
            </div>
          </div>
        </div>
        <div class="col-md-4 mb-3">
          <div class="card text-white h-100">
            <div class="card-body">
              <h5 class="card-title" style="color: #4caf50;"><i class="fas fa-calculator"></i> Average Expense</h5>
              <p id="average-expense" class="display-4">UGX 0.00</p>
              <p class="text-muted small">Per transaction</p>
            </div>
          </div>
        </div>
        <div class="col-md-4 mb-3">
          <div class="card text-white h-100">
            <div class="card-body">
              <h5 class="card-title" style="color: #4caf50;"><i class="fas fa-list-alt"></i> Transaction Count</h5>
              <p id="expense-count" class="display-4">0</p>
              <p class="text-muted small">Total records</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mb-4">
        <div class="col-lg-8 mb-3">
          <div class="card text-white">
            <div class="card-header">
              <h5 class="card-title mb-0"><i class="fas fa-calendar-alt"></i> Monthly Expenses</h5>
            </div>
            <div class="card-body">
              <canvas id="monthly-chart" height="300"></canvas>
            </div>
          </div>
        </div>
        <div class="col-lg-4 mb-3">
          <div class="card text-white">
            <div class="card-header">
              <h5 class="card-title mb-0"><i class="fas fa-tags"></i> Expense Categories</h5>
            </div>
            <div class="card-body">
              <canvas id="category-chart" height="300"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row">
        <div class="col-12">
          <div class="card text-white">
            <div class="card-header">
              <h5 class="card-title mb-0"><i class="fas fa-receipt"></i> Recent Expenses</h5>
            </div>
            <div class="card-body">
              <div id="recent-expenses" class="table-responsive">
                <table class="table table-dark table-hover">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colspan="4" class="text-center">No recent expenses</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Initialize event listeners
    setTimeout(() => {
      const refreshButton = container.querySelector('#refresh-dashboard');
      refreshButton.addEventListener('click', () => {
        this.onRefresh();
      });
    }, 0);
    
    return container;
  }

  update(reports) {
    this.reports = reports;
    
    // Update summary cards
    const summary = reports.summary || {};
    document.getElementById('total-expenses').textContent = `UGX ${this.formatCurrency(summary.total || 0)}`;
    document.getElementById('average-expense').textContent = `UGX ${this.formatCurrency(summary.average || 0)}`;
    document.getElementById('expense-count').textContent = summary.count || 0;
    
    // Update recent expenses table
    this.updateRecentExpenses(summary.recent_expenses || []);
    
    // Update charts
    this.renderMonthlyChart(reports.monthly || []);
    this.renderCategoryChart(reports.category || []);
  }

  updateRecentExpenses(expenses) {
    const tableBody = document.querySelector('#recent-expenses tbody');
    
    if (!tableBody) return;
    
    if (expenses.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No recent expenses</td></tr>';
      return;
    }
    
    tableBody.innerHTML = expenses.map(expense => `
      <tr>
        <td>${new Date(expense.date).toLocaleDateString()}</td>
        <td>${expense.title}</td>
        <td>
          <span class="badge" style="background-color: ${expense.category_color}">
            <i class="fas fa-${expense.category_icon}"></i> ${expense.category_name}
          </span>
        </td>
        <td>${expense.currency} ${this.formatCurrency(expense.amount)}</td>
      </tr>
    `).join('');
  }

  renderMonthlyChart(monthlyData) {
    const ctx = document.getElementById('monthly-chart');
    
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (this.charts.monthly) {
      this.charts.monthly.destroy();
    }
    
    // Prepare data for the chart
    const labels = monthlyData.map(item => item.month_name);
    const data = monthlyData.map(item => item.total);
    
    // Create the chart
    this.charts.monthly = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Monthly Expenses',
          data: data,
          backgroundColor: 'rgba(46, 125, 50, 0.7)',
          borderColor: 'rgba(27, 94, 32, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'UGX ' + value;
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'UGX ' + context.parsed.y.toFixed(2);
              }
            }
          }
        }
      }
    });
  }

  renderCategoryChart(categoryData) {
    const ctx = document.getElementById('category-chart');
    
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (this.charts.category) {
      this.charts.category.destroy();
    }
    
    // Prepare data for the chart
    const labels = categoryData.map(item => item.name);
    const data = categoryData.map(item => item.total);
    const backgroundColor = categoryData.map(item => item.color);
    
    // Create the chart
    this.charts.category = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColor,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${label}: UGX ${value.toFixed(2)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  formatCurrency(value) {
    return parseFloat(value).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }
}
