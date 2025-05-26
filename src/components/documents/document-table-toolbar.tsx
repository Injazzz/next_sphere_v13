import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Columns2, Filter, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DocumentCreateDialog } from "./document-create-dialog";

interface DocumentTableToolbarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: Table<any>;
  search: string;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  typeFilter: string | null;
  statusFilter: string | null;
  teamDocuments: boolean;
  isTeamLeader: boolean;
  onTypeFilterChange: (value: string | null) => void;
  onStatusFilterChange: (value: string | null) => void;
  onTeamDocumentsChange: (value: boolean) => void;
  onRefresh: () => void;
}

export function DocumentTableToolbar({
  table,
  search,
  onSearch,
  typeFilter,
  statusFilter,
  teamDocuments,
  isTeamLeader,
  onTypeFilterChange,
  onStatusFilterChange,
  onTeamDocumentsChange,
  onRefresh,
}: DocumentTableToolbarProps) {
  return (
    <div className='flex md:items-center gap-4 flex-col md:flex-row md:justify-between'>
      <div className='flex space-x-2'>
        <Input
          placeholder='Search documents...'
          value={search}
          onChange={onSearch}
          className='max-w-sm'
        />
      </div>
      <div className='flex justify-end items-center space-x-2 ml-4'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm'>
              <Columns2 className='h-4 w-4' />
              <span className='hidden md:block'> Columns</span>
              <ChevronDown className='ml-2 h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className='capitalize'
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm'>
              <Filter className='h-4 w-4' />
              <span className='hidden md:block'> Filter</span>
              <ChevronDown className='ml-2 h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-48'>
            <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
            {["SPK", "JO", "BA", "IS", "SA", "INVOICE"].map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={typeFilter === type}
                onCheckedChange={(checked) =>
                  onTypeFilterChange(checked ? type : null)
                }
              >
                {type}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            {[
              "DRAFT",
              "ACTIVE",
              "WARNING",
              "OVERDUE",
              "COMPLETED",
              "APPROVED",
            ].map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilter === status}
                onCheckedChange={(checked) =>
                  onStatusFilterChange(checked ? status : null)
                }
              >
                {status}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={teamDocuments}
              onCheckedChange={onTeamDocumentsChange}
              disabled={!isTeamLeader}
            >
              Show Team Documents
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DocumentCreateDialog onSuccess={onRefresh} />
      </div>
    </div>
  );
}
