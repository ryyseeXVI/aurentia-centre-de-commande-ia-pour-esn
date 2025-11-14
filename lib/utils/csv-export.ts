/**
 * CSV Export Utility
 *
 * Utility functions for exporting table data to CSV format
 */

export interface CSVColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

/**
 * Export data to CSV and trigger download
 *
 * @param data - Array of objects to export
 * @param filename - Name of the CSV file (without extension)
 * @param columns - Column definitions
 */
export function exportToCSV(
  data: any[],
  filename: string,
  columns: CSVColumn[]
): void {
  // Generate CSV header
  const header = columns.map((col) => escapeCSVValue(col.label)).join(",");

  // Generate CSV rows
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        let value = getNestedValue(item, col.key);

        // Apply custom formatter if provided
        if (col.format && value !== null && value !== undefined) {
          value = col.format(value);
        }

        // Format common types
        if (value instanceof Date) {
          value = value.toLocaleDateString();
        } else if (Array.isArray(value)) {
          value = value.join("; ");
        } else if (typeof value === "object" && value !== null) {
          value = JSON.stringify(value);
        } else if (value === null || value === undefined) {
          value = "";
        }

        return escapeCSVValue(String(value));
      })
      .join(",");
  });

  // Combine header and rows
  const csv = [header, ...rows].join("\n");

  // Create blob and download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${getTimestamp()}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Escape CSV value (handle quotes, commas, newlines)
 */
function escapeCSVValue(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Get nested object value by dot notation (e.g., "user.name")
 */
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

/**
 * Generate timestamp for filename
 */
function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Common formatters for CSV export
 */
export const csvFormatters = {
  date: (value: string) => new Date(value).toLocaleDateString(),
  datetime: (value: string) => new Date(value).toLocaleString(),
  currency: (value: number) => `€${value.toFixed(2)}`,
  percentage: (value: number) => `${value}%`,
  boolean: (value: boolean) => (value ? "Yes" : "No"),
  array: (value: any[]) => value.join("; "),
};
