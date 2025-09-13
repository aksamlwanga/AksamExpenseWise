class Navigation {
  constructor(options) {
    this.onNavigate = options.onNavigate || (() => {});
    this.activeView = 'dashboard';
  }

  render() {
    const container = document.createElement('div');
    
    container.innerHTML = `
      <nav class="navbar navbar-expand-lg navbar-dark" style="background-color: #2e4832;">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">
            <i class="fas fa-leaf"></i> Financial Tracker
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto">
              <li class="nav-item">
                <a class="nav-link ${this.activeView === 'dashboard' ? 'active' : ''}" href="#" data-view="dashboard">
                  <i class="fas fa-tachometer-alt"></i> Dashboard
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link ${this.activeView === 'expenseList' ? 'active' : ''}" href="#" data-view="expenseList">
                  <i class="fas fa-list"></i> Expenses
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link ${this.activeView === 'expenseForm' ? 'active' : ''}" href="#" data-view="expenseForm">
                  <i class="fas fa-plus-circle"></i> Add Expense
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link ${this.activeView === 'expenseReport' ? 'active' : ''}" href="#" data-view="expenseReport">
                  <i class="fas fa-chart-pie"></i> Reports
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link ${this.activeView === 'budgetList' ? 'active' : ''}" href="#" data-view="budgetList">
                  <i class="fas fa-bullseye"></i> Budgets
                </a>
              </li>
            </ul>
            <ul class="navbar-nav">
              <li class="nav-item">
                <a class="nav-link logout-link" href="/logout">
                  <i class="fas fa-sign-out-alt"></i> Logout
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    `;
    
    // Initialize event listeners
    setTimeout(() => {
      // Get all nav-links except the logout link
      const navLinks = container.querySelectorAll('.nav-link:not(.logout-link)');
      
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const view = link.getAttribute('data-view');
          this.setActive(view);
          this.onNavigate(view);
        });
      });
      
      // The logout link should work as a normal link
    }, 0);
    
    return container;
  }

  setActive(view) {
    this.activeView = view;
    
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const linkView = link.getAttribute('data-view');
      if (linkView === view) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}
