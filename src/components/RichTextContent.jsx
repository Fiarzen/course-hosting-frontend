import DOMPurify from 'dompurify';

// Heuristic: does this content already contain HTML markup? Lessons created
// before the rich-text editor hold plain text with newlines.
function looksLikeHtml(str) {
  return /<\/?[a-z][\s\S]*>/i.test(str);
}

/**
 * Render lesson content safely.
 * - New lessons: sanitized HTML from the TipTap editor.
 * - Legacy lessons: plain text with newlines, shown with whitespace preserved.
 */
function RichTextContent({ html, className = '' }) {
  const value = html || '';

  if (!value.trim()) {
    return <div className={`ml-prose ${className}`}>No content</div>;
  }

  if (!looksLikeHtml(value)) {
    return (
      <div className={`ml-prose whitespace-pre-wrap ${className}`}>{value}</div>
    );
  }

  const clean = DOMPurify.sanitize(value, { USE_PROFILES: { html: true } });
  return (
    <div
      className={`ml-prose ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

export default RichTextContent;
