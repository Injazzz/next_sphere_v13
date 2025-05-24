/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useCallback } from "react";
import { AnalyticsData } from "@/types/analytics";

export const useAnalytics = (data: AnalyticsData, initialTimeRange = "30d") => {
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [selectedMetric, setSelectedMetric] = useState<
    "documents" | "performance"
  >("documents");
  const [filters, setFilters] = useState({
    documentType: "all",
    flow: "all",
    status: "all",
    client: "all",
  });

  // Filter documents based on time range and filters
  const filteredDocuments = useMemo(() => {
    const cutoffDate = data.ranges[timeRange as keyof typeof data.ranges];

    return data.documents.filter((doc) => {
      const dateMatch = new Date(doc.createdAt) >= cutoffDate;
      const typeMatch =
        filters.documentType === "all" || doc.type === filters.documentType;
      const flowMatch = filters.flow === "all" || doc.flow === filters.flow;
      const statusMatch =
        filters.status === "all" || doc.status === filters.status;
      const clientMatch =
        filters.client === "all" || doc.client.id === filters.client;

      return dateMatch && typeMatch && flowMatch && statusMatch && clientMatch;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.documents, data.ranges, timeRange, filters]);

  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    const totalDocs = filteredDocuments.length;
    const completedDocs = filteredDocuments.filter((d) => d.completedAt).length;
    const onTimeDocs = filteredDocuments.filter((d) => d.isOnTime).length;
    const overdueDocs = filteredDocuments.filter((d) => d.isOverdue).length;
    const inDocs = filteredDocuments.filter((d) => d.flow === "IN").length;
    const outDocs = filteredDocuments.filter((d) => d.flow === "OUT").length;

    const processingTimes = filteredDocuments
      .filter((d) => d.processingTime !== null)
      .map((d) => d.processingTime!);

    const avgProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        : 0;

    return {
      totalDocuments: totalDocs,
      completedDocuments: completedDocs,
      onTimeDocuments: onTimeDocs,
      overdueDocuments: overdueDocs,
      inDocuments: inDocs,
      outDocuments: outDocs,
      completionRate: totalDocs > 0 ? (completedDocs / totalDocs) * 100 : 0,
      onTimeRate: completedDocs > 0 ? (onTimeDocs / completedDocs) * 100 : 0,
      averageProcessingTime: avgProcessingTime,
      efficiency: totalDocs > 0 ? (onTimeDocs / totalDocs) * 100 : 0,
    };
  }, [filteredDocuments]);

  // Prepare chart data with better aggregation
  const chartData = useMemo(() => {
    const days = Math.min(
      parseInt(timeRange.replace("d", "").replace("y", "")) *
        (timeRange.includes("y") ? 365 : 1),
      90
    );

    const dateMap = new Map();

    // Initialize all dates
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dateMap.set(dateStr, {
        date: dateStr,
        documentsIn: 0,
        documentsOut: 0,
        completed: 0,
        onTime: 0,
        overdue: 0,
      });
    }

    // Aggregate document data
    filteredDocuments.forEach((doc) => {
      const createdDate = new Date(doc.createdAt).toISOString().split("T")[0];
      const completedDate = doc.completedAt
        ? new Date(doc.completedAt).toISOString().split("T")[0]
        : null;

      if (dateMap.has(createdDate)) {
        const dayData = dateMap.get(createdDate);
        if (doc.flow === "IN") dayData.documentsIn++;
        else dayData.documentsOut++;
      }

      if (completedDate && dateMap.has(completedDate)) {
        const dayData = dateMap.get(completedDate);
        dayData.completed++;
        if (doc.isOnTime) dayData.onTime++;
        if (doc.isOverdue) dayData.overdue++;
      }
    });

    return Array.from(dateMap.values());
  }, [filteredDocuments, timeRange]);

  // Document type distribution with percentages
  const documentTypeData = useMemo(() => {
    const types = ["SPK", "JO", "BA", "IS", "SA", "INVOICE"] as const;
    const total = filteredDocuments.length;

    return types
      .map((type, index) => {
        const count = filteredDocuments.filter((d) => d.type === type).length;
        return {
          type,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0,
          fill: `var(--chart-${index + 1})`,
        };
      })
      .filter((item) => item.count > 0);
  }, [filteredDocuments]);

  // Performance trends
  const performanceTrends = useMemo(() => {
    const currentPeriodDocs = filteredDocuments;
    const previousPeriodStart = new Date(
      data.ranges[timeRange as keyof typeof data.ranges]
    );
    const periodLength = Date.now() - previousPeriodStart.getTime();
    const previousPeriodEnd = new Date(
      previousPeriodStart.getTime() - periodLength
    );

    const previousPeriodDocs = data.documents.filter((doc) => {
      const docDate = new Date(doc.createdAt);
      return docDate >= previousPeriodEnd && docDate < previousPeriodStart;
    });

    const currentMetrics = {
      completion:
        currentPeriodDocs.length > 0
          ? (currentPeriodDocs.filter((d) => d.completedAt).length /
              currentPeriodDocs.length) *
            100
          : 0,
      onTime:
        currentPeriodDocs.filter((d) => d.completedAt).length > 0
          ? (currentPeriodDocs.filter((d) => d.isOnTime).length /
              currentPeriodDocs.filter((d) => d.completedAt).length) *
            100
          : 0,
    };

    const previousMetrics = {
      completion:
        previousPeriodDocs.length > 0
          ? (previousPeriodDocs.filter((d) => d.completedAt).length /
              previousPeriodDocs.length) *
            100
          : 0,
      onTime:
        previousPeriodDocs.filter((d) => d.completedAt).length > 0
          ? (previousPeriodDocs.filter((d) => d.isOnTime).length /
              previousPeriodDocs.filter((d) => d.completedAt).length) *
            100
          : 0,
    };

    return {
      completionTrend: currentMetrics.completion - previousMetrics.completion,
      onTimeTrend: currentMetrics.onTime - previousMetrics.onTime,
      documentCountTrend: currentPeriodDocs.length - previousPeriodDocs.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredDocuments, data.documents, data.ranges, timeRange]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const exportData = useCallback(
    async (format: "csv" | "excel" | "pdf") => {
      try {
        // Prepare export data
        const exportData = filteredDocuments.map((doc) => ({
          Title: doc.title,
          Type: doc.type,
          Flow: doc.flow,
          Status: doc.status,
          Client: doc.client.name,
          "Created At": new Date(doc.createdAt).toLocaleDateString(),
          "Completed At": doc.completedAt
            ? new Date(doc.completedAt).toLocaleDateString()
            : "N/A",
          "Processing Time (days)": doc.processingTime || "N/A",
          "On Time": doc.isOnTime ? "Yes" : "No",
          "Days Late": doc.daysLate || 0,
        }));

        const fileName = `analytics-asphere-apps${timeRange}-${new Date().toISOString().split("T")[0]}`;

        switch (format) {
          case "csv":
            await exportCSV(exportData, fileName);
            break;
          case "excel":
            await exportExcel(exportData, fileName);
            break;
          case "pdf":
            await exportPDF(exportData, fileName);
            break;
          default:
            throw new Error(`Unsupported export format: ${format}`);
        }

        // Show success notification
        console.log(`Successfully exported data as ${format.toUpperCase()}`);
      } catch (error) {
        console.error(`Export failed:`, error);
        // Handle error (show notification, etc.)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredDocuments, timeRange]
  );

  // CSV Export Function
  const exportCSV = async (data: any[], fileName: string) => {
    if (!data.length) {
      throw new Error("No data to export");
    }

    // Escape CSV values to handle commas, quotes, and newlines
    const escapeCSVValue = (value: any): string => {
      const stringValue = String(value);
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => escapeCSVValue(row[header])).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    downloadFile(blob, `${fileName}.csv`);
  };

  // Excel Export Function
  const exportExcel = async (data: any[], fileName: string) => {
    if (!data.length) {
      throw new Error("No data to export");
    }

    // Using SheetJS library for Excel export
    try {
      const XLSX = await import("xlsx");

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Auto-size columns
      const colWidths = Object.keys(data[0]).map((key) => {
        const maxLength = Math.max(
          key.length,
          ...data.map((row) => String(row[key]).length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      worksheet["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Analytics Data");

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
        compression: true,
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadFile(blob, `${fileName}.xlsx`);
    } catch (error) {
      console.error("Excel export failed:", error);
      throw new Error(
        "Failed to export Excel file. Please try CSV format instead."
      );
    }
  };

  // PDF Export Function
  const exportPDF = async (data: any[], fileName: string) => {
    if (!data.length) {
      throw new Error("No data to export");
    }

    try {
      // Using jsPDF for PDF generation
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Add title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Analytics Report", 14, 15);

      // Add metadata
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
      doc.text(`Time Range: ${timeRange}`, 14, 30);
      doc.text(`Total Records: ${data.length}`, 14, 35);

      // Prepare table data
      const headers = Object.keys(data[0]);
      const tableData = data.map((row) =>
        headers.map((header) => String(row[header]))
      );

      // Add table
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 45,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [71, 85, 105], // Slate color
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // Light gray
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Title
          1: { cellWidth: 20 }, // Type
          2: { cellWidth: 20 }, // Flow
          3: { cellWidth: 20 }, // Status
          4: { cellWidth: 25 }, // Client
          5: { cellWidth: 25 }, // Created At
          6: { cellWidth: 25 }, // Completed At
          7: { cellWidth: 20 }, // Processing Time
          8: { cellWidth: 15 }, // On Time
          9: { cellWidth: 15 }, // Days Late
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data: any) => {
          // Add page numbers
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber}`,
            doc.internal.pageSize.width - 20,
            doc.internal.pageSize.height - 10
          );
        },
      });

      // Save PDF
      doc.save(`${fileName}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      throw new Error(
        "Failed to export PDF file. Please try CSV format instead."
      );
    }
  }; // Helper function to download files
  const downloadFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // Alternative implementation using native browser APIs only (no external libraries)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const exportDataNative = useCallback(
    async (format: "csv" | "excel" | "pdf") => {
      const exportData = filteredDocuments.map((doc) => ({
        Title: doc.title,
        Type: doc.type,
        Flow: doc.flow,
        Status: doc.status,
        Client: doc.client.name,
        "Created At": new Date(doc.createdAt).toLocaleDateString(),
        "Completed At": doc.completedAt
          ? new Date(doc.completedAt).toLocaleDateString()
          : "N/A",
        "Processing Time (days)": doc.processingTime || "N/A",
        "On Time": doc.isOnTime ? "Yes" : "No",
        "Days Late": doc.daysLate || 0,
      }));

      const fileName = `analytics-asphere-apps-${timeRange}-${new Date().toISOString().split("T")[0]}`;

      if (format === "csv") {
        // Enhanced CSV export with proper escaping
        const escapeCSV = (value: any) => {
          const str = String(value);
          if (
            str.includes(",") ||
            str.includes('"') ||
            str.includes("\n") ||
            str.includes("\r")
          ) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        const headers = Object.keys(exportData[0]);
        const csvContent = [
          headers.join(","),
          ...exportData.map((row) =>
            headers
              .map((header) => escapeCSV(row[header as keyof typeof row]))
              .join(",")
          ),
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        downloadFile(blob, `${fileName}.csv`);
      } else if (format === "excel") {
        // Simple Excel format using HTML table (opens in Excel)
        const htmlTable = `
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
              </style>
            </head>
            <body>
              <h2>Asphere Apps Analytics Report</h2>
              <p>Generated: ${new Date().toLocaleString()}</p>
              <table>
                <thead>
                  <tr>${Object.keys(exportData[0])
                    .map((key) => `<th>${key}</th>`)
                    .join("")}</tr>
                </thead>
                <tbody>
                  ${exportData
                    .map(
                      (row) =>
                        `<tr>${Object.values(row)
                          .map((value) => `<td>${value}</td>`)
                          .join("")}</tr>`
                    )
                    .join("")}
                </tbody>
              </table>
            </body>
          </html>
        `;

        const blob = new Blob([htmlTable], {
          type: "application/vnd.ms-excel;charset=utf-8;",
        });
        downloadFile(blob, `${fileName}.xls`);
      } else if (format === "pdf") {
        // Simple HTML to PDF approach (user can print to PDF)
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Asphere Apps Analytics Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; }
                .meta { margin-bottom: 20px; color: #666; }
                table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                th { background-color: #f8f9fa; font-weight: bold; }
                tr:nth-child(even) { background-color: #f8f9fa; }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <h1>Analytics Report</h1>
              <div class="meta">
                <p>Generated: ${new Date().toLocaleString()}</p>
                <p>Time Range: ${timeRange}</p>
                <p>Total Records: ${exportData.length}</p>
              </div>
              <div class="no-print">
                <p><strong>Instructions:</strong> Use Ctrl+P (Windows) or Cmd+P (Mac) to print this page as PDF</p>
              </div>
              <table>
                <thead>
                  <tr>${Object.keys(exportData[0])
                    .map((key) => `<th>${key}</th>`)
                    .join("")}</tr>
                </thead>
                <tbody>
                  ${exportData
                    .map(
                      (row) =>
                        `<tr>${Object.values(row)
                          .map((value) => `<td>${value}</td>`)
                          .join("")}</tr>`
                    )
                    .join("")}
                </tbody>
              </table>
            </body>
          </html>
        `;

        // Open in new window for printing
        const newWindow = window.open("", "_blank");
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
          newWindow.focus();
          setTimeout(() => newWindow.print(), 250);
        }
      }
    },
    [filteredDocuments, timeRange]
  );

  return {
    timeRange,
    setTimeRange,
    selectedMetric,
    setSelectedMetric,
    filters,
    updateFilters,
    filteredDocuments,
    metrics,
    chartData,
    documentTypeData,
    performanceTrends,
    exportData,
  };
};
