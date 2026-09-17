export function hasCategoryGroup(name: string): boolean {
  return name.includes(" - ");
}

export function getCategoryGroup(name: string): string {
  return hasCategoryGroup(name) ? name.split(" - ")[0].trim() : name;
}

export function getCategorySubLabel(name: string): string {
  return hasCategoryGroup(name) ? name.split(" - ").slice(1).join(" - ").trim() : name;
}

export function isSubCategoryOf(categoryName: string, groupName: string): boolean {
  return categoryName.startsWith(`${groupName} - `);
}
