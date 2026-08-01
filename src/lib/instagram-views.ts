/** Format reel view counts like Instagram (e.g. 7813 → "7.8K"). */
export function formatInstagramViews(count: number): string {
  if (count >= 1_000_000) {
    const millions = count / 1_000_000;
    const rounded =
      millions >= 10
        ? Math.round(millions).toString()
        : millions.toFixed(1).replace(/\.0$/, "");
    return `${rounded}M`;
  }
  if (count >= 10_000) {
    return `${Math.round(count / 1_000)}K`;
  }
  if (count >= 1_000) {
    const thousands = count / 1_000;
    return `${thousands.toFixed(1).replace(/\.0$/, "")}K`;
  }
  return count.toLocaleString("en-US");
}
