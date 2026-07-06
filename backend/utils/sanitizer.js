const MAX_CONTENT_LENGTH = 10000;
const MAX_NAME_LENGTH = 255;
const MAX_SHORT_TEXT_LENGTH = 500;

function sanitizeHtml(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function truncate(text, maxLength) {
  if (!text || typeof text !== 'string') {
    return text;
  }
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength);
}

function sanitizeContent(text) {
  const sanitized = sanitizeHtml(text);
  return truncate(sanitized, MAX_CONTENT_LENGTH);
}

function sanitizeName(text) {
  const sanitized = sanitizeHtml(text);
  return truncate(sanitized, MAX_NAME_LENGTH);
}

function sanitizeShortText(text) {
  const sanitized = sanitizeHtml(text);
  return truncate(sanitized, MAX_SHORT_TEXT_LENGTH);
}

module.exports = {
  sanitizeHtml,
  truncate,
  sanitizeContent,
  sanitizeName,
  sanitizeShortText,
  MAX_CONTENT_LENGTH,
  MAX_NAME_LENGTH,
  MAX_SHORT_TEXT_LENGTH
};