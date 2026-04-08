export function normalize(value) {
  return String(value).replace(/\s+/g, "").toLowerCase();
}

export function setLoadStatus(els, msg, isError) {
  if (!els.loadStatus) {
    return;
  }

  els.loadStatus.textContent = msg;
  els.loadStatus.classList.toggle("error", Boolean(isError));
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "");
}
