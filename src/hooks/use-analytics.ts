/* eslint-disable react-hooks/exhaustive-deps */
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

  // Company Information
  const companyInfo = {
    name: "PT. Sigma Mitra Sejati",
    subtitle: "Refractory & Insulation",
    address:
      "Ruko, Jl. Bonakarta No.1 Blok C, Masigit, Kec. Jombang, Kota Cilegon, Banten 42414",
    logo: "/logo-sms.jpg", // Path ke logo di folder public
  };

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
  }, [filteredDocuments, data.documents, data.ranges, timeRange]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Helper function to download files
  const downloadFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // Main export function
  const exportData = useCallback(
    async (format: "csv" | "excel" | "pdf") => {
      try {
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

        const fileName = `analytics-${companyInfo.name.replace(/\s+/g, "-").toLowerCase()}-${timeRange}-${new Date().toISOString().split("T")[0]}`;

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

        console.log(`Successfully exported data as ${format.toUpperCase()}`);
      } catch (error) {
        console.error(`Export failed:`, error);
      }
    },
    [filteredDocuments, timeRange, companyInfo.name]
  );

  // CSV Export Function with Header
  const exportCSV = async (data: any[], fileName: string) => {
    if (!data.length) {
      throw new Error("No data to export");
    }

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

    // Create CSV content with company header
    const csvContent = [
      `${companyInfo.name}`,
      `${companyInfo.subtitle}`,
      `${companyInfo.address}`,
      "",
      `Tracking Documents Analytics Report - Generated: ${new Date().toLocaleString()}`,
      `Time Range: ${timeRange} | Total Records: ${data.length}`,
      "",
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => escapeCSVValue(row[header])).join(",")
      ),
      "",
      "",
      "Penanggung Jawab:",
      "",
      "",
      "",
      "________________________",
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    downloadFile(blob, `${fileName}.csv`);
  };

  // Excel Export Function with Header
  const exportExcel = async (data: any[], fileName: string) => {
    if (!data.length) {
      throw new Error("No data to export");
    }

    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.utils.book_new();

      // Create header data
      const headerData = [
        [companyInfo.name],
        [companyInfo.subtitle],
        [companyInfo.address],
        [],
        [
          `Tracking Documents Analytics Report - Generated: ${new Date().toLocaleString()}`,
        ],
        [`Time Range: ${timeRange} | Total Records: ${data.length}`],
        [],
      ];

      // Create worksheet with header
      const worksheet = XLSX.utils.aoa_to_sheet(headerData);

      // Add data starting from row 8
      XLSX.utils.sheet_add_json(worksheet, data, { origin: "A8" });

      // Add footer (responsible person section)
      const footerStartRow = 8 + data.length + 2;
      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          [],
          ["", "", "", "", "", "", "", "", "", "Penanggung Jawab:"],
          [""],
          [""],
          [""],
          ["", "", "", "", "", "", "", "", "", "________________________"],
        ],
        { origin: `A${footerStartRow}` }
      );

      // Auto-size columns
      const colWidths = Object.keys(data[0]).map((key) => {
        const maxLength = Math.max(
          key.length,
          ...data.map((row) => String(row[key]).length),
          companyInfo.name.length
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      worksheet["!cols"] = colWidths;

      // Style the header
      const headerRange = XLSX.utils.decode_range("A1:A6");
      for (let row = headerRange.s.r; row <= headerRange.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = {
          font: { bold: true, size: row === 0 ? 14 : 12 },
          alignment: { horizontal: "left" },
        };
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, "Analytics Report");

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

  // Helper function to load image as base64
  const loadImageAsBase64 = (src: string): Promise<string> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpg"));
      };
      img.onerror = () => resolve(""); // Return empty if logo fails to load
      img.src = src;
    });
  };

  // PDF Export Function with Header and Footer
  const exportPDF = async (data: any[], fileName: string) => {
    if (!data.length) {
      throw new Error("No data to export");
    }
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Load company logo
      let logoBase64 = "";
      try {
        logoBase64 = await loadImageAsBase64(companyInfo.logo);
      } catch (error) {
        console.warn("Failed to load logo:", error);
      }

      // Add company logo if available
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, "JPG", 14, 10, 25, 25); // x, y, width, height
        } catch (error) {
          console.warn("Failed to add logo to PDF:", error);
        }
      }

      // Add company header (positioned next to logo)
      const textStartX = logoBase64 ? 45 : 14; // Start text after logo or at margin
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(companyInfo.name, textStartX, 20);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(companyInfo.subtitle, textStartX, 28);
      doc.setFontSize(10);

      // Split address into multiple lines if too long
      const addressLines = doc.splitTextToSize(companyInfo.address, 200);
      let yPosition = 35;
      addressLines.forEach((line: string) => {
        doc.text(line, textStartX, yPosition);
        yPosition += 5;
      });

      // Add separator line
      yPosition = Math.max(yPosition, 40); // Ensure minimum space for logo
      doc.setLineWidth(0.5);
      doc.line(14, yPosition + 2, 283, yPosition + 2);

      // Add report metadata
      yPosition += 10;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Tracking Documents Analytics Report", 14, yPosition);
      yPosition += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition);
      doc.text(`Time Range: ${timeRange}`, 14, yPosition + 5);
      doc.text(`Total Records: ${data.length}`, 14, yPosition + 10);

      // Prepare table data
      const headers = Object.keys(data[0]);
      const tableData = data.map((row) =>
        headers.map((header) => String(row[header]))
      );

      // Add table
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: yPosition + 20,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [71, 85, 105],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 40 },
          5: { cellWidth: 30 },
          6: { cellWidth: 30 },
          7: { cellWidth: 20 },
          8: { cellWidth: 15 },
          9: { cellWidth: 15 },
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data: any) => {
          const pageWidth = doc.internal.pageSize.width;
          const pageHeight = doc.internal.pageSize.height;

          // Add page numbers (pojok kanan bawah)
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.text(
            `Page ${data.pageNumber}`,
            pageWidth - 30, // Lebih presisi dari kanan
            pageHeight - 15 // Lebih presisi dari bawah
          );

          // Add footer (responsible person) hanya pada halaman terakhir
          if (data.pageNumber === doc.getNumberOfPages()) {
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");

            // Posisi footer yang benar (dari kanan dan bawah)
            const footerX = pageWidth - 80;
            const footerBaseY = pageHeight - 60; // Mulai dari 60mm dari bawah

            // Teks "Penanggung Jawab" dulu
            doc.text("Penanggung Jawab:", footerX, footerBaseY);

            // Garis tanda tangan di bawah teks (Y lebih besar = lebih bawah)
            doc.text("________________________", footerX, footerBaseY + 25);
          }
        },
      });

      doc.save(`${fileName}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      throw new Error(
        "Failed to export PDF file. Please try CSV format instead."
      );
    }
  };

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
    companyInfo,
  };
};
