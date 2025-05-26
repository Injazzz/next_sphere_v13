"use client";
import { useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DocumentTableToolbar } from "./document-table-toolbar";
import { DocumentTablePagination } from "./document-table-pagination";
import { columns } from "./document-table-column";
import { cn } from "@/lib/utils";
import { useDocumentTable } from "@/hooks/use-documents";
import { flexRender } from "@tanstack/react-table";

export function DocumentTable() {
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);

  const {
    loading,
    pagination,
    search,
    typeFilter,
    statusFilter,
    teamDocuments,
    isTeamLeader,
    draggedRow,
    sortOption,
    table,
    handleSearch,
    handlePageSizeChange,
    setTypeFilter,
    setStatusFilter,
    setTeamDocuments,
    setSortOption,
    fetchDocuments,
  } = useDocumentTable();

  return (
    <div className='w-full space-y-4'>
      <DocumentTableToolbar
        table={table}
        search={search}
        onSearch={handleSearch}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        teamDocuments={teamDocuments}
        isTeamLeader={isTeamLeader}
        onTypeFilterChange={setTypeFilter}
        onStatusFilterChange={setStatusFilter}
        onTeamDocumentsChange={setTeamDocuments}
        onRefresh={fetchDocuments}
      />

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody ref={tableBodyRef}>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  <div className='flex items-center justify-center space-x-2'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900'></div>
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  data-row-id={row.id}
                  className={cn(
                    "group transition-all duration-300 ease-in-out",
                    row.original.isPinned
                      ? "bg-yellow-50 dark:bg-yellow-900/10"
                      : "",
                    row.original.isCritical
                      ? "border-l-4 border-orange-500"
                      : ""
                  )}
                  style={{
                    transform:
                      draggedRow === row.id ? "scale(1.02)" : "scale(1)",
                    boxShadow:
                      draggedRow === row.id
                        ? "0 4px 12px rgba(0,0,0,0.15)"
                        : "none",
                    opacity: draggedRow === row.id ? 0.8 : 1,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No documents found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DocumentTablePagination
        table={table}
        pagination={pagination}
        sortOption={sortOption}
        onPageSizeChange={handlePageSizeChange}
        onSortOptionChange={setSortOption}
      />
    </div>
  );
}
