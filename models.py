from app import db
from datetime import datetime
import json
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    expenses = db.relationship('Expense', backref='user', lazy=True, cascade="all, delete-orphan")
    budgets = db.relationship('Budget', backref='user', lazy=True, cascade="all, delete-orphan")
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f"<User {self.username}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email
        }

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    color = db.Column(db.String(20), default="#2e7d32")  # Forest green default color
    icon = db.Column(db.String(50), default="tag")  # Default icon
    expenses = db.relationship('Expense', backref='category', lazy=True)
    budgets = db.relationship('Budget', backref='category', lazy=True)

    def __repr__(self):
        return f"<Category {self.name}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'icon': self.icon
        }

class Budget(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    
    def __repr__(self):
        return f"<Budget {self.name} - MYR {self.amount}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'amount': self.amount,
            'start_date': self.start_date.strftime('%Y-%m-%d'),
            'end_date': self.end_date.strftime('%Y-%m-%d'),
            'category_id': self.category_id,
            'user_id': self.user_id,
            'is_active': self.is_active,
            'category_name': self.category.name if self.category else "All Categories",
            'category_color': self.category.color if self.category else "#2e7d32",
            'category_icon': self.category.icon if self.category else "money-bill"
        }

class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default="UGX")
    date = db.Column(db.DateTime, default=datetime.utcnow)
    description = db.Column(db.Text, nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Initially allow null for data migration
    receipts = db.relationship('Receipt', backref='expense', lazy=True, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Expense {self.title} - {self.currency} {self.amount}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'amount': self.amount,
            'currency': self.currency,
            'date': self.date.strftime('%Y-%m-%d'),
            'description': self.description,
            'category_id': self.category_id,
            'user_id': self.user_id,
            'category_name': self.category.name if self.category else None,
            'category_color': self.category.color if self.category else None,
            'category_icon': self.category.icon if self.category else None,
            'receipts': [receipt.to_dict() for receipt in self.receipts]
        }

class Receipt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    expense_id = db.Column(db.Integer, db.ForeignKey('expense.id'), nullable=False)
    
    def __repr__(self):
        return f"<Receipt {self.original_filename}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'upload_date': self.upload_date.strftime('%Y-%m-%d'),
            'expense_id': self.expense_id
        }

def create_default_categories():
    """Create default categories if they don't exist"""
    default_categories = [
        {"name": "Food & Dining", "color": "#FF5733", "icon": "utensils"},
        {"name": "Transportation", "color": "#33A8FF", "icon": "car"},
        {"name": "Housing", "color": "#33FF57", "icon": "home"},
        {"name": "Utilities", "color": "#5733FF", "icon": "bolt"},
        {"name": "Entertainment", "color": "#FF33A1", "icon": "film"},
        {"name": "Shopping", "color": "#33FFC1", "icon": "shopping-cart"},
        {"name": "Personal Care", "color": "#FFC133", "icon": "spa"},
        {"name": "Health & Medical", "color": "#FF3333", "icon": "medkit"},
        {"name": "Education", "color": "#33FFEC", "icon": "graduation-cap"},
        {"name": "Travel", "color": "#C133FF", "icon": "plane"},
        {"name": "Gifts & Donations", "color": "#FF3380", "icon": "gift"},
        {"name": "Business", "color": "#3380FF", "icon": "briefcase"},
        {"name": "Other", "color": "#808080", "icon": "ellipsis-h"}
    ]
    
    for category_data in default_categories:
        # Check if category exists
        existing = Category.query.filter_by(name=category_data["name"]).first()
        if not existing:
            category = Category(**category_data)
            db.session.add(category)
    
    db.session.commit()
