import { create } from "zustand"

import { SortOption } from "@/types/appDetails"

export enum AppStatusFilter {
  All = "All apps",
  Active = "Active apps",
  New = "New apps",
  GracePeriod = "In grace period",
  EndorsementLost = "Endorsement lost",
}

interface AppsFiltersState {
  // Status filter
  statusFilter: AppStatusFilter
  setStatusFilter: (filter: AppStatusFilter) => void

  // Category filters
  categoryFilters: string[]
  toggleCategoryFilter: (categoryId: string) => void
  clearCategoryFilters: () => void

  // Sorting
  sortOption: SortOption
  setSortOption: (option: SortOption) => void

  // Reset all
  resetFilters: () => void
}

const DEFAULT_STATUS_FILTER = AppStatusFilter.All
const DEFAULT_SORT_OPTION: SortOption = "default"

export const useAppsFilters = create<AppsFiltersState>(set => ({
  // Status filter
  statusFilter: DEFAULT_STATUS_FILTER,
  setStatusFilter: filter => set({ statusFilter: filter }),

  // Category filters
  categoryFilters: [],
  toggleCategoryFilter: categoryId =>
    set(state => ({
      categoryFilters: state.categoryFilters.includes(categoryId)
        ? state.categoryFilters.filter(id => id !== categoryId)
        : [...state.categoryFilters, categoryId],
    })),
  clearCategoryFilters: () => set({ categoryFilters: [] }),

  // Sorting
  sortOption: DEFAULT_SORT_OPTION,
  setSortOption: option => set({ sortOption: option }),

  // Reset all
  resetFilters: () =>
    set({
      statusFilter: DEFAULT_STATUS_FILTER,
      categoryFilters: [],
      sortOption: DEFAULT_SORT_OPTION,
    }),
}))
