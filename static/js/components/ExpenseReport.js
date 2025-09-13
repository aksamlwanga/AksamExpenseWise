class ExpenseReport {
  constructor(options) {
    this.onFilter = options.onFilter || (() => {});
    this.reports = {
      monthly: [],
      category: [],
      summary: {}
    };
    this.categories = [];
    this.charts = {};
  }

  render(reports = {}, categories = []) {
    this.reports = reports;
    this.categories = categories;
    
    const container = document.createElement('div');
    container.className = 'container py-4';
    
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="h3">Expense Reports</h1>
      </div>
      
      <div class="card bg-dark text-white mb-4">
        <div class="card-header">
          <h5 class="card-title mb-0">Report Filters</h5>
        </div>
        <div class="card-body">
          <form id="report-filter-form" class="row g-3">
            <div class="col-md-5">
              <label for="report-start-date" class="form-label">Start Date</label>
              <input type="date" class="form-control" id="report-start-date">
            </div>
            <div class="col-md-5">
              <label for="report-end-date" class="form-label">End Date</label>
              <input type="date" class="form-control" id="report-end-date">
            </div>
            <div class="col-md-2 d-flex align-items-end">
              <button type="submit" class="btn btn-primary w-100">Generate Report</button>
            </div>
          </form>
        </div>
      </div>
      
      <div class="row mb-4">
        <div class="col-lg-8 mb-3">
          <div class="card bg-dark text-white">
            <div class="card-header">
              <h5 class="card-title mb-0">Monthly Breakdown</h5>
            </div>
            <div class="card-body">
              <canvas id="report-monthly-chart" height="300"></canvas>
            </div>
          </div>
        </div>
        <div class="col-lg-4 mb-3">
          <div class="card bg-dark text-white">
            <div class="card-header">
              <h5 class="card-title mb-0">Category Distribution</h5>
            </div>
            <div class="card-body">
              <canvas id="report-category-chart" height="300"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mb-4">
        <div class="col-12">
          <div class="card bg-dark text-white">
            <div class="card-header">
              <h5 class="card-title mb-0">Expense Summary</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-4 mb-3">
                  <div class="card bg-secondary text-white">
                    <div class="card-body text-center">
                      <h5>Total Expenses</h5>
                      <h3 id="report-total-expenses">UGX 0.00</h3>
                    </div>
                  </div>
                </div>
                <div class="col-md-4 mb-3">
                  <div class="card bg-secondary text-white">
                    <div class="card-body text-center">
                      <h5>Average Expense</h5>
                      <h3 id="report-average-expense">UGX 0.00</h3>
                    </div>
                  </div>
                </div>
                <div class="col-md-4 mb-3">
                  <div class="card bg-secondary text-white">
                    <div class="card-body text-center">
                      <h5>Total Transactions</h5>
                      <h3 id="report-transaction-count">0</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row">
        <div class="col-12">
          <div class="card bg-dark text-white">
            <div class="card-header">
              <h5 class="card-title mb-0">Category Breakdown</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-dark table-hover">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Total Amount</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody id="category-breakdown-table">
                    <tr>
                      <td colspan="3" class="text-center">No data available</td>
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
      const filterForm = container.querySelector('#report-filter-form');
      
      filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.applyFilters();
      });
      
      // Render initial charts and data
      this.update(this.reports, this.categories);
    }, 0);
    
    return container;
  }

  update(reports, categories) {
    this.reports = reports;
    this.categories = categories;
    
    // Update summary stats
    const summary = reports.summary || {};
    document.getElementById('report-total-expenses').textContent = `UGX ${this.formatCurrency(summary.total || 0)}`;
    document.getElementById('report-average-expense').textContent = `UGX ${this.formatCurrency(summary.average || 0)}`;
    document.getElementById('report-transaction-count').textContent = summary.count || 0;
    
    // Update category breakdown table
    this.updateCategoryBreakdownTable(reports.category || []);
    
    // Update charts
    this.renderMonthlyChart(reports.monthly || []);
    this.renderCategoryChart(reports.category || []);
  }

  updateCategoryBreakdownTable(categoryData) {
    const tableBody = document.getElementById('category-breakdown-table');
    
    if (!tableBody) return;
    
    if (categoryData.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="3" class="text-center">No data available</td></tr>';
      return;
    }
    
    // Calculate total
    const total = categoryData.reduce((sum, category) => sum + category.total, 0);
    
    // Sort categories by amount (highest first)
    const sortedCategories = [...categoryData].sort((a, b) => b.total - a.total);
    
    tableBody.innerHTML = sortedCategories.map(category => {
      const percentage = total > 0 ? (category.total / total) * 100 : 0;
      
      return `
        <tr>
          <td>
            <span class="badge" style="background-color: ${category.color}">
              <i class="fas fa-${category.icon}"></i> ${category.name}
            </span>
          </td>
          <td>${category.currency || 'UGX'} ${this.formatCurrency(category.total)}</td>
          <td>
            <div class="d-flex align-items-center">
              <div class="progress flex-grow-1 me-2" style="height: 8px;">
                <div class="progress-bar" style="width: ${percentage}%; background-color: ${category.color};"></div>
              </div>
              <span>${percentage.toFixed(1)}%</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderMonthlyChart(monthlyData) {
    const ctx = document.getElementById('report-monthly-chart');
    
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
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
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
    const ctx = document.getElementById('report-category-chart');
    
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

  applyFilters() {
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    
    const filters = {
      startDate: startDate || null,
      endDate: endDate || null
    };
    
    this.onFilter(filters);
  }

  formatCurrency(value) {
    return parseFloat(value).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }
}
