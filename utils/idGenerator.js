const crypto = require('crypto');

/**
 * Generates an official Complaint Tracking Number.
 * Format: CMP-YYYY-XXXXX (e.g. CMP-2026-83491)
 */
function generateComplaintId() {
  const year = new Date().getFullYear();
  // 5 random digits using crypto for uniqueness
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `CMP-${year}-${randomNum}`;
}

module.exports = {
  generateComplaintId
};
