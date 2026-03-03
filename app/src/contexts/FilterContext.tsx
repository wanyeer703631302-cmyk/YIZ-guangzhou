import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { Tag } from '../types/tags'

interface FilterContextState {
  selectedTagIds: string[]
  tags: Tag[]
  filteredAssetIds: string[]
  isLoading: boolean
  toggleTag: (tagId: string) => void
  clearFilters: () => void
  refreshTags: () => Promise<void>
  setTags: (tags: Tag[]) => void
  debouncedRefreshTags: () => void
}

const FilterContext = createContext<FilterContextState | undefined>(undefined)

const STORAGE_KEY = 'gallery-filter-state'
const DEBOUNCE_DELAY = 500 // 500ms debounce

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Restore filter state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed.selectedTagIds)) {
          setSelectedTagIds(parsed.selectedTagIds)
        }
      }
    } catch (error) {
      console.error('Failed to restore filter state:', error)
    }
  }, [])

  // Persist filter state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ selectedTagIds }))
    } catch (error) {
      console.error('Failed to persist filter state:', error)
    }
  }, [selectedTagIds])

  // Toggle tag selection
  const toggleTag = useCallback((tagId: string) => {
    setSelectedTagIds(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId)
      } else {
        return [...prev, tagId]
      }
    })
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedTagIds([])
  }, [])

  // Refresh tags from API
  const refreshTags = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        if (data.success && Array.isArray(data.data)) {
          setTags(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to refresh tags:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Compute filtered asset IDs (placeholder - will be computed by parent)
  const filteredAssetIds = useMemo(() => {
    // This will be computed by the parent component that has access to assets
    // For now, return empty array
    return []
  }, [selectedTagIds])

  // Debounced refresh tags
  const debouncedRefreshTags = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    debounceTimerRef.current = setTimeout(() => {
      refreshTags()
    }, DEBOUNCE_DELAY)
  }, [refreshTags])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const value: FilterContextState = {
    selectedTagIds,
    tags,
    filteredAssetIds,
    isLoading,
    toggleTag,
    clearFilters,
    refreshTags,
    setTags,
    debouncedRefreshTags
  }

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilter() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider')
  }
  return context
}
