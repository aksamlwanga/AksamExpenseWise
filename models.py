from app import db
from datetime import datetime
import json

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    color = db.Column(db.String(20), default="#6c757d")  # Default color
    icon = db.Column(db.String(50), default="tag")  # Default icon
    expenses = db.relationship('Expense', backref='category', lazy=True)

    def __repr__(self):
        return f"<Category {self.name}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'icon': self.icon
        }

class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    description = db.Column(db.Text, nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    receipts = db.relationship('Receipt', backref='expense', lazy=True, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Expense {self.title} - ${self.amount}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'amount': self.amount,
            'date': self.date.strftime('%Y-%m-%d'),
            'description': self.description,
            'category_id': self.category_id,
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
