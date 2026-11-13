// Fecha relativa con el mismo formato que el original (human_time_diff de WordPress en español
// seguido de «ago» sin traducir, p. ej. «2 semanas ago»). Se calcula en el navegador.
const MIN = 60, HOUR = 3600, DAY = 86400, WEEK = 604800, MONTH = 2592000, YEAR = 31536000;
const u = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function relativeDate(iso: string, fallback = ''): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return fallback;
  const diff = Math.abs(Date.now() - t) / 1000;
  let s: string;
  if (diff < HOUR) s = u(Math.max(1, Math.round(diff / MIN)), 'minuto', 'minutos');
  else if (diff < DAY) s = u(Math.max(1, Math.round(diff / HOUR)), 'hora', 'horas');
  else if (diff < WEEK) s = u(Math.max(1, Math.round(diff / DAY)), 'día', 'días');
  else if (diff < MONTH) s = u(Math.max(1, Math.round(diff / WEEK)), 'semana', 'semanas');
  else if (diff < YEAR) s = u(Math.max(1, Math.round(diff / MONTH)), 'mes', 'meses');
  else s = u(Math.max(1, Math.round(diff / YEAR)), 'año', 'años');
  return `${s} ago`;
}
