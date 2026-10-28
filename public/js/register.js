/**
 * Online Complaint Registration and Tracking System
 * Registration Form Controller with Comprehensive Validation
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('complaintForm');
  if (!form) return;

  // Input Elements
  const fullName = document.getElementById('fullName');
  const email = document.getElementById('email');
  const phone = document.getElementById('phone');
  const userType = document.getElementById('userType');
  const category = document.getElementById('category');
  const priority = document.getElementById('priority');
  const title = document.getElementById('title');
  const description = document.getElementById('description');
  const location = document.getElementById('location');
  const fileInput = document.getElementById('attachment');
  const filePreview = document.getElementById('filePreview');
  const submitBtn = document.getElementById('submitBtn');

  // Character counter elements
  const titleCounter = document.getElementById('titleCounter');
  const descCounter = document.getElementById('descCounter');

  // Gatekeeper: Do NOT allow registering complaints without student login
  const authRequiredGate = document.getElementById('authRequiredGate');
  const complaintFormWrapper = document.getElementById('complaintFormWrapper');
  const studentToken = localStorage.getItem('studentToken');
  const studentProfileJson = localStorage.getItem('studentProfile');

  if (!studentToken || !studentProfileJson) {
    if (authRequiredGate) authRequiredGate.style.display = 'block';
    if (complaintFormWrapper) complaintFormWrapper.style.display = 'none';
    return; // Block execution for unauthenticated users
  }

  // Student is authenticated: reveal form
  if (authRequiredGate) authRequiredGate.style.display = 'none';
  if (complaintFormWrapper) complaintFormWrapper.style.display = 'block';

  // Auto-fill logged in student profile details
  try {
    const student = JSON.parse(studentProfileJson);
    if (fullName) { fullName.value = student.name; fullName.readOnly = true; fullName.classList.add('is-valid'); }
    if (email) { email.value = student.email; email.readOnly = true; email.classList.add('is-valid'); }
    if (phone && student.phone) { phone.value = student.phone; phone.classList.add('is-valid'); }
    const idNumber = document.getElementById('idNumber');
    if (idNumber) { idNumber.value = student.registerNumber; idNumber.readOnly = true; }
    if (userType) { userType.value = 'Student'; }

    // Insert Logged in banner above form
    const formCard = form.closest('.card');
    if (formCard) {
      const studentAlert = document.createElement('div');
      studentAlert.className = 'alert alert-primary d-flex justify-content-between align-items-center p-3 mb-4 rounded-3 border-primary';
      studentAlert.innerHTML = `
        <div class="d-flex align-items-center gap-2 small">
          <i class="bi bi-mortarboard-fill fs-5 text-primary"></i>
          <span>Logged in as <strong>${escapeHTML(student.name)}</strong> (<code class="fw-bold">${escapeHTML(student.registerNumber)}</code> &bull; ${escapeHTML(student.department || 'CSE')})</span>
        </div>
        <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2" id="formLogoutBtn">
          <i class="bi bi-box-arrow-right"></i> Sign Out
        </button>
      `;
      formCard.parentElement.insertBefore(studentAlert, formCard);

      document.getElementById('formLogoutBtn').addEventListener('click', () => {
        localStorage.removeItem('studentToken');
        localStorage.removeItem('studentProfile');
        window.location.reload();
      });
    }
  } catch (e) {
    console.warn('Student autofill error:', e);
  }

  // -------------------------------------------------------------------------
  // Live Validation Rules
  // -------------------------------------------------------------------------

  function validateFullName() {
    const val = fullName.value.trim();
    const nameRegex = /^[a-zA-Z\s.'-]+$/;
    if (val.length === 0) {
      setInvalid(fullName, 'Complainant full name is required.');
      return false;
    } else if (val.length < 2 || val.length > 70) {
      setInvalid(fullName, 'Full name must be between 2 and 70 characters.');
      return false;
    } else if (!nameRegex.test(val)) {
      setInvalid(fullName, 'Name may only contain letters, spaces, hyphens, and periods.');
      return false;
    }
    setValid(fullName);
    return true;
  }

  function validateEmail() {
    const val = email.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (val.length === 0) {
      setInvalid(email, 'Email address is required for ticket tracking updates.');
      return false;
    } else if (!emailRegex.test(val)) {
      setInvalid(email, 'Please enter a valid email format (e.g., student@institution.edu).');
      return false;
    }
    setValid(email);
    return true;
  }

  function validatePhone() {
    const val = phone.value.trim();
    const phoneRegex = /^[0-9]{10}$/;
    if (val.length === 0) {
      setInvalid(phone, 'Contact mobile number is required.');
      return false;
    } else if (!phoneRegex.test(val)) {
      setInvalid(phone, 'Phone number must be exactly 10 digits without spaces or country code.');
      return false;
    }
    setValid(phone);
    return true;
  }

  function validateCategory() {
    const val = category.value;
    if (!val || val === '') {
      setInvalid(category, 'Please select the relevant department or category.');
      return false;
    }
    setValid(category);
    return true;
  }

  function validateTitle() {
    const val = title.value.trim();
    if (titleCounter) titleCounter.textContent = `${val.length}/120`;
    if (val.length === 0) {
      setInvalid(title, 'Complaint title is required.');
      return false;
    } else if (val.length < 5) {
      setInvalid(title, `Title is too brief (${val.length} chars). Minimum 5 characters required.`);
      return false;
    } else if (val.length > 120) {
      setInvalid(title, 'Title cannot exceed 120 characters.');
      return false;
    }
    setValid(title);
    return true;
  }

  function validateDescription() {
    const val = description.value.trim();
    if (descCounter) descCounter.textContent = `${val.length}/2000`;
    if (val.length === 0) {
      setInvalid(description, 'Please describe your grievance in detail.');
      return false;
    } else if (val.length < 15) {
      setInvalid(description, `Description is too short (${val.length} chars). Minimum 15 characters required for investigation.`);
      return false;
    } else if (val.length > 2000) {
      setInvalid(description, 'Description exceeds 2000 character maximum limit.');
      return false;
    }
    setValid(description);
    return true;
  }

  function validateAttachment() {
    if (!fileInput.files || fileInput.files.length === 0) {
      if (filePreview) filePreview.innerHTML = '';
      return true; // Optional field
    }

    const file = fileInput.files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5 MB

    if (!allowedTypes.includes(file.type)) {
      setInvalid(fileInput, 'Unsupported file format. Only JPG, PNG, WEBP images, or PDF documents allowed.');
      if (filePreview) filePreview.innerHTML = '';
      return false;
    }

    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setInvalid(fileInput, `File is too large (${sizeMB} MB). Maximum allowed size is 5 MB.`);
      if (filePreview) filePreview.innerHTML = '';
      return false;
    }

    setValid(fileInput);

    // Render Preview
    if (filePreview) {
      const sizeFormatted = (file.size / 1024).toFixed(1) + ' KB';
      const isImg = file.type.startsWith('image/');
      const icon = isImg ? 'bi-file-earmark-image' : 'bi-file-earmark-pdf';

      filePreview.innerHTML = `
        <div class="d-flex align-items-center justify-content-between p-2 mt-2 bg-light rounded border">
          <div class="d-flex align-items-center gap-2">
            <i class="bi ${icon} fs-4 text-primary"></i>
            <div>
              <div class="fw-bold small text-truncate" style="max-width: 250px;">${escapeHTML(file.name)}</div>
              <small class="text-muted">${sizeFormatted}</small>
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-outline-danger" id="removeFileBtn" title="Remove attachment">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      `;

      document.getElementById('removeFileBtn').addEventListener('click', () => {
        fileInput.value = '';
        filePreview.innerHTML = '';
        fileInput.classList.remove('is-valid', 'is-invalid');
      });
    }

    return true;
  }

  // -------------------------------------------------------------------------
  // Helper UI State Setters
  // -------------------------------------------------------------------------
  function setInvalid(element, msg) {
    element.classList.remove('is-valid');
    element.classList.add('is-invalid');
    const feedback = element.parentElement.querySelector('.invalid-feedback');
    if (feedback) feedback.textContent = msg;
  }

  function setValid(element) {
    element.classList.remove('is-invalid');
    element.classList.add('is-valid');
  }

  // Event Listeners for Live Validation
  fullName.addEventListener('input', validateFullName);
  fullName.addEventListener('blur', validateFullName);

  email.addEventListener('input', validateEmail);
  email.addEventListener('blur', validateEmail);

  phone.addEventListener('input', validatePhone);
  phone.addEventListener('blur', validatePhone);

  category.addEventListener('change', validateCategory);

  title.addEventListener('input', validateTitle);
  title.addEventListener('blur', validateTitle);

  description.addEventListener('input', validateDescription);
  description.addEventListener('blur', validateDescription);

  if (fileInput) {
    fileInput.addEventListener('change', validateAttachment);
  }

  // -------------------------------------------------------------------------
  // Form Submission
  // -------------------------------------------------------------------------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Trigger full validation across all fields
    const isNameValid = validateFullName();
    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();
    const isCategoryValid = validateCategory();
    const isTitleValid = validateTitle();
    const isDescValid = validateDescription();
    const isFileValid = validateAttachment();

    const formIsValid = isNameValid && isEmailValid && isPhoneValid && isCategoryValid && isTitleValid && isDescValid && isFileValid;

    if (!formIsValid) {
      showToast('Please fix the highlighted form errors before submitting.', 'error');
      // Scroll to the first invalid field
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus();
      }
      return;
    }

    // Submit via AJAX / Fetch
    const formData = new FormData(form);

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Lodging Complaint...`;

    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${studentToken}`
        },
        body: formData
      });

      if (response.status === 401) {
        showToast('Your session has expired. Please log in again to lodge a complaint.', 'error');
        localStorage.removeItem('studentToken');
        localStorage.removeItem('studentProfile');
        setTimeout(() => window.location.href = '/student-login.html', 1000);
        return;
      }

      const result = await response.json();

      if (response.ok && result.success) {
        showToast('Complaint submitted successfully!', 'success');
        form.reset();
        if (titleCounter) titleCounter.textContent = '0/120';
        if (descCounter) descCounter.textContent = '0/2000';
        if (filePreview) filePreview.innerHTML = '';
        form.querySelectorAll('.is-valid, .is-invalid').forEach(el => el.classList.remove('is-valid', 'is-invalid'));

        // Display Acknowledgment Modal with Ticket & QR Code
        displayAcknowledgmentModal(result.data);
      } else {
        // Handle server-side validation error array
        if (result.errors && Array.isArray(result.errors)) {
          result.errors.forEach(err => {
            const fieldEl = form.querySelector(`[name="${err.field}"]`);
            if (fieldEl) {
              setInvalid(fieldEl, err.message);
            }
          });
          showToast(result.message || 'Validation error returned by server.', 'error');
        } else {
          showToast(result.message || 'Submission failed. Please try again.', 'error');
        }
      }
    } catch (err) {
      console.error('Submission error:', err);
      showToast('Network error while communicating with server.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="bi bi-send-check me-2"></i> Submit Complaint`;
    }
  });

  // Modal Display Logic
  function displayAcknowledgmentModal(ticketData) {
    const modalEl = document.getElementById('successModal');
    if (!modalEl) {
      // Fallback redirect if modal missing
      window.location.href = `/track.html?id=${ticketData.complaintId}`;
      return;
    }

    document.getElementById('modalTicketId').textContent = ticketData.complaintId;
    document.getElementById('modalTitle').textContent = ticketData.title;
    document.getElementById('modalCategory').textContent = ticketData.category;
    document.getElementById('modalPriority').innerHTML = getPriorityBadgeHTML(ticketData.priority);
    document.getElementById('modalName').textContent = ticketData.citizen.fullName;
    document.getElementById('modalEmail').textContent = ticketData.citizen.email;
    document.getElementById('modalDate').textContent = formatDateTime(ticketData.createdAt);

    const qrImg = document.getElementById('modalQrCode');
    if (qrImg && ticketData.qrCode) {
      qrImg.src = ticketData.qrCode;
      qrImg.style.display = 'block';
    }

    // Direct Track Link
    const trackLink = document.getElementById('modalTrackLink');
    if (trackLink) {
      trackLink.href = `/track.html?id=${ticketData.complaintId}`;
    }

    // Copy Ticket Button
    const copyBtn = document.getElementById('copyTicketBtn');
    if (copyBtn) {
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(ticketData.complaintId);
        showToast(`Copied ${ticketData.complaintId} to clipboard!`, 'info');
      };
    }

    // Show modal using Bootstrap Modal instance
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  }
});
