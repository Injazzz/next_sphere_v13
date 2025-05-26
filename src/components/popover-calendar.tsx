"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PopoverCalendar({
  value,
  onChange,
  disabledDays,
  placeholder = "Pick a date",
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  disabledDays?: (date: Date) => boolean;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  // Sinkronkan nilai lokal dengan nilai dari form
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Fungsi untuk menangani klik di luar komponen
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".calendar-wrapper")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelect = (date: Date | undefined) => {
    setLocalValue(date);
    onChange(date);
    setIsOpen(false);
  };

  return (
    <div className='relative w-full'>
      <Button
        type='button'
        variant='outline'
        className={cn(
          "w-full pl-3 text-left font-normal",
          !localValue && "text-muted-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {localValue ? format(localValue, "PPP") : <span>{placeholder}</span>}
        <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
      </Button>

      {isOpen && (
        <div className='calendar-wrapper absolute top-full mt-1 z-50 bg-background shadow-lg rounded-md border'>
          <Calendar
            mode='single'
            selected={localValue}
            onSelect={handleSelect}
            disabled={disabledDays}
            initialFocus
          />
        </div>
      )}
    </div>
  );
}

// Penggunaan dalam DocumentEditForm:
/*
<FormField
  control={form.control}
  name='startTrackAt'
  render={({ field }) => (
    <FormItem className='flex flex-col'>
      <FormLabel>Start Date</FormLabel>
      <FormControl>
        <PopoverCalendar
          value={field.value}
          onChange={field.onChange}
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
*/
