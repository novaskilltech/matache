export async function readAllRows(
  load: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: unknown[] | null; error: unknown }>,
  pageSize = 500,
): Promise<unknown[]> {
  const rows: unknown[] = [];
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await load(start, start + pageSize - 1);
    if (error) throw new Error("Dossiers unavailable");
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}
