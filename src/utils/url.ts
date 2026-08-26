/** 상대 경로인 첨부 파일 주소에 API 주소를 붙인다. */
export function resolveAssetUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|blob:|data:)/.test(path)) return path;

  const base = import.meta.env.VITE_API_BASE_URL ?? "";
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}
