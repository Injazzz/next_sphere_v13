/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import { useEffect, useState } from "react";
import { DocumentStatus } from "@/generated/prisma";

// Update interface to match the actual document type from DocumentDetailProps
interface DocumentProgressBarProps {
  document: {
    id: string;
    startTrackAt: Date;
    endTrackAt: Date;
    status: DocumentStatus;
  } | null;
  status: DocumentStatus;
}

export function DocumentProgressBar({
  document,
  status,
}: DocumentProgressBarProps) {
  if (!document) {
    return <div className='w-full h-2 bg-gray-200 rounded-full'></div>;
  }

  const [timeOverdue, setTimeOverdue] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!document) return;

    if (document.status === "COMPLETED" || document.status === "APPROVED") {
      setProgress(100);
      setTimeOverdue(0);
      return;
    }

    const interval = setInterval(updateTimeStatus, 1000);
    updateTimeStatus(); // Initial call

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, status]);

  const updateTimeStatus = () => {
    const now = Date.now();
    const startTime = new Date(document?.startTrackAt).getTime();
    const endTime = new Date(document?.endTrackAt).getTime();

    // Calculate time overdue in seconds (positive if overdue)
    const secondsOverdue = Math.floor((now - endTime) / 1000);
    setTimeOverdue(secondsOverdue);

    // Calculate progress based on different scenarios
    if (status === "DRAFT") {
      setProgress(0); // Not started yet
    } else if (now < startTime) {
      setProgress(0); // Before start time
    } else if (now >= endTime) {
      setProgress(100); // After end time
    } else {
      // During active period
      const totalDuration = endTime - startTime;
      const elapsed = now - startTime;
      const calculatedProgress = Math.min(100, (elapsed / totalDuration) * 100);
      setProgress(calculatedProgress);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const days = Math.floor(totalSeconds / 86400);
    const hrs = Math.floor((totalSeconds % 86400) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    // Format to show days if applicable
    if (days > 0) {
      return `${days}d ${hrs}h ${mins}m`;
    }
    // Format as HH:MM:SS or MM:SS depending on hours
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const getProgressColor = () => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500";
      case "APPROVED":
        return "bg-purple-500"; // Purple for approved
      case "OVERDUE":
        return "bg-red-500"; // Red for overdue
      case "WARNING":
        return "bg-yellow-500"; // Yellow for warning
      case "ACTIVE":
        return timeOverdue >= 0
          ? "bg-red-500"
          : Math.abs(timeOverdue) <= 86400
            ? "bg-yellow-500"
            : "bg-blue-500"; // Red if overdue, Yellow if <=24h, else blue
      default:
        return "bg-gray-500"; // Gray for draft/not started
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getStatusText = () => {
    switch (status) {
      case "COMPLETED":
        return "✓ Completed";
      case "APPROVED":
        return "✓ Approved";
      case "OVERDUE":
        return `Overdue by ${formatTime(timeOverdue)}`;
      case "DRAFT":
        return `Not started (Starts ${new Date(document.startTrackAt).toLocaleDateString()})`;
      default:
        return timeOverdue > 0
          ? `Overdue by ${formatTime(timeOverdue)}`
          : `remaining : ${formatTime(Math.abs(timeOverdue))}`;
    }
  };

  return (
    <div className='w-full xl:min-w-sm space-y-1 flex flex-col'>
      <div className='relative h-2 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden'>
        <div
          className={`h-full ${getProgressColor()} transition-all rounded-sm duration-300 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* <div
        className={`w-full text-xs truncate ${
          status === "COMPLETED"
            ? "text-emerald-600 font-medium"
            : status === "APPROVED"
              ? "text-purple-600 font-medium"
              : status === "OVERDUE"
                ? "text-red-800 font-medium"
                : timeOverdue > 0
                  ? "text-red-800 font-medium"
                  : "text-muted-foreground"
        }`}
      >
        {getStatusText()}
      </div> */}
    </div>
  );
}
