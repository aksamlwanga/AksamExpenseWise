import os
import uuid
from datetime import datetime
from flask import request, jsonify, send_from_directory, render_template, redirect, url_for, flash
from werkzeug.utils import secure_filename
from sqlalchemy import extract, func
from flask_login import login_user, logout_user, login_required, current_user
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField, EmailField
from wtforms.validators import DataRequired, Email, EqualTo, Length, ValidationError
from app import app, db
from models import User, Expense, Category, Receipt, Budget

# Forms for authentication
class LoginForm(FlaskForm):
    email = EmailField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Sign In')

class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=3, max=64)])
    email = EmailField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    password2 = PasswordField('Repeat Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Register')
    
    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('Username already taken. Please use a different one.')
            
    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('Email already registered. Please use a different one.')

# Authentication routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('Invalid email or password', 'danger')
            return render_template('login.html', form=form)
        
        login_user(user, remember=form.remember_me.data)
        flash('Login successful!', 'success')
        return redirect(url_for('index'))
    
    return render_template('login.html', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Registration successful! You can now log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html', form=form)

@app.route('/logout')
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))

# Serve the main application
@app.route('/')
@login_required
def index():
    return render_template('index.html')

# Serve static files
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

# Serve uploaded files
@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# API Endpoints for Expenses
@app.route('/api/expenses', methods=['GET'])
@login_required
def get_expenses():
    """Get all expenses with optional filtering"""
    # Get query parameters
    category_id = request.args.get('category_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    sort_by = request.args.get('sort_by', 'date')
    sort_order = request.args.get('sort_order', 'desc')
    
    # Build query - only show expenses for the current user
    query = Expense.query.filter(Expense.user_id == current_user.id)
    
    # Apply filters
    if category_id:
        query = query.filter(Expense.category_id == category_id)
    
    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
        query = query.filter(Expense.date >= start_date)
    
    if end_date:
        end_date = datetime.strptime(end_date, '%Y-%m-%d')
        query = query.filter(Expense.date <= end_date)
    
    # Apply sorting
    if sort_by == 'amount':
        query = query.order_by(Expense.amount.desc() if sort_order == 'desc' else Expense.amount)
    elif sort_by == 'title':
        query = query.order_by(Expense.title.desc() if sort_order == 'desc' else Expense.title)
    else:  # Default to date
        query = query.order_by(Expense.date.desc() if sort_order == 'desc' else Expense.date)
    
    expenses = query.all()
    return jsonify([expense.to_dict() for expense in expenses])

@app.route('/api/expenses/<int:expense_id>', methods=['GET'])
def get_expense(expense_id):
    """Get a specific expense by ID"""
    expense = Expense.query.get_or_404(expense_id)
    return jsonify(expense.to_dict())

@app.route('/api/expenses', methods=['POST'])
@login_required
def create_expense():
    """Create a new expense"""
    data = request.form.to_dict()
    
    # Validate required fields
    required_fields = ['title', 'amount', 'category_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Convert types
    try:
        amount = float(data['amount'])
        category_id = int(data['category_id'])
    except ValueError:
        return jsonify({'error': 'Invalid amount or category_id format'}), 400
    
    # Parse date if provided, otherwise use current date
    date = datetime.utcnow()
    if 'date' in data and data['date']:
        try:
            date = datetime.strptime(data['date'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid date format, use YYYY-MM-DD'}), 400
    
    # Create expense with the current user id
    expense = Expense(
        title=data['title'],
        amount=amount,
        currency=data.get('currency', 'MYR'),
        date=date,
        description=data.get('description', ''),
        category_id=category_id,
        user_id=current_user.id
    )
    
    db.session.add(expense)
    db.session.commit()
    
    # Handle receipt uploads if any
    files = request.files.getlist('receipts')
    for file in files:
        if file and file.filename:
            original_filename = secure_filename(file.filename)
            extension = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
            filename = f"{uuid.uuid4()}.{extension}" if extension else f"{uuid.uuid4()}"
            
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            receipt = Receipt(
                filename=filename,
                original_filename=original_filename,
                expense_id=expense.id
            )
            db.session.add(receipt)
    
    db.session.commit()
    
    return jsonify(expense.to_dict()), 201

@app.route('/api/expenses/<int:expense_id>', methods=['PUT'])
def update_expense(expense_id):
    """Update an existing expense"""
    expense = Expense.query.get_or_404(expense_id)
    data = request.form.to_dict()
    
    # Update fields if provided
    if 'title' in data:
        expense.title = data['title']
    
    if 'amount' in data:
        try:
            expense.amount = float(data['amount'])
        except ValueError:
            return jsonify({'error': 'Invalid amount format'}), 400
    
    if 'date' in data and data['date']:
        try:
            expense.date = datetime.strptime(data['date'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid date format, use YYYY-MM-DD'}), 400
    
    if 'description' in data:
        expense.description = data['description']
    
    if 'currency' in data:
        expense.currency = data['currency']
    
    if 'category_id' in data:
        try:
            category_id = int(data['category_id'])
            # Verify category exists
            category = Category.query.get(category_id)
            if not category:
                return jsonify({'error': 'Category not found'}), 404
            expense.category_id = category_id
        except ValueError:
            return jsonify({'error': 'Invalid category_id format'}), 400
    
    # Handle receipt uploads if any
    files = request.files.getlist('receipts')
    for file in files:
        if file and file.filename:
            original_filename = secure_filename(file.filename)
            extension = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
            filename = f"{uuid.uuid4()}.{extension}" if extension else f"{uuid.uuid4()}"
            
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            receipt = Receipt(
                filename=filename,
                original_filename=original_filename,
                expense_id=expense.id
            )
            db.session.add(receipt)
    
    db.session.commit()
    
    return jsonify(expense.to_dict())

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    """Delete an expense"""
    expense = Expense.query.get_or_404(expense_id)
    
    # Delete associated receipt files
    for receipt in expense.receipts:
        try:
            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], receipt.filename))
        except Exception as e:
            app.logger.error(f"Error deleting file {receipt.filename}: {str(e)}")
    
    db.session.delete(expense)
    db.session.commit()
    
    return jsonify({'message': 'Expense deleted successfully'})

# API Endpoints for Categories
@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all categories"""
    categories = Category.query.all()
    return jsonify([category.to_dict() for category in categories])

@app.route('/api/categories', methods=['POST'])
def create_category():
    """Create a new category"""
    data = request.json
    
    # Validate required fields
    if not data or 'name' not in data:
        return jsonify({'error': 'Missing required field: name'}), 400
    
    # Check if category with same name exists
    existing = Category.query.filter_by(name=data['name']).first()
    if existing:
        return jsonify({'error': 'Category with this name already exists'}), 400
    
    # Create category
    category = Category(
        name=data['name'],
        color=data.get('color', '#6c757d'),
        icon=data.get('icon', 'tag')
    )
    
    db.session.add(category)
    db.session.commit()
    
    return jsonify(category.to_dict()), 201

@app.route('/api/categories/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    """Update an existing category"""
    category = Category.query.get_or_404(category_id)
    data = request.json
    
    # Update fields if provided
    if 'name' in data:
        existing = Category.query.filter_by(name=data['name']).first()
        if existing and existing.id != category_id:
            return jsonify({'error': 'Category with this name already exists'}), 400
        category.name = data['name']
    
    if 'color' in data:
        category.color = data['color']
    
    if 'icon' in data:
        category.icon = data['icon']
    
    db.session.commit()
    
    return jsonify(category.to_dict())

@app.route('/api/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    """Delete a category"""
    category = Category.query.get_or_404(category_id)
    
    # Check if category has expenses
    if category.expenses:
        return jsonify({'error': 'Cannot delete category with associated expenses'}), 400
    
    db.session.delete(category)
    db.session.commit()
    
    return jsonify({'message': 'Category deleted successfully'})

# API Endpoints for Receipts
@app.route('/api/receipts/<int:receipt_id>', methods=['DELETE'])
def delete_receipt(receipt_id):
    """Delete a receipt"""
    receipt = Receipt.query.get_or_404(receipt_id)
    
    # Delete the file
    try:
        os.remove(os.path.join(app.config['UPLOAD_FOLDER'], receipt.filename))
    except Exception as e:
        app.logger.error(f"Error deleting file {receipt.filename}: {str(e)}")
    
    db.session.delete(receipt)
    db.session.commit()
    
    return jsonify({'message': 'Receipt deleted successfully'})

# API Endpoints for Budgets
@app.route('/api/budgets', methods=['GET'])
@login_required
def get_budgets():
    """Get all budgets for the current user"""
    budgets = Budget.query.filter_by(user_id=current_user.id).all()
    return jsonify([budget.to_dict() for budget in budgets])

@app.route('/api/budgets/<int:budget_id>', methods=['GET'])
@login_required
def get_budget(budget_id):
    """Get a specific budget by ID"""
    budget = Budget.query.get_or_404(budget_id)
    # Check if budget belongs to current user
    if budget.user_id != current_user.id:
        return jsonify({'error': 'Not authorized'}), 403
    return jsonify(budget.to_dict())

@app.route('/api/budgets/<int:budget_id>/kpi', methods=['GET'])
@login_required
def get_budget_kpi(budget_id):
    """Get KPI data for a specific budget"""
    budget = Budget.query.get_or_404(budget_id)
    
    # Check if budget belongs to current user
    if budget.user_id != current_user.id:
        return jsonify({'error': 'Not authorized'}), 403
    
    # Calculate total expenses for this budget's timeframe
    query = Expense.query.filter(
        Expense.user_id == current_user.id,
        Expense.date >= budget.start_date,
        Expense.date <= budget.end_date
    )
    
    # If budget is for a specific category, filter by that category
    if budget.category_id:
        query = query.filter(Expense.category_id == budget.category_id)
    
    # Sum expenses
    total_spent = sum(expense.amount for expense in query.all())
    
    # Calculate metrics
    remaining = budget.amount - total_spent
    percentage_used = (total_spent / budget.amount * 100) if budget.amount > 0 else 0
    is_exceeded = total_spent > budget.amount
    
    return jsonify({
        'budget_id': budget.id,
        'budget_name': budget.name,
        'budget_amount': budget.amount,
        'total_spent': total_spent,
        'remaining': remaining, 
        'percentage_used': percentage_used,
        'is_exceeded': is_exceeded,
        'status': 'Exceeded' if is_exceeded else 'On Track',
        'category_name': budget.category.name if budget.category else "All Categories",
        'category_color': budget.category.color if budget.category else "#2e7d32",
        'start_date': budget.start_date.strftime('%Y-%m-%d'),
        'end_date': budget.end_date.strftime('%Y-%m-%d')
    })

@app.route('/api/budgets/kpi', methods=['GET'])
@login_required
def get_all_budgets_kpi():
    """Get KPI data for all active budgets"""
    budgets = Budget.query.filter_by(user_id=current_user.id, is_active=True).all()
    
    if not budgets:
        return jsonify([])
    
    result = []
    for budget in budgets:
        # Calculate total expenses for this budget's timeframe
        query = Expense.query.filter(
            Expense.user_id == current_user.id,
            Expense.date >= budget.start_date,
            Expense.date <= budget.end_date
        )
        
        # If budget is for a specific category, filter by that category
        if budget.category_id:
            query = query.filter(Expense.category_id == budget.category_id)
        
        # Sum expenses
        total_spent = sum(expense.amount for expense in query.all())
        
        # Calculate metrics
        remaining = budget.amount - total_spent
        percentage_used = (total_spent / budget.amount * 100) if budget.amount > 0 else 0
        is_exceeded = total_spent > budget.amount
        
        result.append({
            'budget_id': budget.id,
            'budget_name': budget.name,
            'budget_amount': budget.amount,
            'total_spent': total_spent,
            'remaining': remaining,
            'percentage_used': percentage_used,
            'is_exceeded': is_exceeded,
            'status': 'Exceeded' if is_exceeded else 'On Track',
            'category_name': budget.category.name if budget.category else "All Categories",
            'category_color': budget.category.color if budget.category else "#2e7d32",
            'start_date': budget.start_date.strftime('%Y-%m-%d'),
            'end_date': budget.end_date.strftime('%Y-%m-%d')
        })
    
    return jsonify(result)

@app.route('/api/budgets', methods=['POST'])
@login_required
def create_budget():
    """Create a new budget"""
    data = request.json
    
    # Validate required fields
    required_fields = ['name', 'amount', 'start_date', 'end_date']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Parse dates
    try:
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d')
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d')
    except ValueError:
        return jsonify({'error': 'Invalid date format, use YYYY-MM-DD'}), 400
    
    # Create budget
    budget = Budget(
        name=data['name'],
        amount=float(data['amount']),
        start_date=start_date,
        end_date=end_date,
        category_id=data.get('category_id'),
        user_id=current_user.id,
        is_active=data.get('is_active', True)
    )
    
    db.session.add(budget)
    db.session.commit()
    
    return jsonify(budget.to_dict()), 201

@app.route('/api/budgets/<int:budget_id>', methods=['PUT'])
@login_required
def update_budget(budget_id):
    """Update an existing budget"""
    budget = Budget.query.get_or_404(budget_id)
    
    # Check if budget belongs to current user
    if budget.user_id != current_user.id:
        return jsonify({'error': 'Not authorized'}), 403
    
    data = request.json
    
    # Update fields if provided
    if 'name' in data:
        budget.name = data['name']
    
    if 'amount' in data:
        try:
            budget.amount = float(data['amount'])
        except ValueError:
            return jsonify({'error': 'Invalid amount format'}), 400
    
    if 'start_date' in data:
        try:
            budget.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid start date format, use YYYY-MM-DD'}), 400
    
    if 'end_date' in data:
        try:
            budget.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid end date format, use YYYY-MM-DD'}), 400
    
    if 'category_id' in data:
        budget.category_id = data['category_id']
    
    if 'is_active' in data:
        budget.is_active = data['is_active']
    
    db.session.commit()
    
    return jsonify(budget.to_dict())

@app.route('/api/budgets/<int:budget_id>', methods=['DELETE'])
@login_required
def delete_budget(budget_id):
    """Delete a budget"""
    budget = Budget.query.get_or_404(budget_id)
    
    # Check if budget belongs to current user
    if budget.user_id != current_user.id:
        return jsonify({'error': 'Not authorized'}), 403
    
    db.session.delete(budget)
    db.session.commit()
    
    return jsonify({'message': 'Budget deleted successfully'})

# Reports and Analytics
@app.route('/api/reports/monthly', methods=['GET'])
def monthly_report():
    """Get monthly expense totals"""
    year = request.args.get('year', datetime.now().year, type=int)
    
    monthly_totals = db.session.query(
        extract('month', Expense.date).label('month'),
        func.sum(Expense.amount).label('total')
    ).filter(
        extract('year', Expense.date) == year
    ).group_by(
        extract('month', Expense.date)
    ).all()
    
    # Format the result
    result = []
    month_names = [
        'January', 'February', 'March', 'April', 'May', 'June', 
        'July', 'August', 'September', 'October', 'November', 'December'
    ]
    
    for month_num, total in monthly_totals:
        result.append({
            'month': month_num,
            'month_name': month_names[int(month_num) - 1],
            'total': float(total)
        })
    
    return jsonify(result)

@app.route('/api/reports/category', methods=['GET'])
def category_report():
    """Get expense totals by category"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = db.session.query(
        Category.id,
        Category.name,
        Category.color,
        Category.icon,
        func.sum(Expense.amount).label('total')
    ).join(
        Expense, Category.id == Expense.category_id
    )
    
    # Apply date filters if provided
    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
        query = query.filter(Expense.date >= start_date)
    
    if end_date:
        end_date = datetime.strptime(end_date, '%Y-%m-%d')
        query = query.filter(Expense.date <= end_date)
    
    category_totals = query.group_by(
        Category.id, Category.name, Category.color, Category.icon
    ).all()
    
    # Format the result
    result = []
    for cat_id, name, color, icon, total in category_totals:
        result.append({
            'id': cat_id,
            'name': name,
            'color': color,
            'icon': icon,
            'total': float(total)
        })
    
    return jsonify(result)

@app.route('/api/reports/summary', methods=['GET'])
def expense_summary():
    """Get expense summary (total, avg, etc.)"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Build query for expense statistics
    query = db.session.query(
        func.sum(Expense.amount).label('total'),
        func.avg(Expense.amount).label('average'),
        func.count(Expense.id).label('count'),
        func.max(Expense.amount).label('max'),
        func.min(Expense.amount).label('min')
    )
    
    # Apply date filters if provided
    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
        query = query.filter(Expense.date >= start_date)
    
    if end_date:
        end_date = datetime.strptime(end_date, '%Y-%m-%d')
        query = query.filter(Expense.date <= end_date)
    
    stats = query.first()
    
    # Get recent expenses
    recent_query = Expense.query.order_by(Expense.date.desc()).limit(5)
    if start_date:
        recent_query = recent_query.filter(Expense.date >= start_date)
    if end_date:
        recent_query = recent_query.filter(Expense.date <= end_date)
    
    recent_expenses = recent_query.all()
    
    # Format the result
    result = {
        'total': float(stats.total) if stats.total else 0,
        'average': float(stats.average) if stats.average else 0,
        'count': stats.count,
        'max': float(stats.max) if stats.max else 0,
        'min': float(stats.min) if stats.min else 0,
        'recent_expenses': [expense.to_dict() for expense in recent_expenses]
    }
    
    return jsonify(result)
