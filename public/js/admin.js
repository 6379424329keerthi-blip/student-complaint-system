/**
 * Online Complaint Registration and Tracking System
 * Admin Portal Management & Analytics Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Authentication Elements
  const authSection = document.getElementById('adminAuthSection');
  const dashboardSection = document.getElementById('adminDashboardSection');
  const loginForm = document.getElementById('adminLoginForm');
  const logoutBtn = document.getElementById('adminLogoutBtn');
  const adminNameDisplay = document.getElementById('adminNameDisplay');
  const adminRoleDisplay = document.getElementById('adminRoleDisplay');

  // Dashboard Metrics
  const metricTotal = document.getElementById('metricTotal');
  const metricPending = document.getElementById('metricPending');
  const metricReview = document.getElementById('metricReview');
  const metricInProgress = document.getElementById('metricInProgress');
  const metricResolved = document.getElementById('metricResolved');
  const metricAvgTime = document.getElementById('metricAvgTime');

  // Chart References
  let categoryChartInstance = null;
  let priorityChartInstance = null;

  // Complaints Table & Filters
  const complaintsTableBody = document.getElementById('adminComplaintsTable');
  const filterSearch = document.getElementById('adminFilterSearch');
  const filterStatus = document.getElementById('adminFilterStatus');
  const filterCategory = document.getElementById('adminFilterCategory');
  const exportCsvBtn = document.getElementById('exportCsvBtn');

  // Update Status Modal Elements
  const updateModalEl = document.getElementById('updateStatusModal');
  let updateModalInstance = null;
  if (updateModalEl) {
    updateModalInstance = new bootstrap.Modal(updateModalEl);
  }
  const updateStatusForm = document.getElementById('updateStatusForm');
  const updateComplaintId = document.getElementById('updateComplaintId');
  const updateStatusSelect = document.getElementById('updateStatusSelect');
  const updateOfficerName = document.getElementById('updateOfficerName');
  const updateDepartment = document.getElementById('updateDepartment');
  const updateNote = document.getElementById('updateNote');
  const updateRemarks = document.getElementById('updateRemarks');
  const remarksContainer = document.getElementById('remarksContainer');
  const saveStatusBtn = document.getElementById('saveStatusBtn');

  // Initial Auth Check
  const token = localStorage.getItem('adminToken');
  const savedAdmin = localStorage.getItem('adminProfile');

  if (token && savedAdmin) {
    try {
      const admin = JSON.parse(savedAdmin);
      showDashboard(admin);
    } catch (e) {
      logoutAdmin();
    }
  } else {
    showLogin();
  }

  // -------------------------------------------------------------------------
  // Auth Handlers
  // -------------------------------------------------------------------------
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('adminUsername').value.trim();
      const password = document.getElementById('adminPassword').value;
      const loginBtn = document.getElementById('loginSubmitBtn');

      if (!username || !password) {
        showToast('Please enter both username and password.', 'warning');
        return;
      }

      loginBtn.disabled = true;
      loginBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Authenticating...`;

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          localStorage.setItem('adminToken', data.token);
          localStorage.setItem('adminProfile', JSON.stringify(data.admin));
          showToast(data.message || 'Login successful!', 'success');
          showDashboard(data.admin);
        } else {
          showToast(data.message || 'Invalid credentials.', 'error');
        }
      } catch (err) {
        console.error('Login error:', err);
        showToast('Network error during authentication.', 'error');
      } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = `<i class="bi bi-box-arrow-in-right me-2"></i> Log In to Dashboard`;
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logoutAdmin();
    });
  }

  function logoutAdmin() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminProfile');
    showLogin();
    showToast('Logged out successfully.', 'info');
  }

  function showLogin() {
    if (authSection) authSection.style.display = 'block';
    if (dashboardSection) dashboardSection.style.display = 'none';
  }

  function showDashboard(admin) {
    if (authSection) authSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';

    if (adminNameDisplay) adminNameDisplay.textContent = admin.name;
    if (adminRoleDisplay) adminRoleDisplay.textContent = `${admin.role} • ${admin.department}`;

    loadDashboardAnalytics();
    loadComplaintsTable();
  }

  // -------------------------------------------------------------------------
  // Fetch Analytics & Chart.js Rendering
  // -------------------------------------------------------------------------
  async function loadDashboardAnalytics() {
    const currentToken = localStorage.getItem('adminToken');
    if (!currentToken) return;

    try {
      const res = await fetch('/api/admin/dashboard-stats', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });

      if (res.status === 401) {
        logoutAdmin();
        return;
      }

      const data = await res.json();
      if (res.ok && data.success) {
        const { stats, charts } = data;

        // Metric Counters
        if (metricTotal) metricTotal.textContent = stats.total;
        if (metricPending) metricPending.textContent = stats.pending;
        if (metricReview) metricReview.textContent = stats.underReview;
        if (metricInProgress) metricInProgress.textContent = stats.inProgress;
        if (metricResolved) metricResolved.textContent = stats.resolved;
        if (metricAvgTime) metricAvgTime.textContent = `${stats.avgResolutionHours} hrs`;

        // Render Chart.js
        renderCharts(charts);
      }
    } catch (err) {
      console.error('Analytics load error:', err);
    }
  }

  function renderCharts(chartData) {
    // 1. Categories Doughnut Chart
    const catCanvas = document.getElementById('categoryChart');
    if (catCanvas && window.Chart) {
      if (categoryChartInstance) categoryChartInstance.destroy();

      const labels = chartData.categories.map(c => c._id);
      const counts = chartData.categories.map(c => c.count);

      categoryChartInstance = new Chart(catCanvas, {
        type: 'doughnut',
        data: {
          labels: labels.length ? labels : ['No Data'],
          datasets: [{
            data: counts.length ? counts : [1],
            backgroundColor: [
              '#4f46e5', '#06b6d4', '#10b981', '#f59e0b',
              '#ef4444', '#8b5cf6', '#ec4899', '#64748b'
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
          }
        }
      });
    }

    // 2. Priority Distribution Bar Chart
    const priorityCanvas = document.getElementById('priorityChart');
    if (priorityCanvas && window.Chart) {
      if (priorityChartInstance) priorityChartInstance.destroy();

      const pLabels = ['Low', 'Medium', 'High', 'Urgent'];
      const pCounts = pLabels.map(p => {
        const found = chartData.priorities.find(item => item._id === p);
        return found ? found.count : 0;
      });

      priorityChartInstance = new Chart(priorityCanvas, {
        type: 'bar',
        data: {
          labels: pLabels,
          datasets: [{
            label: 'Complaints',
            data: pCounts,
            backgroundColor: ['#94a3b8', '#0ea5e9', '#f59e0b', '#ef4444'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { precision: 0 }
            }
          }
        }
      });
    }
  }

  // -------------------------------------------------------------------------
  // Fetch Complaints Table with Search & Filters
  // -------------------------------------------------------------------------
  async function loadComplaintsTable() {
    const currentToken = localStorage.getItem('adminToken');
    if (!currentToken || !complaintsTableBody) return;

    const search = filterSearch ? filterSearch.value.trim() : '';
    const status = filterStatus ? filterStatus.value : 'All';
    const category = filterCategory ? filterCategory.value : 'All';

    complaintsTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4">
          <div class="spinner-border spinner-border-sm text-primary me-2"></div> Loading grievances...
        </td>
      </tr>
    `;

    try {
      const queryParams = new URLSearchParams({ search, status, category, limit: 50 });
      const res = await fetch(`/api/admin/complaints?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });

      if (res.status === 401) {
        logoutAdmin();
        return;
      }

      const data = await res.json();
      if (res.ok && data.success) {
        const items = data.data || [];
        if (items.length === 0) {
          complaintsTableBody.innerHTML = `
            <tr>
              <td colspan="8" class="text-center text-muted py-5">
                <i class="bi bi-search fs-2 mb-2 d-block"></i>
                No complaints found matching the criteria.
              </td>
            </tr>
          `;
          return;
        }

        complaintsTableBody.innerHTML = items.map(c => `
          <tr>
            <td>
              <span class="fw-bold font-monospace text-primary">${escapeHTML(c.complaintId)}</span>
            </td>
            <td>
              <div class="fw-bold text-dark text-truncate" style="max-width: 220px;" title="${escapeHTML(c.title)}">
                ${escapeHTML(c.title)}
              </div>
              <small class="text-muted"><i class="bi bi-geo-alt"></i> ${escapeHTML(c.location || 'Campus')}</small>
            </td>
            <td><span class="badge bg-light text-dark border">${escapeHTML(c.category)}</span></td>
            <td>${getPriorityBadgeHTML(c.priority)}</td>
            <td>${getStatusBadgeHTML(c.status)}</td>
            <td>
              <div class="fw-semibold small">${escapeHTML(c.citizen.fullName)}</div>
              <small class="text-muted">${escapeHTML(c.citizen.email)}</small>
            </td>
            <td><small class="text-muted">${formatDateTime(c.createdAt)}</small></td>
            <td>
              <div class="btn-group btn-group-sm">
                <button type="button" class="btn btn-outline-primary btn-action-update" data-id="${c.complaintId}" title="Update Status">
                  <i class="bi bi-pencil-square"></i>
                </button>
                <a href="/track.html?id=${c.complaintId}" target="_blank" class="btn btn-outline-secondary" title="View Full Page">
                  <i class="bi bi-box-arrow-up-right"></i>
                </a>
              </div>
            </td>
          </tr>
        `).join('');

        // Attach Update Button Event Listeners
        document.querySelectorAll('.btn-action-update').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const complaint = items.find(x => x.complaintId === id);
            if (complaint) openUpdateModal(complaint);
          });
        });
      }
    } catch (err) {
      console.error('Complaints list error:', err);
    }
  }

  // Filter trigger events
  if (filterSearch) {
    let debounceTimer;
    filterSearch.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadComplaintsTable, 350);
    });
  }
  if (filterStatus) filterStatus.addEventListener('change', loadComplaintsTable);
  if (filterCategory) filterCategory.addEventListener('change', loadComplaintsTable);

  // -------------------------------------------------------------------------
  // Update Status Modal Logic
  // -------------------------------------------------------------------------
  function openUpdateModal(c) {
    if (!updateModalInstance) return;

    updateComplaintId.value = c.complaintId;
    document.getElementById('modalComplaintTitle').textContent = c.title;
    document.getElementById('modalTicketBadge').textContent = c.complaintId;

    updateStatusSelect.value = c.status;
    updateOfficerName.value = c.assignedTo?.name && c.assignedTo.name !== 'Unassigned' ? c.assignedTo.name : '';
    updateDepartment.value = c.assignedTo?.department || c.category;
    updateNote.value = '';
    updateRemarks.value = c.resolution?.remarks || '';

    toggleRemarksVisibility(c.status);

    updateModalInstance.show();
  }

  if (updateStatusSelect) {
    updateStatusSelect.addEventListener('change', () => {
      toggleRemarksVisibility(updateStatusSelect.value);
    });
  }

  function toggleRemarksVisibility(status) {
    if (remarksContainer) {
      if (status === 'Resolved' || status === 'Rejected') {
        remarksContainer.style.display = 'block';
        updateRemarks.setAttribute('required', 'true');
      } else {
        remarksContainer.style.display = 'none';
        updateRemarks.removeAttribute('required');
      }
    }
  }

  if (updateStatusForm) {
    updateStatusForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentToken = localStorage.getItem('adminToken');
      const id = updateComplaintId.value;
      const status = updateStatusSelect.value;
      const assignedOfficer = updateOfficerName.value.trim();
      const department = updateDepartment.value.trim();
      const note = updateNote.value.trim();
      const remarks = updateRemarks.value.trim();

      if ((status === 'Resolved' || status === 'Rejected') && remarks.length < 5) {
        showToast('Please provide resolution or rejection remarks (at least 5 characters).', 'warning');
        updateRemarks.focus();
        return;
      }

      saveStatusBtn.disabled = true;
      saveStatusBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Updating...`;

      try {
        const res = await fetch(`/api/admin/complaints/${id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          },
          body: JSON.stringify({ status, assignedOfficer, department, note, remarks })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          showToast(data.message, 'success');
          updateModalInstance.hide();
          loadDashboardAnalytics();
          loadComplaintsTable();
        } else {
          showToast(data.message || 'Status update failed.', 'error');
        }
      } catch (err) {
        console.error('Update status error:', err);
        showToast('Network error while updating status.', 'error');
      } finally {
        saveStatusBtn.disabled = false;
        saveStatusBtn.innerHTML = `<i class="bi bi-check2-circle me-1"></i> Save Changes`;
      }
    });
  }

  // -------------------------------------------------------------------------
  // Export CSV Action
  // -------------------------------------------------------------------------
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', async () => {
      const currentToken = localStorage.getItem('adminToken');
      if (!currentToken) return;

      try {
        showToast('Preparing complaints CSV report...', 'info');
        const res = await fetch('/api/admin/export/csv', {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `complaints-report-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          showToast('CSV report exported successfully!', 'success');
        } else {
          showToast('Failed to export CSV report.', 'error');
        }
      } catch (err) {
        console.error('Export CSV error:', err);
        showToast('Error downloading CSV file.', 'error');
      }
    });
  }
});
