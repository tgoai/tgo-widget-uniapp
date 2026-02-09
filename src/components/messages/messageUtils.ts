export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0)
    return '未知大小'
  const KB = 1024; const MB = KB * 1024; const GB = MB * 1024
  if (bytes < KB)
    return `${bytes} B`
  if (bytes < MB)
    return `${(bytes / KB).toFixed(1)} KB`
  if (bytes < GB)
    return `${(bytes / MB).toFixed(1)} MB`
  return `${(bytes / GB).toFixed(1)} GB`
}
