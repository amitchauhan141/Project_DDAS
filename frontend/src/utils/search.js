export function rankBySearch(items, query) {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  return [...items].sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const aStarts = aName.startsWith(q) ? 1 : 0;
    const bStarts = bName.startsWith(q) ? 1 : 0;
    const aContains = aName.includes(q) ? 1 : 0;
    const bContains = bName.includes(q) ? 1 : 0;
    if (aStarts !== bStarts) return bStarts - aStarts;
    if (aContains !== bContains) return bContains - aContains;
    return aName.localeCompare(bName);
  });
}

export function filterBySearch(items, query) {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  return rankBySearch(items.filter((item) => item.name.toLowerCase().includes(q)), query);
}
