/** Minúsculas y sin acentos, para comparar textos al buscar (`Sofía` coincide con `sofia`). */
export function normalizarTexto(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
