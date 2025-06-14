"use client";

import { useState } from "react";
import { Download, FileText, Table, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportButtonProps {
  onExport: (format: "csv" | "excel" | "pdf") => Promise<void>;
  disabled?: boolean;
}

export const ExportButton = ({ onExport, disabled }: ExportButtonProps) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    setLoading(format);
    try {
      await onExport(format);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          disabled={disabled}
          className='gap-2'
        >
          <Download className='h-4 w-4' />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          onClick={() => handleExport("csv")}
          disabled={loading === "csv"}
        >
          <Table className='h-4 w-4 mr-2' />
          {loading === "csv" ? "Exporting..." : "Export as CSV"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("excel")}
          disabled={loading === "excel"}
        >
          <FileText className='h-4 w-4 mr-2' />
          {loading === "excel" ? "Exporting..." : "Export as Excel"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("pdf")}
          disabled={loading === "pdf"}
        >
          <FileImage className='h-4 w-4 mr-2' />
          {loading === "pdf" ? "Exporting..." : "Export as PDF"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
