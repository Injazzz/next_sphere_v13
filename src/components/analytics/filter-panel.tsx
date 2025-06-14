import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FilterPanelProps {
  filters: {
    documentType: string;
    flow: string;
    status: string;
    client: string;
  };
  onFiltersChange: (
    filters: Partial<{
      documentType: string;
      flow: string;
      status: string;
      client: string;
    }>
  ) => void;
  clients: Array<{ id: string; name: string }>;
}

export const FilterPanel = ({
  filters,
  onFiltersChange,
  clients,
}: FilterPanelProps) => {
  // Hitung filter aktif (yang bukan "all")
  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== "all"
  ).length;

  const clearAllFilters = () => {
    onFiltersChange({
      documentType: "all",
      flow: "all",
      status: "all",
      client: "all",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm' className='gap-2'>
          <Filter className='h-4 w-4' />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant='secondary' className='ml-1 h-5 w-5 p-0 text-xs'>
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md p-5'>
        <DialogHeader>
          <DialogTitle className='flex gap-2 items-center'>
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <Button
                variant='ghost'
                size='sm'
                onClick={clearAllFilters}
                className='text-primary h-8 px-2'
              >
                Clear all
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className='grid md:grid-cols-2 gap-4 py-4 px-4'>
          {/* Document Type Filter */}
          <div className='space-y-4'>
            <label className='text-sm font-medium'>Document Type</label>
            <Select
              value={filters.documentType}
              onValueChange={(value) =>
                onFiltersChange({ documentType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='All types' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Types</SelectItem>
                <SelectItem value='SPK'>SPK</SelectItem>
                <SelectItem value='JO'>Job Order</SelectItem>
                <SelectItem value='BA'>Berita Acara</SelectItem>
                <SelectItem value='IS'>Invoice Supplier</SelectItem>
                <SelectItem value='SA'>Service Agreement</SelectItem>
                <SelectItem value='INVOICE'>Invoice</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Flow Filter */}
          <div className='space-y-4'>
            <label className='text-sm font-medium'>Flow</label>
            <Select
              value={filters.flow}
              onValueChange={(value) => onFiltersChange({ flow: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder='All flows' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Flows</SelectItem>
                <SelectItem value='IN'>Incoming</SelectItem>
                <SelectItem value='OUT'>Outgoing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className='space-y-4'>
            <label className='text-sm font-medium'>Status</label>
            <Select
              value={filters.status}
              onValueChange={(value) => onFiltersChange({ status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder='All statuses' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Statuses</SelectItem>
                <SelectItem value='DRAFT'>Draft</SelectItem>
                <SelectItem value='ACTIVE'>Active</SelectItem>
                <SelectItem value='COMPLETED'>Completed</SelectItem>
                <SelectItem value='OVERDUE'>Overdue</SelectItem>
                <SelectItem value='WARNING'>Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Client Filter */}
          <div className='space-y-4'>
            <label className='text-sm font-medium'>Client</label>
            <Select
              value={filters.client}
              onValueChange={(value) => onFiltersChange({ client: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder='All clients' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
