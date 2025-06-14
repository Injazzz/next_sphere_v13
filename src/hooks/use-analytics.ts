/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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

  // Company Information - memoized to prevent unnecessary re-renders
  const companyInfo = useMemo(
    () => ({
      name: "PT. Sigma Mitra Sejati",
      subtitle: "Refractory & Insulation",
      address:
        "Ruko, Jl. Bonakarta No.1 Blok C, Masigit, Kec. Jombang, Kota Cilegon, Banten 42414",
      logo: "/logo-sms.jpg",
    }),
    []
  );

  // Filter documents based on time range and filters
  const filteredDocuments = useMemo(() => {
    if (!data?.documents) return [];

    const cutoffDate = data.ranges[timeRange as keyof typeof data.ranges];

    return data.documents.filter((doc) => {
      // 1. Filter tanggal
      const dateMatch = new Date(doc.createdAt) >= new Date(cutoffDate);
      if (!dateMatch) return false;

      // 2. Filter tipe dokumen (skip jika "all")
      if (filters.documentType !== "all" && doc.type !== filters.documentType) {
        return false;
      }

      // 3. Filter flow (skip jika "all")
      if (filters.flow !== "all" && doc.flow !== filters.flow) {
        return false;
      }

      // 4. Filter status (skip jika "all")
      if (filters.status !== "all" && doc.status !== filters.status) {
        return false;
      }

      // 5. Filter client (skip jika "all")
      if (filters.client !== "all" && doc.client?.id !== filters.client) {
        return false;
      }

      return true;
    });
  }, [data, timeRange, filters]);

  // Calculate comprehensive metrics - memoized for performance
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

    const dateMap = new Map<
      string,
      {
        date: string;
        documentsIn: number;
        documentsOut: number;
        completed: number;
        onTime: number;
        overdue: number;
      }
    >();

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
        const dayData = dateMap.get(createdDate)!;
        if (doc.flow === "IN") dayData.documentsIn++;
        else dayData.documentsOut++;
      }

      if (completedDate && dateMap.has(completedDate)) {
        const dayData = dateMap.get(completedDate)!;
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

  // Performance trends with memoization
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

  // Stable callback for filter updates
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Helper function to download files
  const downloadFile = useCallback((blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, []);

  // Main export function with memoization
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

        const fileName = `analytics-${companyInfo.name
          .replace(/\s+/g, "-")
          .toLowerCase()}-${timeRange}-${
          new Date().toISOString().split("T")[0]
        }`;

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
      } catch (error) {
        console.error(`Export failed:`, error);
        throw error;
      }
    },
    [filteredDocuments, timeRange, companyInfo.name]
  );

  // CSV Export Function with Header
  const exportCSV = useCallback(
    async (data: any[], fileName: string) => {
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

      // Format tanggal untuk nama file dan header
      const formattedDate = new Date().toLocaleString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Create CSV content with improved styling
      const csvContent = [
        // Company Header
        `"${companyInfo.name}"`,
        `"${companyInfo.subtitle}"`,
        `"${companyInfo.address}"`,
        "",
        // Report Title
        `"LAPORAN ANALITIK DOKUMEN"`,
        `"${companyInfo.name}"`,
        "",
        // Report Metadata
        `"Dibuat pada:","${formattedDate}"`,
        `"Periode:","${timeRange}"`,
        `"Total Data:","${data.length}"`,
        "",
        // Column Headers
        headers.map((h) => `"${h}"`).join(","),
        // Data Rows
        ...data.map((row) =>
          headers.map((header) => escapeCSVValue(row[header])).join(",")
        ),
        "",
        // Signature Section
        `"Penanggung Jawab:"`,
        "",
        `"Nama Lengkap:","__________________________"`,
        `"Jabatan:","__________________________"`,
        "",
        `"Tanda Tangan:"`,
        "",
        `"","__________________________"`,
        `"","(__________________________)"`,
        "",
        `"Mengetahui:"`,
        "",
        `"Nama Lengkap:","__________________________"`,
        `"Jabatan:","__________________________"`,
        "",
        `"Tanda Tangan:"`,
        "",
        `"","__________________________"`,
        `"","(__________________________)"`,
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      downloadFile(blob, `${fileName}.csv`);
    },
    [companyInfo, timeRange, downloadFile]
  );

  // Excel Export Function with Header
  const exportExcel = useCallback(
    async (data: any[], fileName: string) => {
      if (!data.length) {
        throw new Error("No data to export");
      }

      try {
        const XLSX = await import("xlsx");
        const workbook = XLSX.utils.book_new();

        // Format tanggal untuk header
        const formattedDate = new Date().toLocaleString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        // Create header data dengan styling lebih baik
        const headerData = [
          [companyInfo.name],
          [companyInfo.subtitle],
          [companyInfo.address],
          [],
          ["LAPORAN ANALITIK DOKUMEN"],
          [`Dibuat pada: ${formattedDate}`],
          [`Periode: ${timeRange} | Total Data: ${data.length}`],
          [], // Baris kosong
        ];

        // Create worksheet dengan header
        const worksheet = XLSX.utils.aoa_to_sheet(headerData);

        // Tambahkan nomor urut di kolom A
        const dataWithNumbering = data.map((row, index) => ({
          No: index + 1, // Nomor urut dimulai dari 1
          ...row,
        }));

        // Add data mulai dari row 10 (memberikan lebih banyak space setelah header)
        XLSX.utils.sheet_add_json(worksheet, dataWithNumbering, {
          origin: "A10",
          header: ["No", ...Object.keys(data[0])],
        });

        // Hitung posisi footer (data mulai dari row 10)
        const footerStartRow = 10 + data.length + 3;

        // Tambahkan section penanggung jawab dan TTD yang lebih rapi
        XLSX.utils.sheet_add_aoa(
          worksheet,
          [
            [], // Baris kosong pembatas
            ["", "Penanggung Jawab", "", "", "", "", "", "", "Mengetahui"],
            [], // Baris kosong
            ["", "Nama Lengkap:", "", "", "", "", "", "", "Nama Lengkap:"],
            ["", "Jabatan:", "", "", "", "", "", "", "Jabatan:"],
            [], // Baris kosong
            ["", "Tanda Tangan:", "", "", "", "", "", "", "Tanda Tangan:"],
            [], // Space untuk tanda tangan
            [], // Space untuk tanda tangan
            [
              "",
              "_________________________",
              "",
              "",
              "",
              "",
              "",
              "",
              "_________________________",
            ],
          ],
          { origin: `A${footerStartRow}` }
        );

        // Auto-size columns dengan lebar yang lebih optimal
        const headers = ["No", ...Object.keys(data[0])];
        const colWidths = headers.map((key) => {
          const maxLength = Math.max(
            key.length,
            ...dataWithNumbering.map((row) => String(row[key]).length),
            companyInfo.name.length
          );
          // Lebar kolom disesuaikan dengan konten
          return {
            wch: Math.min(
              Math.max(
                key === "No"
                  ? 5 // Lebar kolom No lebih kecil
                  : key === "Title"
                    ? 30 // Lebar kolom Title lebih besar
                    : key.includes("At")
                      ? 15 // Kolom tanggal lebih lebar
                      : 20, // Default width
                maxLength + 2
              ),
              50
            ),
          };
        });
        worksheet["!cols"] = colWidths;

        // Style untuk header laporan
        const reportTitleRange = XLSX.utils.decode_range("A5:A7");
        for (
          let row = reportTitleRange.s.r;
          row <= reportTitleRange.e.r;
          row++
        ) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
          if (!worksheet[cellAddress]) continue;
          worksheet[cellAddress].s = {
            font: {
              bold: row === 5, // Judul utama bold
              size: row === 5 ? 14 : 11,
            },
            alignment: { horizontal: "left" },
          };
        }

        // Style untuk header tabel
        const tableHeaderRange = XLSX.utils.decode_range("A10:J10");
        for (
          let col = tableHeaderRange.s.c;
          col <= tableHeaderRange.e.c;
          col++
        ) {
          const cellAddress = XLSX.utils.encode_cell({ r: 9, c: col });
          if (!worksheet[cellAddress]) continue;
          worksheet[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } }, // Warna biru
            alignment: { horizontal: "center" },
          };
        }

        // Style untuk kolom No
        const noColRange = XLSX.utils.decode_range(`A10:A${9 + data.length}`);
        for (let row = noColRange.s.r; row <= noColRange.e.r; row++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
          if (!worksheet[cellAddress]) continue;
          worksheet[cellAddress].s = {
            alignment: { horizontal: "center" },
            fill: row % 2 === 0 ? { fgColor: { rgb: "D9E1F2" } } : {}, // Striped rows
          };
        }

        // Style untuk data (striped rows)
        for (let row = 10; row < 10 + data.length; row++) {
          for (let col = 1; col < headers.length; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            if (!worksheet[cellAddress]) continue;
            worksheet[cellAddress].s = {
              fill: row % 2 === 0 ? { fgColor: { rgb: "D9E1F2" } } : {},
            };
          }
        }

        // Style untuk footer tanda tangan
        const signatureRange = XLSX.utils.decode_range(
          `A${footerStartRow}:I${footerStartRow + 9}`
        );
        for (let row = signatureRange.s.r; row <= signatureRange.e.r; row++) {
          for (let col = 0; col <= 8; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            if (!worksheet[cellAddress]) continue;

            // Bold untuk label
            if (
              worksheet[cellAddress].v &&
              (worksheet[cellAddress].v.includes("Penanggung Jawab") ||
                worksheet[cellAddress].v.includes("Mengetahui") ||
                worksheet[cellAddress].v.includes("Nama") ||
                worksheet[cellAddress].v.includes("Jabatan") ||
                worksheet[cellAddress].v.includes("Tanda Tangan"))
            ) {
              worksheet[cellAddress].s = {
                font: { bold: true },
              };
            }
          }
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
    },
    [companyInfo, timeRange, downloadFile]
  );
  // Helper function to load image as base64
  const loadImageAsBase64 = useCallback((src: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve("");
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpg"));
      };
      img.onerror = () => resolve("");
      img.src = src;
    });
  }, []);

  // PDF Export Function with Header and Footer
  const exportPDF = useCallback(
    async (data: any[], fileName: string) => {
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
            doc.addImage(logoBase64, "JPG", 14, 10, 25, 25);
          } catch (error) {
            console.warn("Failed to add logo to PDF:", error);
          }
        }

        // Add company header (positioned next to logo)
        const textStartX = logoBase64 ? 45 : 14;
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
        yPosition = Math.max(yPosition, 40);
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
            3: { cellWidth: 25 },
            4: { cellWidth: 40 },
            5: { cellWidth: 30 },
            6: { cellWidth: 30 },
            7: { cellWidth: 20 },
            8: { cellWidth: 15 },
            9: { cellWidth: 15 },
          },
          margin: { left: 14, right: 14 },
          didDrawPage: (data: any) => {
            // Hanya tambahkan nomor halaman
            doc.setFontSize(8);
            doc.text(
              `Page ${data.pageNumber}`,
              doc.internal.pageSize.width - 30,
              doc.internal.pageSize.height - 15
            );
          },
        });

        const finalY = (doc as any).lastAutoTable.finalY || 100;
        const signatureBaseY = finalY + 20; // Posisi dasar untuk tanda tangan
        doc.setFontSize(10);
        doc.text("Penanggung Jawab:", 14, signatureBaseY);
        doc.text("________________________", 14, signatureBaseY + 20);

        doc.save(`${fileName}.pdf`);
      } catch (error) {
        console.error("PDF export failed:", error);
        throw new Error(
          "Failed to export PDF file. Please try CSV format instead."
        );
      }
    },
    [companyInfo, timeRange, loadImageAsBase64]
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
    companyInfo,
  };
};
