"use client";

import { useEffect } from "react";
import { formatRemainingTime } from "@/lib/utils";
import { sendEmailServerAction } from "@/lib/server/actions/send-mail.action";

interface UseDocumentNotificationProps {
  document: {
    id: string;
    title: string;
    type: string;
    status: string;
    startTrackAt: Date;
    endTrackAt: Date;
    client?: {
      email?: string | null;
    } | null;
  };
}

export function useDocumentNotification({
  document,
}: UseDocumentNotificationProps) {
  console.log(document);
  useEffect(() => {
    if (!document || !document.client?.email) {
      return;
    }

    const checkAndSendNotification = async () => {
      const now = Date.now();
      const endTime = new Date(document.endTrackAt).getTime();
      const remainingTime = endTime - now;
      const isWarning =
        remainingTime > 0 && remainingTime < 7 * 24 * 60 * 60 * 1000; // 7 days
      const isOverdue = remainingTime <= 0;

      if (!isWarning && !isOverdue) {
        return;
      }

      let emailSubject = "";
      let emailDescription = "";

      if (isWarning) {
        emailSubject = `⚠️ Warning: Document ${document.title} approaching deadline`;
        emailDescription = `Your document (${document.type}) is approaching its deadline. You have ${formatRemainingTime(remainingTime)} remaining to complete this document.`;
      } else if (isOverdue) {
        emailSubject = `🚨 Alert: Document ${document.title} is overdue`;
        emailDescription = `Your document (${document.type}) is overdue by ${formatRemainingTime(Math.abs(remainingTime))}. Please take immediate action.`;
      }

      try {
        if (!document.client?.email) return;
        await sendEmailServerAction({
          to: document.client.email,
          subject: emailSubject,
          meta: {
            title: emailSubject,
            description: emailDescription,
            link: `${process.env.NEXT_PUBLIC_API_URL}/guests/documents/${document.id}`,
            buttonText: "View Document",
            footer:
              "This is an automated message from the document tracking system.",
          },
        });
        console.log(`Notification sent for document ${document.id}`);
      } catch (error) {
        console.error("Failed to send notification:", error);
      }
    };

    // Check immediately
    checkAndSendNotification();

    // Set up interval to check every 12 hours
    const interval = setInterval(checkAndSendNotification, 12 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [document]);
}
