/**
 * Online Complaint Registration and Tracking System
 * Core Client-side Utility Scripts
 */

// Global Toast Notification Helper
function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container-custom';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-custom ${type}`;

  const iconMap = {
    success: 'bi-check-circle-fill text-success',
    error: 'bi-exclamation-triangle-fill text-danger',
    warning: 'bi-exclamation-circle-fill text-warning',
    info: 'bi-info-circle-fill text-primary'
  };

  const iconClass = iconMap[type] || iconMap.info;

  toast.innerHTML = `
    <i class="bi ${iconClass} fs-5"></i>
    <div class="flex-grow-1" style="font-size: 0.9rem; font-weight: 500;">${escapeHTML(message)}</div>
    <button type="button" class="btn-close btn-close-sm" aria-label="Close" style="font-size: 0.75rem;"></button>
  `;

  const closeBtn = toast.querySelector('.btn-close');
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 400);
    }
  }, duration);
}

// XSS Sanitizer for DOM injection
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Format ISO date to readable string
function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Generate styled HTML badge for Status
function getStatusBadgeHTML(status) {
  const normalized = (status || 'Pending').toLowerCase().replace(/\s+/g, '-');
  const iconMap = {
    'pending': 'bi-clock-history',
    'under-review': 'bi-search',
    'in-progress': 'bi-gear-wide-connected',
    'resolved': 'bi-check2-circle',
    'rejected': 'bi-x-circle'
  };
  const icon = iconMap[normalized] || 'bi-circle';
  return `<span class="badge-status ${normalized}"><i class="bi ${icon}"></i> ${escapeHTML(status)}</span>`;
}

// Generate styled HTML badge for Priority
function getPriorityBadgeHTML(priority) {
  const p = (priority || 'Medium').toLowerCase();
  return `<span class="badge-priority ${p}">${escapeHTML(priority)}</span>`;
}

// Active Navbar link highlighter
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '/' && href === 'index.html') || (href && currentPath.endsWith(href))) {
      link.classList.add('active');
    }
  });

  // Load public stats if on landing page
  const statsSection = document.getElementById('publicStatsSection');
  if (statsSection) {
    loadPublicStats();
  }
});

// Load public dashboard stats on Landing Page
async function loadPublicStats() {
  try {
    const res = await fetch('/api/complaints/public-stats');
    const data = await res.json();
    if (data.success) {
      const { stats, recentActivity } = data;
      const totalEl = document.getElementById('statTotalComplaints');
      const inProgressEl = document.getElementById('statInProgress');
      const resolvedEl = document.getElementById('statResolved');
      const rateEl = document.getElementById('statResolutionRate');

      if (totalEl) totalEl.textContent = stats.total;
      if (inProgressEl) inProgressEl.textContent = stats.inProgress;
      if (resolvedEl) resolvedEl.textContent = stats.resolved;
      if (rateEl) rateEl.textContent = `${stats.resolutionRate}%`;

      // Render recent activity table
      const activityTable = document.getElementById('recentActivityFeed');
      if (activityTable && recentActivity && recentActivity.length > 0) {
        activityTable.innerHTML = recentActivity.map(item => `
          <tr>
            <td><span class="fw-bold text-primary font-monospace">${escapeHTML(item.complaintId)}</span></td>
            <td><div class="text-truncate" style="max-width: 280px;">${escapeHTML(item.title)}</div></td>
            <td><span class="badge bg-light text-dark border">${escapeHTML(item.category)}</span></td>
            <td>${getPriorityBadgeHTML(item.priority)}</td>
            <td>${getStatusBadgeHTML(item.status)}</td>
            <td><small class="text-muted">${formatDateTime(item.createdAt)}</small></td>
            <td>
              <a href="/track.html?id=${item.complaintId}" class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 0.8rem;">
                <i class="bi bi-eye"></i> Track
              </a>
            </td>
          </tr>
        `).join('');
      } else if (activityTable) {
        activityTable.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No recent activity recorded yet.</td></tr>`;
      }
    }
  } catch (err) {
    console.error('Error fetching public statistics:', err);
  }
}
