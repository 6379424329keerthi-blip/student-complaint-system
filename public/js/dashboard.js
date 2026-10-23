/**
 * Online Complaint Registration and Tracking System
 * Citizen Self-Service Dashboard Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const lookupForm = document.getElementById('citizenLookupForm');
  const queryInput = document.getElementById('citizenQuery');
  const lookupBtn = document.getElementById('lookupBtn');
  const resultsContainer = document.getElementById('citizenResultsContainer');
  const emptyState = document.getElementById('citizenEmptyState');
  const statsRow = document.getElementById('citizenStatsRow');
  const complaintsList = document.getElementById('citizenComplaintsList');
  const filterButtons = document.querySelectorAll('.citizen-filter-btn');

  let allCitizenComplaints = [];
  let currentFilter = 'All';

  // Check localStorage for saved citizen email or phone
  const savedContact = localStorage.getItem('lastCitizenQuery');
  if (savedContact && queryInput) {
    queryInput.value = savedContact;
    fetchCitizenComplaints(savedContact);
  }

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
      fetchCitizenComplaints(query);
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

  async function fetchCitizenComplaints(searchQuery) {
    if (lookupBtn) {
      lookupBtn.disabled = true;
      lookupBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Finding Records...`;
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
        lookupBtn.innerHTML = `<i class="bi bi-search me-2"></i> Find My Complaints`;
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
