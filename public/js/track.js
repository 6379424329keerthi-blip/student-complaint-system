/**
 * Online Complaint Registration and Tracking System
 * Tracking Page Controller with Interactive Timeline & Citizen Feedback
 */

document.addEventListener('DOMContentLoaded', () => {
  const trackForm = document.getElementById('trackForm');
  const ticketIdInput = document.getElementById('searchTicketId');
  const emailInput = document.getElementById('searchEmail');
  const trackBtn = document.getElementById('trackBtn');
  const resultsContainer = document.getElementById('trackingResults');
  const emptyState = document.getElementById('emptyState');

  // Check URL params for direct tracking link (e.g., track.html?id=CMP-2026-10492)
  const urlParams = new URLSearchParams(window.location.search);
  const initialId = urlParams.get('id');
  if (initialId) {
    if (ticketIdInput) ticketIdInput.value = initialId.trim();
    fetchComplaintDetails(initialId.trim());
  }

  // Tracking form submit
  if (trackForm) {
    trackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = ticketIdInput.value.trim().toUpperCase();
      const email = emailInput ? emailInput.value.trim() : '';

      const idRegex = /^CMP-\d{4}-\d{5}$/i;
      if (!id) {
        showToast('Please enter a Complaint Tracking ID.', 'warning');
        ticketIdInput.focus();
        return;
      }
      if (!idRegex.test(id)) {
        showToast('Invalid format. Tracking ID must look like CMP-2026-XXXXX.', 'error');
        ticketIdInput.focus();
        return;
      }

      fetchComplaintDetails(id, email);
    });
  }

  // Fetch Complaint Data from REST API
  async function fetchComplaintDetails(id, email = '') {
    if (trackBtn) {
      trackBtn.disabled = true;
      trackBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Searching...`;
    }

    try {
      let endpoint = `/api/complaints/track?id=${encodeURIComponent(id)}`;
      if (email) {
        endpoint += `&email=${encodeURIComponent(email)}`;
      }

      const res = await fetch(endpoint);
      const data = await res.json();

      if (res.ok && data.success) {
        renderComplaintDetails(data.data);
        if (emptyState) emptyState.style.display = 'none';
        if (resultsContainer) {
          resultsContainer.style.display = 'block';
          resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        showToast(data.message || 'Complaint not found.', 'error');
      }
    } catch (err) {
      console.error('Tracking fetch error:', err);
      showToast('Network error while looking up complaint record.', 'error');
    } finally {
      if (trackBtn) {
        trackBtn.disabled = false;
        trackBtn.innerHTML = `<i class="bi bi-search me-2"></i> Track Status`;
      }
    }
  }

  // Render Full Complaint Card & Stepper
  function renderComplaintDetails(item) {
    const stageMap = {
      'Pending': 1,
      'Under Review': 2,
      'In Progress': 3,
      'Resolved': 4,
      'Rejected': -1
    };

    const currentStageNum = stageMap[item.status] || 1;

    let stepperHTML = '';
    if (item.status === 'Rejected') {
      stepperHTML = `
        <div class="alert alert-danger d-flex align-items-center gap-3 p-3 my-4 rounded-3 border-danger">
          <i class="bi bi-x-octagon-fill fs-2 text-danger"></i>
          <div>
            <h5 class="alert-heading mb-1 fw-bold">Complaint Rejected / Closed Without Action</h5>
            <p class="mb-0 small">${escapeHTML(item.resolution?.remarks || 'This complaint has been reviewed and rejected in accordance with institutional policy.')}</p>
          </div>
        </div>
      `;
    } else {
      const progressPercent = ((currentStageNum - 1) / 3) * 100;
      stepperHTML = `
        <div class="tracking-stepper">
          <div class="stepper-progress-bar" style="width: ${progressPercent}%;"></div>
          
          <div class="stepper-step ${currentStageNum >= 1 ? (currentStageNum > 1 ? 'completed' : 'active') : ''}">
            <div class="step-circle"><i class="bi ${currentStageNum > 1 ? 'bi-check-lg' : 'bi-file-text'}"></i></div>
            <div class="step-label">Submitted</div>
          </div>

          <div class="stepper-step ${currentStageNum >= 2 ? (currentStageNum > 2 ? 'completed' : 'active') : ''}">
            <div class="step-circle"><i class="bi ${currentStageNum > 2 ? 'bi-check-lg' : 'bi-search'}"></i></div>
            <div class="step-label">Under Review</div>
          </div>

          <div class="stepper-step ${currentStageNum >= 3 ? (currentStageNum > 3 ? 'completed' : 'active') : ''}">
            <div class="step-circle"><i class="bi ${currentStageNum > 3 ? 'bi-check-lg' : 'bi-tools'}"></i></div>
            <div class="step-label">In Progress</div>
          </div>

          <div class="stepper-step ${currentStageNum >= 4 ? 'completed active' : ''}">
            <div class="step-circle"><i class="bi bi-check2-circle"></i></div>
            <div class="step-label">Resolved</div>
          </div>
        </div>
      `;
    }

    // Attachment link if present
    let attachmentHTML = '';
    if (item.attachment && item.attachment.path) {
      attachmentHTML = `
        <div class="mt-3 p-2 bg-light rounded border d-inline-flex align-items-center gap-2">
          <i class="bi bi-paperclip fs-5 text-primary"></i>
          <span class="small fw-semibold text-truncate" style="max-width: 250px;">${escapeHTML(item.attachment.originalName || 'Attached Document')}</span>
          <a href="${item.attachment.path}" target="_blank" class="btn btn-sm btn-outline-primary py-0 px-2 ms-2">
            <i class="bi bi-box-arrow-up-right"></i> View File
          </a>
        </div>
      `;
    }

    // Activity Stream HTML
    let timelineEntriesHTML = '';
    if (item.timeline && item.timeline.length > 0) {
      // Sort newest first
      const sorted = [...item.timeline].reverse();
      timelineEntriesHTML = sorted.map(t => `
        <div class="timeline-event">
          <div class="timeline-marker"></div>
          <div class="timeline-event-content">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="fw-bold text-dark small">${escapeHTML(t.note)}</span>
              <small class="text-muted">${formatDateTime(t.timestamp)}</small>
            </div>
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-white text-secondary border small">${escapeHTML(t.status)}</span>
              <small class="text-muted"><i class="bi bi-person me-1"></i>${escapeHTML(t.updatedBy || 'System')}</small>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Feedback Rating Section
    let feedbackSectionHTML = '';
    if (item.status === 'Resolved') {
      if (item.feedback && item.feedback.rating) {
        // Feedback already given
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
          starsHTML += `<i class="bi ${i <= item.feedback.rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'}"></i> `;
        }
        feedbackSectionHTML = `
          <div class="card bg-success-light border-success p-3 rounded-3 mt-4">
            <h6 class="fw-bold text-success mb-2"><i class="bi bi-heart-fill me-1"></i> Citizen Resolution Feedback</h6>
            <div class="d-flex align-items-center gap-2 mb-1">
              <div class="fs-5">${starsHTML}</div>
              <span class="fw-bold text-dark">(${item.feedback.rating} / 5 Stars)</span>
            </div>
            <p class="mb-0 text-secondary small fst-italic">"${escapeHTML(item.feedback.comments || 'No written comments provided.')}"</p>
          </div>
        `;
      } else {
        // Citizen can submit feedback
        feedbackSectionHTML = `
          <div class="card bg-white border p-4 rounded-3 mt-4 shadow-sm" id="feedbackFormContainer">
            <h5 class="fw-bold text-dark mb-1"><i class="bi bi-star-half text-warning me-2"></i>Rate Resolution Quality</h5>
            <p class="text-muted small mb-3">Help us improve campus services by sharing your experience regarding this complaint resolution.</p>
            
            <div class="mb-3">
              <label class="form-label small fw-bold">Your Rating (1 to 5 Stars):</label>
              <div class="rating-stars" id="starWidget">
                <i class="bi bi-star" data-rating="1"></i>
                <i class="bi bi-star" data-rating="2"></i>
                <i class="bi bi-star" data-rating="3"></i>
                <i class="bi bi-star" data-rating="4"></i>
                <i class="bi bi-star" data-rating="5"></i>
              </div>
              <input type="hidden" id="selectedRating" value="0">
            </div>

            <div class="mb-3">
              <label for="feedbackComments" class="form-label small fw-bold">Feedback / Remarks (Optional):</label>
              <textarea id="feedbackComments" class="form-control" rows="2" placeholder="Tell us what you liked or how we can do better..."></textarea>
            </div>

            <button type="button" class="btn btn-primary-custom btn-sm" id="submitFeedbackBtn">
              <i class="bi bi-check2 me-1"></i> Submit Feedback
            </button>
          </div>
        `;
      }
    }

    resultsContainer.innerHTML = `
      <div class="card card-modern p-4 p-md-5 mb-4">
        <!-- Ticket Header -->
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 border-bottom pb-4">
          <div>
            <div class="d-flex align-items-center gap-2 mb-2">
              <span class="fs-4 fw-800 font-monospace text-primary">${escapeHTML(item.complaintId)}</span>
              ${getStatusBadgeHTML(item.status)}
              ${getPriorityBadgeHTML(item.priority)}
            </div>
            <h4 class="fw-bold text-dark mb-1">${escapeHTML(item.title)}</h4>
            <div class="text-muted small">
              <i class="bi bi-folder2-open me-1"></i> Category: <strong class="text-dark">${escapeHTML(item.category)}</strong>
              <span class="mx-2">•</span>
              <i class="bi bi-calendar3 me-1"></i> Submitted: ${formatDateTime(item.createdAt)}
            </div>
          </div>
          ${item.qrCode ? `
            <div class="text-center p-2 bg-light border rounded-3">
              <img src="${item.qrCode}" alt="Tracking QR" style="width: 80px; height: 80px;" class="img-fluid rounded">
              <div style="font-size: 0.65rem;" class="text-muted mt-1">Scan to Track</div>
            </div>
          ` : ''}
        </div>

        <!-- Progress Stepper -->
        ${stepperHTML}

        <!-- Details Grid -->
        <div class="row g-4 mt-2">
          <div class="col-md-7">
            <h6 class="fw-bold text-uppercase text-secondary small tracking-wider mb-2">Description of Grievance</h6>
            <div class="p-3 bg-light rounded-3 text-secondary lh-base mb-3 border" style="font-size: 0.95rem;">
              ${escapeHTML(item.description)}
            </div>
            ${attachmentHTML}

            ${item.resolution && item.resolution.remarks ? `
              <div class="p-3 bg-success-light border border-success rounded-3 mt-3">
                <h6 class="fw-bold text-success mb-1"><i class="bi bi-check-circle me-1"></i> Official Resolution Remarks</h6>
                <p class="mb-1 text-dark small">${escapeHTML(item.resolution.remarks)}</p>
                <div class="small text-muted">
                  Resolved by: <strong>${escapeHTML(item.resolution.resolvedBy || 'Officer')}</strong> on ${formatDateTime(item.resolution.resolvedAt)}
                </div>
              </div>
            ` : ''}

            <!-- Feedback section -->
            ${feedbackSectionHTML}
          </div>

          <div class="col-md-5">
            <div class="p-3 bg-light rounded-3 border">
              <h6 class="fw-bold text-dark border-bottom pb-2 mb-3">Case Information</h6>
              
              <div class="mb-2 small">
                <span class="text-muted">Complainant:</span>
                <span class="fw-bold text-dark float-end">${escapeHTML(item.citizen.fullName)} (${escapeHTML(item.citizen.userType)})</span>
              </div>
              <div class="mb-2 small">
                <span class="text-muted">Registered Email:</span>
                <span class="fw-bold text-dark float-end">${escapeHTML(item.citizen.email)}</span>
              </div>
              <div class="mb-2 small">
                <span class="text-muted">Incident Location:</span>
                <span class="fw-bold text-dark float-end">${escapeHTML(item.location || 'Not Specified')}</span>
              </div>
              <div class="mb-2 small">
                <span class="text-muted">Assigned Officer:</span>
                <span class="fw-bold text-primary float-end">${escapeHTML(item.assignedTo?.name || 'Unassigned')}</span>
              </div>
              <div class="mb-0 small">
                <span class="text-muted">Department:</span>
                <span class="fw-bold text-dark float-end">${escapeHTML(item.assignedTo?.department || item.category)}</span>
              </div>
            </div>

            <!-- Activity Log Stream -->
            <h6 class="fw-bold text-dark mt-4 mb-3"><i class="bi bi-clock-history me-1 text-primary"></i> Case Updates Log</h6>
            <div class="timeline-stream">
              ${timelineEntriesHTML}
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach Star Rating events if feedback container exists
    attachFeedbackEvents(item.complaintId);
  }

  // Interactive 5-Star Rating Widget
  function attachFeedbackEvents(complaintId) {
    const starWidget = document.getElementById('starWidget');
    const ratingInput = document.getElementById('selectedRating');
    const feedbackBtn = document.getElementById('submitFeedbackBtn');
    const commentsInput = document.getElementById('feedbackComments');

    if (!starWidget || !feedbackBtn) return;

    const stars = starWidget.querySelectorAll('i');

    stars.forEach(star => {
      star.addEventListener('mouseenter', () => {
        const hoverVal = parseInt(star.getAttribute('data-rating'));
        stars.forEach(s => {
          const r = parseInt(s.getAttribute('data-rating'));
          if (r <= hoverVal) {
            s.classList.remove('bi-star');
            s.classList.add('bi-star-fill', 'hovered');
          } else {
            s.classList.remove('bi-star-fill', 'hovered');
            s.classList.add('bi-star');
          }
        });
      });

      star.addEventListener('mouseleave', () => {
        const curVal = parseInt(ratingInput.value);
        stars.forEach(s => {
          const r = parseInt(s.getAttribute('data-rating'));
          if (r <= curVal) {
            s.classList.remove('bi-star', 'hovered');
            s.classList.add('bi-star-fill', 'active');
          } else {
            s.classList.remove('bi-star-fill', 'active', 'hovered');
            s.classList.add('bi-star');
          }
        });
      });

      star.addEventListener('click', () => {
        const chosen = parseInt(star.getAttribute('data-rating'));
        ratingInput.value = chosen;
        stars.forEach(s => {
          const r = parseInt(s.getAttribute('data-rating'));
          if (r <= chosen) {
            s.classList.remove('bi-star');
            s.classList.add('bi-star-fill', 'active');
          } else {
            s.classList.remove('bi-star-fill', 'active');
            s.classList.add('bi-star');
          }
        });
      });
    });

    feedbackBtn.addEventListener('click', async () => {
      const rating = parseInt(ratingInput.value);
      if (rating < 1 || rating > 5) {
        showToast('Please select a star rating from 1 to 5.', 'warning');
        return;
      }

      const comments = commentsInput ? commentsInput.value.trim() : '';

      feedbackBtn.disabled = true;
      feedbackBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Submitting...`;

      try {
        const res = await fetch(`/api/complaints/${complaintId}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, comments })
        });

        const result = await res.json();
        if (res.ok && result.success) {
          showToast('Thank you! Your feedback has been recorded.', 'success');
          // Re-fetch complaint to refresh view
          fetchComplaintDetails(complaintId);
        } else {
          showToast(result.message || 'Failed to submit feedback.', 'error');
        }
      } catch (err) {
        console.error('Feedback submit error:', err);
        showToast('Network error while saving feedback.', 'error');
      } finally {
        feedbackBtn.disabled = false;
        feedbackBtn.innerHTML = `<i class="bi bi-check2 me-1"></i> Submit Feedback`;
      }
    });
  }
});
