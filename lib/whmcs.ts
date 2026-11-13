// Planes desde la API de WHMCS (acción GetProducts).
// Se ejecuta SOLO en el servidor durante `next build` (output: 'export'): las credenciales viven en
// .env.local / variables de entorno del CI y nunca llegan al navegador. Los precios se actualizan
// en cada build.
// Requisito en WHMCS: la credencial API debe tener un rol con permiso «GetProducts» y la IP del
// servidor de build debe estar en la lista blanca de API.

export type Plan = {
  pid: number;
  name: string;
  specs: { label: string; value: string }[]; // líneas «Etiqueta: valor» de la descripción
  features: string[];                         // resto de líneas de la descripción
  currency: { prefix: string; suffix: string };
  monthly: number | null;   // null = ciclo no disponible
  annually: number | null;
  orderUrl: string;         // añadir al carrito del panel
};
export type PlansResult = { ok: true; plans: Plan[] } | { ok: false; error: string };

const PANEL = 'https://panel.cloudin.pro';

/** IDs de producto de WHMCS que se muestran (en este orden). */
export const PLAN_IDS = {
  web: [1, 2, 3, 284, 4, 125, 8, 9, 10],
  vps: [85, 14, 15, 5, 41, 42, 63],
} as const;

type WhmcsPrice = Record<string, string | undefined> & { prefix?: string; suffix?: string };
type WhmcsProduct = { pid: number | string; name: string; description?: string; pricing?: Record<string, WhmcsPrice> };

export async function getPlans(pids: readonly number[]): Promise<PlansResult> {
  const url = process.env.WHMCS_API_URL, identifier = process.env.WHMCS_IDENTIFIER, secret = process.env.WHMCS_SECRET;
  if (!url || !identifier || !secret) return fail('Faltan WHMCS_API_URL / WHMCS_IDENTIFIER / WHMCS_SECRET');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ action: 'GetProducts', pid: pids.join(','), responsetype: 'json', identifier, secret }),
      cache: 'force-cache',
    });
    const data = (await res.json()) as { result?: string; message?: string; products?: { product?: WhmcsProduct[] } };
    if (data.result !== 'success') return fail(data.message ?? `HTTP ${res.status}`);
    const byId = new Map((data.products?.product ?? []).map(p => [Number(p.pid), p]));
    const plans = pids.flatMap(pid => { const p = byId.get(pid); return p ? [toPlan(p)] : []; });
    return { ok: true, plans };
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e));
  }
}

function fail(error: string): PlansResult {
  console.warn(`[whmcs] No se pudieron cargar los planes: ${error}`);
  return { ok: false, error };
}

function toPlan(p: WhmcsProduct): Plan {
  const pricing = p.pricing ?? {};
  const cur = pricing.EUR ?? Object.values(pricing)[0] ?? {};
  const price = (v?: string) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : null; }; // WHMCS usa -1 = desactivado
  const lines = htmlToLines(p.description ?? '');
  const specs: Plan['specs'] = [], features: string[] = [];
  for (const l of lines) {
    if (/^características:?$/i.test(l)) continue; // encabezado, no es una característica
    const m = /^([^:]{1,30}):\s*(.+)$/.exec(l);
    if (m) specs.push({ label: m[1]!.trim(), value: m[2]!.trim() }); else features.push(l);
  }
  return {
    pid: Number(p.pid),
    name: decode(p.name),
    specs, features,
    currency: { prefix: decode(cur.prefix ?? ''), suffix: decode(cur.suffix ?? ' €') },
    monthly: price(cur.monthly), annually: price(cur.annually),
    orderUrl: `${PANEL}/cart.php?a=add&pid=${p.pid}`,
  };
}

/** Descripción HTML de WHMCS → líneas de texto plano (no se inyecta HTML en la página). */
function htmlToLines(html: string) {
  return decode(html.replace(/<\s*(br|\/p|\/li|\/div|\/h\d)\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''))
    .split('\n').map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}
function decode(s: string) {
  return s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&euro;/g, '€');
}
