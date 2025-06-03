"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { DocumentCreateForm } from "./document-create-form";
import { Plus } from "lucide-react";

interface DocumentCreateDialogProps {
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export function DocumentCreateDialog({
  onSuccess,
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
}: DocumentCreateDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const router = useRouter();

  // Use controlled open state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
    router.refresh();
    toast.success("Document created successfully");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button>
            <Plus className='h-4 w-4' />
            New Document
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className='sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>Create New Document</DialogTitle>
          <DialogDescription>
            Fill out the form to create a new document. Click save when
            you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <DocumentCreateForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
