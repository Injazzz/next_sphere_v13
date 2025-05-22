"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { FileUpload } from "../file-upload";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn, getFlowDisplay, getTypeDisplay } from "@/lib/utils";
import { ClientSearch } from "../client-search";
import { Checkbox } from "../ui/checkbox";
import {
  Document,
  DocumentFlow,
  DocumentType,
  DocumentStatus,
} from "@/generated/prisma";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.nativeEnum(DocumentType),
  flow: z.nativeEnum(DocumentFlow),
  description: z.string().optional(),
  clientId: z.string().min(1, "Client is required"),
  assignToTeam: z.boolean(),
  startTrackAt: z.date(),
  endTrackAt: z.date(),
  files: z.array(z.instanceof(File)).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface DocumentEditFormProps {
  document: Document & {
    client: {
      id: string;
      name: string;
    };
    files: {
      id: string;
      name: string;
      url: string;
      size: number;
    }[];
    team?: {
      id: string;
    };
  };
}

// Calculate initial document status helper
function calculateInitialStatus(
  startDate: Date,
  endDate: Date
): DocumentStatus {
  const today = new Date();
  const start = new Date(startDate);

  if (start > today) {
    return "DRAFT";
  }

  const end = new Date(endDate);
  const timeDiff = end.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) {
    return "OVERDUE" as DocumentStatus;
  } else if (daysRemaining <= 10) {
    return "WARNING" as DocumentStatus;
  } else {
    return "ACTIVE" as DocumentStatus;
  }
}

export function DocumentEditForm({ document }: DocumentEditFormProps) {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState(document.files);
  const [userTeam, setUserTeam] = useState<{ id: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's team on component mount
  useEffect(() => {
    const fetchUserTeam = async () => {
      try {
        const response = await fetch("/api/teams");
        if (response.ok) {
          const teams = await response.json();
          if (teams.length > 0) {
            setUserTeam({ id: teams[0].id });
          }
        }
      } catch (error) {
        console.error("Failed to fetch user team", error);
      }
    };
    fetchUserTeam();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: document.title,
      type: document.type,
      flow: document.flow,
      description: document.description || "",
      clientId: document.client.id,
      assignToTeam: !!document.team,
      startTrackAt: new Date(document.startTrackAt),
      endTrackAt: new Date(document.endTrackAt),
      files: [],
    },
  });

  const handleUpdateDocument = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Update document first (without files)
      const documentData = {
        title: values.title,
        type: values.type,
        flow: values.flow,
        description: values.description || "",
        clientId: values.clientId,
        startTrackAt: values.startTrackAt.toISOString(),
        endTrackAt: values.endTrackAt.toISOString(),
        teamId: values.assignToTeam && userTeam ? userTeam.id : null,
        initialStatus: calculateInitialStatus(
          values.startTrackAt,
          values.endTrackAt
        ),
        existingFileIds: existingFiles.map((file) => file.id), // Keep existing files
      };

      const response = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(documentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update document");
      }

      const updatedDocument = await response.json();

      if (updatedDocument.error) {
        throw new Error(updatedDocument.error);
      }
      // Upload new files if any
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append("documentId", document.id);
        formData.append("fileType", "document");

        selectedFiles.forEach((file) => {
          formData.append("files", file);
        });

        const uploadResponse = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          console.error("File upload failed:", errorData.error);
          toast.error("Document updated but file upload failed");
        } else {
          toast.success("Document updated with new files successfully");
        }
      } else {
        toast.success("Document updated successfully");
      }

      router.push(`/dashboard/documents/${document.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update document"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    await handleUpdateDocument(values);
  };

  const handleFileChange = (files: File[]) => {
    setSelectedFiles(files);
  };

  const removeExistingFile = (fileId: string) => {
    setExistingFiles(existingFiles.filter((file) => file.id !== fileId));
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-6 w-full max-w-2xl'
      >
        <div className='space-y-4'>
          <FormField
            control={form.control}
            name='title'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document Title</FormLabel>
                <FormControl>
                  <Input placeholder='Enter document title' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select document type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(DocumentType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {getTypeDisplay(type)}{" "}
                          <span className='text-muted-foreground'>
                            ({type})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='flow'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Flow</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select document flow' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(DocumentFlow).map((flow) => (
                        <SelectItem key={flow} value={flow}>
                          {getFlowDisplay(flow)}{" "}
                          <span className='text-muted-foreground'>
                            ({flow})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Enter document description'
                    className='resize-none'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='clientId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <FormControl>
                  <ClientSearch value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {userTeam && (
            <FormField
              control={form.control}
              name='assignToTeam'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel>Assign to my team</FormLabel>
                    <FormDescription>
                      This document will be visible to all team members
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          )}

          <div className='pt-4'>
            <FormLabel>Attachments</FormLabel>
            <FormDescription>
              Upload multiple files (PDF, DOC, DOCX, JPG, JPEG, PNG - max 5MB
              each)
            </FormDescription>

            {existingFiles.length > 0 && (
              <div className='mb-4 space-y-2'>
                <h4 className='text-sm font-medium'>Existing Files</h4>
                {existingFiles.map((file) => (
                  <div
                    key={file.id}
                    className='flex items-center justify-between p-2 border rounded-lg'
                  >
                    <div className='flex items-center gap-2'>
                      <span className='text-sm'>{file.name}</span>
                      <span className='text-xs text-muted-foreground'>
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => removeExistingFile(file.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <FileUpload
              accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
              multiple={true}
              maxSize={5 * 1024 * 1024} // 5MB
              uploadMode='select' // Separate upload mode like in the example
              onFilesChange={handleFileChange}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='startTrackAt'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < form.getValues("startTrackAt") ||
                          date < new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='endTrackAt'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() ||
                          date > form.getValues("endTrackAt")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className='flex justify-end gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.push(`/dashboard/documents/${document.id}`)}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
