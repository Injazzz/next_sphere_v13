import { Card, CardContent } from "@/components/ui/card";
import { FileX, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) => (
  <Card>
    <CardContent className='flex flex-col items-center justify-center py-12'>
      <FileX className='h-12 w-12 text-muted-foreground mb-4' />
      <h3 className='text-lg font-semibold mb-2'>{title}</h3>
      <p className='text-sm text-muted-foreground text-center mb-6 max-w-md'>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className='gap-2'>
          <Plus className='h-4 w-4' />
          {actionLabel}
        </Button>
      )}
    </CardContent>
  </Card>
);
