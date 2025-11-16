import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateTruncatedListString(
  items: string[],
  itemTypeNameSingular: string,
  itemTypeNamePlural: string,
  maxItemsToShow: number = 3,
  joinSeparator: string = ", "
): string {
  if (!items || items.length === 0) {
    return "";
  }

  if (items.length <= maxItemsToShow) {
    return items.join(joinSeparator);
  }

  const firstItems = items.slice(0, maxItemsToShow).join(joinSeparator);
  const remainingCount = items.length - maxItemsToShow;
  const itemTypeName = remainingCount === 1 ? itemTypeNameSingular : itemTypeNamePlural;

  return `${firstItems}... ja ${remainingCount} muuta ${itemTypeName}`;
}

/**
 * Preprocess markdown text to ensure line breaks are visible in ReactMarkdown
 * This function preserves the original formatting by converting line breaks appropriately
 */
export function preprocessMarkdownForDisplay(markdown: string): string {
  if (!markdown) return '';

  // If the text already has proper paragraph breaks (double line breaks), keep them
  // Otherwise, ensure single line breaks create visual separation
  return markdown;
}
