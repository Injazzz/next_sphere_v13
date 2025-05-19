import { DocumentStatus } from "@/generated/prisma";
import { Badge } from "../ui/badge";
import { getStatusColor } from "@/lib/utils";

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
}

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const colorClass = getStatusColor(status);

  return (
    <Badge className={`${colorClass} capitalize`}>{status.toLowerCase()}</Badge>
  );
}
