// Inicio de sesión del área de cliente. Aislado a propósito, igual que submitContact().
// WHMCS no admite un login desde otro dominio sin token CSRF, así que hace falta un backend:
//   - opción A: endpoint propio que valide con la API ValidateLogin y redirija con CreateSsoToken;
//   - opción B: OAuth/OpenID Connect de WHMCS («Sign-In Integrations»).
export type LoginResult = { ok: true; redirect: string } | { ok: false; message: string };

export async function submitLogin(data: { email: string; password: string; remember: boolean }): Promise<LoginResult> {
  // TODO: conectar con el backend de autenticación. Mientras tanto no se envía nada.
  void data;
  return { ok: false, message: 'El acceso desde esta página todavía no está disponible. Entra desde el panel de clientes.' };
}
