export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
