"use client";

import { useEffect, useState } from "react";
import { DocumentStatus } from "@/generated/prisma";
import { calculateDocumentStatus } from "@/lib/utils";

interface UseDocumentStatusProps {
  initialStatus: DocumentStatus;
  startTrackAt: Date;
  endTrackAt: Date;
  completedAt?: Date | null;
  approvedAt?: Date | null;
  documentId: string;
}

export function useDocumentStatus({
  initialStatus,
  startTrackAt,
  endTrackAt,
  completedAt,
  approvedAt,
  documentId,
}: UseDocumentStatusProps) {
  const [currentStatus, setCurrentStatus] =
    useState<DocumentStatus>(initialStatus);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fungsi untuk update status ke database
  const updateStatusInDatabase = async (newStatus: DocumentStatus) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status in database");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating document status:", error);
      throw error;
    }
  };

  // Efek untuk mengecek dan update status secara berkala
  useEffect(() => {
    const checkStatus = () => {
      const calculatedStatus = calculateDocumentStatus({
        status: currentStatus,
        startTrackAt: new Date(startTrackAt),
        endTrackAt: new Date(endTrackAt),
        completedAt,
        approvedAt,
      });

      if (calculatedStatus !== currentStatus) {
        setCurrentStatus(calculatedStatus);
        updateStatusInDatabase(calculatedStatus)
          .then(() => setLastUpdated(new Date()))
          .catch(() => {
            // Rollback jika update gagal
            setCurrentStatus(currentStatus);
          });
      }
    };

    // Jalankan pengecekan segera
    checkStatus();

    // Set interval untuk pengecekan berkala (setiap 5 menit)
    const interval = setInterval(checkStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentStatus,
    startTrackAt,
    endTrackAt,
    completedAt,
    approvedAt,
    documentId,
  ]);

  return {
    currentStatus,
    lastUpdated,
    updateStatus: async (newStatus: DocumentStatus) => {
      await updateStatusInDatabase(newStatus);
      setCurrentStatus(newStatus);
      setLastUpdated(new Date());
    },
  };
}
