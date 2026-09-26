// PostgREST corta cada respuesta en `max_rows` filas (1000 en Supabase, ver
// supabase/config.toml). Sin paginar, un usuario con más de 1000 transacciones
// perdía las más recientes en silencio. Pide páginas con .range() hasta recibir
// una incompleta. `buildQuery` debe devolver un query nuevo con orden estable
// (p. ej. fecha + id) para que las páginas no se solapen.
// Todo o nada: si una página falla se devuelve { data: null, error }.
export async function fetchAllRows(buildQuery, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) return { data: null, error };
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return { data: rows, error: null };
  }
}
