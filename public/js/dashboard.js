/**
 * Student Online Complaint Registration and Tracking System
 * Student Portal & Grievance History Controller with Full Logout Support
 */

document.addEventListener('DOMContentLoaded', () => {
  const lookupForm = document.getElementById('citizenLookupForm');
  const queryInput = document.getElementById('citizenQuery');
  const lookupBtn = document.getElementById('lookupBtn');
  const resultsContainer = document.getElementById('citizenResultsContainer');
  const emptyState = document.getElementById('citizenEmptyState');
  const complaintsList = document.getElementById('citizenComplaintsList');
  const filterButtons = document.querySelectorAll('.citizen-filter-btn');

  // Student Profile Elements
  const studentBanner = document.getElementById('studentProfileBanner');
  const guestPrompt = document.getElementById('guestLoginPrompt');
  const profileName = document.getElementById('studentProfileName');
  const profileRegNo = document.getElementById('studentProfileRegNo');
  const profileDept = document.getElementById('studentProfileDept');
  const profileEmail = document.getElementById('studentProfileEmail');
  const logoutBtn = document.getElementById('studentLogoutBtn');
  const logoutRegNoDisplay = document.getElementById('logoutRegNoDisplay');

  let allCitizenComplaints = [];
  let currentFilter = 'All';

  // Check if Student is logged in via JWT
  const studentToken = localStorage.getItem('studentToken');
  const studentProfileJson = localStorage.getItem('studentProfile');

  if (studentToken && studentProfileJson) {
    try {
      const student = JSON.parse(studentProfileJson);
      renderLoggedInStudent(student);
      fetchStudentComplaints(studentToken);
    } catch (e) {
      handleStudentLogout();
    }
  } else {
    // Check if there was a guest search query saved
    const savedContact = localStorage.getItem('lastCitizenQuery');
    if (savedContact && queryInput) {
      queryInput.value = savedContact;
      fetchGuestComplaints(savedContact);
    }
  }

  // Setup Student Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      handleStudentLogout();
    });
  }

  function handleStudentLogout() {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentProfile');
    showToast('Student successfully signed out.', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  function renderLoggedInStudent(student) {
    if (guestPrompt) guestPrompt.style.display = 'none';
    if (studentBanner) studentBanner.style.display = 'block';

    if (profileName) profileName.textContent = student.name;
    if (profileRegNo) profileRegNo.textContent = student.registerNumber;
    if (profileDept) profileDept.textContent = student.department || 'Computer Science and Engineering';
    if (profileEmail) profileEmail.textContent = student.email;
    if (logoutRegNoDisplay) logoutRegNoDisplay.textContent = student.registerNumber;

    // Update navbar pill
    const navAuthPill = document.getElementById('navStudentAuthPill');
    if (navAuthPill) {
      navAuthPill.innerHTML = `
        <div class="d-flex align-items-center gap-1">
          <span class="badge bg-primary-subtle text-primary border border-primary px-2 py-2 font-monospace">
            <i class="bi bi-person-circle me-1"></i> ${escapeHTML(student.registerNumber)}
          </span>
          <button type="button" class="btn btn-sm btn-outline-danger py-1 px-2" id="navLogoutBtn" title="Sign Out">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>
      `;
      const navLogout = document.getElementById('navLogoutBtn');
      if (navLogout) navLogout.addEventListener('click', handleStudentLogout);
    }
  }

  // Fetch complaints for authenticated student
  async function fetchStudentComplaints(token) {
    try {
      const res = await fetch('/api/students/my-complaints', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        handleStudentLogout();
        return;
      }

      const result = await res.json();
      if (res.ok && result.success) {
        allCitizenComplaints = result.data || [];
        updateSummaryStats();
        renderComplaints();

        if (resultsContainer) resultsContainer.style.display = 'block';
        if (allCitizenComplaints.length === 0 && emptyState) {
          emptyState.style.display = 'block';
        }
      }
    } catch (err) {
      console.error('Error fetching student complaints:', err);
    }
  }

  // Guest lookup form listener
  if (lookupForm) {
    lookupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = queryInput.value.trim();
      if (!query || query.length < 3) {
        showToast('Please enter your email or 10-digit mobile number.', 'warning');
        queryInput.focus();
        return;
      }

      localStorage.setItem('lastCitizenQuery', query);
      fetchGuestComplaints(query);
    });
  }

  // Filter Buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active', 'btn-primary'));
      filterButtons.forEach(b => b.classList.add('btn-outline-secondary'));
      btn.classList.add('active', 'btn-primary');
      btn.classList.remove('btn-outline-secondary');

      currentFilter = btn.getAttribute('data-status');
      renderComplaints();
    });
  });

  async function fetchGuestComplaints(searchQuery) {
    if (lookupBtn) {
      lookupBtn.disabled = true;
      lookupBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Searching...`;
    }

    try {
      const res = await fetch(`/api/complaints/citizen?query=${encodeURIComponent(searchQuery)}`);
      const result = await res.json();

      if (res.ok && result.success) {
        allCitizenComplaints = result.data || [];
        updateSummaryStats();
        renderComplaints();

        if (emptyState) emptyState.style.display = 'none';
        if (resultsContainer) resultsContainer.style.display = 'block';

        if (allCitizenComplaints.length === 0) {
          showToast('No complaints found under this email or mobile number.', 'info');
        } else {
          showToast(`Found ${allCitizenComplaints.length} complaint(s).`, 'success');
        }
      } else {
        showToast(result.message || 'Error retrieving records.', 'error');
      }
    } catch (err) {
      console.error('Citizen lookup error:', err);
      showToast('Network error while looking up records.', 'error');
    } finally {
      if (lookupBtn) {
        lookupBtn.disabled = false;
        lookupBtn.innerHTML = `<i class="bi bi-search me-1"></i> Search`;
      }
    }
  }

  function updateSummaryStats() {
    const total = allCitizenComplaints.length;
    const pending = allCitizenComplaints.filter(c => c.status === 'Pending').length;
    const inProgress = allCitizenComplaints.filter(c => c.status === 'In Progress' || c.status === 'Under Review').length;
    const resolved = allCitizenComplaints.filter(c => c.status === 'Resolved').length;

    const countTotal = document.getElementById('citizenCountTotal');
    const countPending = document.getElementById('citizenCountPending');
    const countInProgress = document.getElementById('citizenCountInProgress');
    const countResolved = document.getElementById('citizenCountResolved');

    if (countTotal) countTotal.textContent = total;
    if (countPending) countPending.textContent = pending;
    if (countInProgress) countInProgress.textContent = inProgress;
    if (countResolved) countResolved.textContent = resolved;
  }

  function renderComplaints() {
    if (!complaintsList) return;

    let filtered = allCitizenComplaints;
    if (currentFilter !== 'All') {
      if (currentFilter === 'In Progress') {
        filtered = allCitizenComplaints.filter(c => c.status === 'In Progress' || c.status === 'Under Review');
      } else {
        filtered = allCitizenComplaints.filter(c => c.status === currentFilter);
      }
    }

    if (filtered.length === 0) {
      complaintsList.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-inbox fs-1 text-muted"></i>
          <h5 class="text-secondary mt-3">No complaints match the "${escapeHTML(currentFilter)}" filter.</h5>
        </div>
      `;
      return;
    }

    complaintsList.innerHTML = filtered.map(item => `
      <div class="col-md-6 col-lg-4">
        <div class="card card-modern h-100 p-4 d-flex flex-column justify-content-between">
          <div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="fw-bold font-monospace text-primary">${escapeHTML(item.complaintId)}</span>
              ${getStatusBadgeHTML(item.status)}
            </div>
            
            <h5 class="fw-bold text-dark mb-2 text-truncate" title="${escapeHTML(item.title)}">
              ${escapeHTML(item.title)}
            </h5>
            
            <p class="text-secondary small mb-3" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
              ${escapeHTML(item.description)}
            </p>
            
            <div class="small text-muted mb-2">
              <i class="bi bi-tag me-1"></i> ${escapeHTML(item.category)} &bull; ${getPriorityBadgeHTML(item.priority)}
            </div>
            <div class="small text-muted">
              <i class="bi bi-clock me-1"></i> ${formatDateTime(item.createdAt)}
            </div>
          </div>

          <div class="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
            <span class="small text-secondary"><i class="bi bi-geo-alt"></i> ${escapeHTML(item.location || 'Campus')}</span>
            <a href="/track.html?id=${item.complaintId}" class="btn btn-sm btn-primary-custom py-1 px-3">
              <i class="bi bi-arrow-right-circle me-1"></i> View Case
            </a>
          </div>
        </div>
      </div>
    `).join('');
  }
});
