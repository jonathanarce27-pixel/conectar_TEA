// IDs de datos de usuario: siempre uuid v4 string (Esquema de Backend §12).
// Los IDs de contenido del producto ("R-01", "P-001"...) son estables y ya
// vienen definidos en el JSON — esta función nunca se usa para esos.
export function newId(): string {
  return crypto.randomUUID();
}
