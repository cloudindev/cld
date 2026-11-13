// Envío de formularios (Contact Form 7 en el original). Aislado a propósito: la réplica no inventa backend.
export type SubmitResult = { ok: boolean; message: string };

export async function submitContact(data: Record<string, string>): Promise<SubmitResult> {
  // TODO: conectar con el backend real (endpoint de Contact Form 7, API propia o servicio de formularios).
  // Mientras tanto no se envía nada; se devuelve el mismo aviso de error de CF7 para no simular un envío falso.
  void data;
  return { ok: false, message: 'Ha ocurrido un error al intentar enviar tu mensaje. Por favor inténtalo de nuevo más tarde.' };
}
