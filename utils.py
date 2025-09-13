import os
import uuid
from werkzeug.utils import secure_filename
from app import app, db
from models import Receipt

def save_receipt(file, expense_id):
    """
    Save an uploaded receipt file and create a database record
    
    Args:
        file: The uploaded file object
        expense_id: The ID of the expense to associate with this receipt
        
    Returns:
        Receipt: The created Receipt object
    """
    if not file or not file.filename:
        return None
        
    # Secure the filename and generate a unique name
    original_filename = secure_filename(file.filename)
    extension = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
    filename = f"{uuid.uuid4()}.{extension}" if extension else f"{uuid.uuid4()}"
    
    # Save the file
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    
    # Create receipt record
    receipt = Receipt(
        filename=filename,
        original_filename=original_filename,
        expense_id=expense_id
    )
    db.session.add(receipt)
    db.session.commit()
    
    return receipt

def delete_receipt_file(filename):
    """
    Delete a receipt file from the file system
    
    Args:
        filename: The filename to delete
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
    except Exception as e:
        app.logger.error(f"Error deleting file {filename}: {str(e)}")
        return False
    
    return False
