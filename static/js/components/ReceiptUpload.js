class ReceiptUpload {
  constructor(options) {
    this.onUpload = options.onUpload || (() => {});
    this.expenseId = null;
  }

  render(expenseId) {
    this.expenseId = expenseId;
    
    const container = document.createElement('div');
    container.className = 'receipt-upload-container';
    
    container.innerHTML = `
      <div class="mb-3">
        <label for="receipt-files" class="form-label">Upload Receipts</label>
        <input class="form-control" type="file" id="receipt-files" multiple accept="image/*,.pdf">
        <div class="form-text">Upload images or PDF files of your receipts.</div>
      </div>
      <div class="mb-3">
        <button type="button" id="upload-receipts-btn" class="btn btn-primary">
          <i class="fas fa-upload"></i> Upload
        </button>
      </div>
    `;
    
    // Initialize event listeners
    setTimeout(() => {
      const uploadButton = container.querySelector('#upload-receipts-btn');
      
      uploadButton.addEventListener('click', () => {
        const fileInput = container.querySelector('#receipt-files');
        const files = fileInput.files;
        
        if (files.length === 0) {
          alert('Please select at least one file to upload.');
          return;
        }
        
        this.onUpload(files, this.expenseId);
      });
    }, 0);
    
    return container;
  }
}
