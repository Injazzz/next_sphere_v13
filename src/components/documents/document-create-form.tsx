"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { getFlowDisplay, getTypeDisplay } from "@/lib/utils";
import { DocumentFlow, DocumentStatus, DocumentType } from "@/generated/prisma";
import { ClientSearch } from "../client-search";
import { Checkbox } from "../ui/checkbox";
import { PopoverCalendar } from "../popover-calendar";

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

interface DocumentCreateFormProps {
  onSuccess?: () => void;
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

export function DocumentCreateForm({ onSuccess }: DocumentCreateFormProps) {
  const [step, setStep] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
            setUserTeam({ id: teams[0].id }); // User can only be in one team
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
      title: "",
      type: DocumentType.SPK,
      flow: DocumentFlow.IN,
      description: "",
      clientId: "",
      assignToTeam: false,
      startTrackAt: new Date(),
      endTrackAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      files: [],
    },
  });

  // Updated Document Creation (User) - Separate upload
  const handleCreateDocument = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Create document first (without files)
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
      };

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(documentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create document");
      }

      const document = await response.json();

      // Upload files if any
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
          toast.error("Document created but file upload failed");
        }
      } else {
        toast.success("Document created successfully");
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error creating document:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create document"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    // Prevent double submissions
    if (isSubmitting) return;
    await handleCreateDocument(values);
  };

  // Function to validate the current step fields without advancing
  const validateCurrentStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger(["title", "type", "flow"]);
    } else if (step === 2) {
      isValid = await form.trigger("clientId");
    } else if (step === 3) {
      isValid = await form.trigger(["startTrackAt", "endTrackAt"]);
    }
    return isValid;
  };

  const nextStep = async () => {
    // Validate current step before proceeding
    const isValid = await validateCurrentStep();
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleFileChange = (files: File[]) => {
    setSelectedFiles(files);
  };

  // Helper function to handle date changes for startTrackAt
  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      form.setValue("startTrackAt", date);
      // If end date is before new start date, adjust it
      const currentEndDate = form.getValues("endTrackAt");
      if (currentEndDate < date) {
        form.setValue("endTrackAt", date);
      }
    }
  };

  // Helper function to handle date changes for endTrackAt
  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      form.setValue("endTrackAt", date);
      // If start date is after new end date, adjust it
      const currentStartDate = form.getValues("startTrackAt");
      if (currentStartDate > date) {
        form.setValue("startTrackAt", date);
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        {step === 1 && (
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
          </div>
        )}

        {step === 2 && (
          <div className='space-y-4'>
            <FormField
              control={form.control}
              name='clientId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <FormControl>
                    <ClientSearch
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Replace TeamSearch with Checkbox */}
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
              <FormDescription>Upload PDF files (max 5MB each)</FormDescription>
              <FileUpload
                accept='.pdf'
                multiple
                maxSize={5 * 1024 * 1024} // 5MB
                onFilesChange={handleFileChange}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='startTrackAt'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <PopoverCalendar
                        value={field.value}
                        onChange={handleStartDateChange}
                        disabledDays={(date) =>
                          date < new Date() ||
                          date > form.getValues("endTrackAt")
                        }
                      />
                    </FormControl>
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
                    <FormControl>
                      <PopoverCalendar
                        value={field.value}
                        onChange={handleEndDateChange}
                        disabledDays={(date) =>
                          date < new Date() ||
                          date > form.getValues("endTrackAt")
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='pt-4'>
              <FormLabel>Preview</FormLabel>
              <div className='border rounded-lg p-4'>
                <h3 className='font-medium mb-2'>Document Summary</h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm text-muted-foreground'>Title</p>
                    <p>{form.getValues("title")}</p>
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>Type</p>
                    <p>{form.getValues("type")}</p>
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>Flow</p>
                    <p>{form.getValues("flow")}</p>
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>Client</p>
                    <p>
                      {form.getValues("clientId") ? "Selected" : "Not selected"}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>Files</p>
                    <p>{selectedFiles.length} file(s) selected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className='flex justify-between'>
          {step > 1 && (
            <Button
              type='button'
              variant='outline'
              onClick={prevStep}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
          {step < 3 && (
            <Button type='button' onClick={nextStep}>
              Next
            </Button>
          )}

          {step === 3 && (
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Document"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
