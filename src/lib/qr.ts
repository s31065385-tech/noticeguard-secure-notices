/** QR payloads only *locate* a notice record. They never prove authenticity. */

export function buildNoticeUrl(id: string, origin: string): string {
  return `${origin.replace(/\/+$/, "")}/verify/${encodeURIComponent(id)}`;
}

const ID_PATTERN = /^NG-\d{8}-[A-Z0-9]{4,12}$/i;

export function parseNoticeIdFromQr(payload: string): string | null {
  const text = payload.trim();
  if (!text) return null;
  if (ID_PATTERN.test(text)) return text.toUpperCase();
  try {
    const url = new URL(text);
    const match = url.pathname.match(/\/verify\/([^/?#]+)/);
    if (match?.[1]) {
      const id = decodeURIComponent(match[1]);
      return ID_PATTERN.test(id) ? id.toUpperCase() : null;
    }
  } catch {
    /* not a URL */
  }
  return null;
}
