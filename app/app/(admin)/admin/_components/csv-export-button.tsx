"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCSV, type CSVColumn } from "@/lib/utils/csv-export";
import { toast } from "sonner";

interface CSVExportButtonProps {
  data: any[];
  filename: string;
  columns: CSVColumn[];
  disabled?: boolean;
}

export function CSVExportButton({ data, filename, columns, disabled = false }: CSVExportButtonProps) {
  const handleExport = () => {
    try {
      exportToCSV(data, filename, columns);
      toast.success(`Exported ${data.length} records to CSV`);
    } catch (error) {
      toast.error("Failed to export CSV");
      console.error("CSV export error:", error);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={disabled || data.length === 0}>
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );
}
