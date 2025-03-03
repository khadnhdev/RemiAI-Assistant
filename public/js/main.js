document.addEventListener('DOMContentLoaded', function() {
  // Auto-hide alerts after 5 seconds
  setTimeout(function() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(function(alert) {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    });
  }, 5000);

  // Custom attributes functionality for recipient form
  const addAttributeBtn = document.getElementById('add-attribute-btn');
  if (addAttributeBtn) {
    addAttributeBtn.addEventListener('click', function() {
      const container = document.getElementById('custom-attributes');
      const rowCount = container.querySelectorAll('.attribute-row').length;
      
      const row = document.createElement('div');
      row.className = 'attribute-row row';
      row.innerHTML = `
        <div class="col-md-5 mb-3">
          <input type="text" class="form-control" name="custom_key_${rowCount}" placeholder="Tên thuộc tính">
        </div>
        <div class="col-md-5 mb-3">
          <input type="text" class="form-control" name="custom_${rowCount}" placeholder="Giá trị">
        </div>
        <div class="col-md-2 mb-3">
          <button type="button" class="btn btn-danger remove-attribute">Xóa</button>
        </div>
      `;
      
      container.appendChild(row);
      
      // Add remove handler
      row.querySelector('.remove-attribute').addEventListener('click', function() {
        container.removeChild(row);
      });
    });
  }

  // Remove attribute handler
  document.querySelectorAll('.remove-attribute').forEach(button => {
    button.addEventListener('click', function() {
      const row = this.closest('.attribute-row');
      row.parentNode.removeChild(row);
    });
  });

  // Schedule type selector for reminder form
  const scheduleTypeSelect = document.getElementById('schedule_type');
  if (scheduleTypeSelect) {
    scheduleTypeSelect.addEventListener('change', function() {
      const selectedType = this.value;
      document.querySelectorAll('.schedule-option').forEach(opt => {
        opt.classList.remove('active');
      });
      
      const selectedOption = document.getElementById(`${selectedType}-options`);
      if (selectedOption) {
        selectedOption.classList.add('active');
      }
    });
    
    // Trigger change event to initialize the form
    scheduleTypeSelect.dispatchEvent(new Event('change'));
  }

  // Confirmation for delete actions
  document.querySelectorAll('.delete-confirm').forEach(form => {
    form.addEventListener('submit', function(e) {
      if (!confirm('Bạn có chắc chắn muốn xóa không? Hành động này không thể hoàn tác.')) {
        e.preventDefault();
      }
    });
  });
}); 