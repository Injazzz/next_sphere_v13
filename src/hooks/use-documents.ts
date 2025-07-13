/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  ColumnFiltersState,
  SortingState,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { columns } from "@/components/documents/document-table-column";
import { calculateRemainingTime } from "@/lib/utils";
import { DocumentWithRelations } from "@/types/documents";

export function useDocumentTable() {
  const [data, setData] = useState<DocumentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    totalCount: 0,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "remainingTime", desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [teamDocuments, setTeamDocuments] = useState(false);
  const [isTeamLeader, setIsTeamLeader] = useState(false);
  const [draggedRow, setDraggedRow] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<{
    field: "remainingTime" | "createdAt";
    order: "asc" | "desc";
  }>({ field: "remainingTime", order: "asc" });

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    pageCount: Math.ceil(pagination.totalCount / pagination.pageSize),
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newPagination = updater({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
        });
        setPagination((prev) => ({
          ...prev,
          pageIndex: newPagination.pageIndex,
          pageSize: newPagination.pageSize,
        }));
      }
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const checkTeamLeaderStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents?limit=1`);
      const result = await response.json();
      if (response.ok && result.meta && result.meta.isTeamLeader) {
        setIsTeamLeader(true);
        setTeamDocuments(true);
      }
    } catch (error) {
      console.error("Failed to check team leader status:", error);
    }
  }, []);

  const updateDocumentPinning = useCallback((doc: DocumentWithRelations) => {
    return {
      ...doc,
      isPinned: doc.status.toLowerCase() === "overdue" ? true : doc.isPinned,
      remainingTime: calculateRemainingTime(doc.endTrackAt),
      isCritical:
        calculateRemainingTime(doc.endTrackAt) < 5 * 24 * 60 * 60 * 1000,
    };
  }, []);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        search,
        sortBy: sortOption.field,
        sortOrder: sortOption.order,
        type: typeFilter || "",
        status: statusFilter || "",
        teamDocuments: teamDocuments.toString(),
      });
      const response = await fetch(`/api/documents?${params.toString()}`);
      const result = await response.json();
      if (response.ok) {
        setData(result.data.map(updateDocumentPinning));
        setPagination((prev) => ({
          ...prev,
          totalCount: result.meta.total,
        }));
        if (result.meta && result.meta.isTeamLeader !== undefined) {
          setIsTeamLeader(result.meta.isTeamLeader);
        }
      } else {
        toast.error(result.error || "Failed to fetch documents");
      }
    } catch (error) {
      toast.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    search,
    sortOption,
    typeFilter,
    statusFilter,
    teamDocuments,
    updateDocumentPinning,
  ]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handlePageSizeChange = useCallback((newSize: string) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: parseInt(newSize),
      pageIndex: 0,
    }));
  }, []);

  // Auto-refresh every minute to update remaining times
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        setData((prevData) => prevData.map(updateDocumentPinning));
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [loading, updateDocumentPinning]);

  useEffect(() => {
    checkTeamLeaderStatus();
  }, [checkTeamLeaderStatus]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    data,
    loading,
    pagination,
    sorting,
    columnFilters,
    columnVisibility,
    rowSelection,
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
  };
}
