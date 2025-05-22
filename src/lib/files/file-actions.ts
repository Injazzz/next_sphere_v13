// utils/file-actions.ts
import { toast } from "sonner";

export const handleDownloadFile = async (
  fileType: "document" | "response",
  fileId: string,
  fileName: string,
  preview = false
) => {
  try {
    const url = `/api/files/download/${fileType}/${fileId}${preview ? "?preview=true" : ""}`;

    if (preview) {
      window.open(url, "_blank");
    } else {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to download file");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    }
  } catch (error) {
    console.error("Error downloading file:", error);
    toast.error(
      error instanceof Error ? error.message : "Failed to download file"
    );
    throw error;
  }
};

export const handleDeleteFile = async (
  fileType: "document" | "response",
  fileId: string
) => {
  try {
    const response = await fetch(
      `/api/files/delete/${fileId}?fileType=${fileType}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete file");
    }

    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    toast.error(
      error instanceof Error ? error.message : "Failed to delete file"
    );
    throw error;
  }
};
