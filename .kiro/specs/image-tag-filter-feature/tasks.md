# Implementation Plan: Image Tag Filter Feature

## Overview

This plan implements a comprehensive image tagging and filtering system with tag management, multi-tag filtering with AND logic, persistent filter state, and real-time UI updates. The implementation uses existing database models (Tag, AssetTag), creates 7 RESTful API endpoints, and builds React components with Context-based state management. All tasks include property-based tests using fast-check with 100 iterations each, plus unit tests for edge cases.

## Tasks

- [ ] 1. Verify database schema and create TypeScript types
  - Verify existing Tag and AssetTag models in Prisma schema
  - Create frontend type definitions in `app/src/types/tags.ts`
  - Ensure Asset model has tags relation
  - _Requirements: 1.8, 2.3_

- [ ] 2. Implement Tag CRUD API endpoints
  - [ ] 2.1 Implement GET /api/tags endpoint
    - Query all tags with image counts using LEFT JOIN
    - Order by name ascending
    - Return tag list with counts
    - _Requirements: 1.1, 8.1_
  
  - [ ]* 2.2 Write property test for GET /api/tags
    - **Property 10: All Tags Displayed**
    - **Validates: Requirements 3.2, 3.3**
  
  - [ ] 2.3 Implement POST /api/tags endpoint
    - Validate non-empty tag name
    - Validate unique tag name (case-insensitive)
    - Trim whitespace from name
    - Return created tag
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ]* 2.4 Write property tests for POST /api/tags
    - **Property 1: Tag Creation with Unique Names**
    - **Validates: Requirements 1.1, 1.2**
    - **Property 2: Empty Tag Name Rejection**
    - **Validates: Requirements 1.2**
  
  - [ ]* 2.5 Write unit tests for POST /api/tags edge cases
    - Test whitespace-only names
    - Test duplicate names with different casing
    - Test maximum length names
    - _Requirements: 1.2, 1.3, 9.1_
  
  - [ ] 2.6 Implement PUT /api/tags/:id endpoint
    - Validate tag exists
    - Validate new name (same rules as POST)
    - Update tag name
    - Return updated tag
    - _Requirements: 1.4, 1.5_
  
  - [ ]* 2.7 Write property test for PUT /api/tags/:id
    - **Property 3: Tag Name Edit Propagation**
    - **Validates: Requirements 1.4, 1.5**
  
  - [ ] 2.8 Implement DELETE /api/tags/:id endpoint
    - Validate tag exists
    - Delete tag (cascade deletes AssetTag records)
    - Return success response
    - _Requirements: 1.6, 1.7_
  
  - [ ]* 2.9 Write property test for DELETE /api/tags/:id
    - **Property 4: Tag Deletion Cascade**
    - **Validates: Requirements 1.6, 1.7**
  
  - [ ]* 2.10 Write unit tests for tag CRUD error handling
    - Test 404 for non-existent tag
    - Test 400 for invalid input
    - Test database connection failures
    - _Requirements: 9.1, 9.2_

- [ ] 3. Checkpoint - Verify tag API endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Asset-Tag Association API endpoints
  - [ ] 4.1 Implement POST /api/assets/:assetId/tags endpoint
    - Validate asset exists
    - Validate tag exists
    - Prevent duplicate associations
    - Create AssetTag record
    - Return association
    - _Requirements: 2.1, 2.3, 2.6_
  
  - [ ]* 4.2 Write property tests for POST /api/assets/:assetId/tags
    - **Property 6: Multiple Tag Association**
    - **Validates: Requirements 2.1, 2.5**
    - **Property 8: Duplicate Association Prevention**
    - **Validates: Requirements 2.6**
  
  - [ ] 4.3 Implement DELETE /api/assets/:assetId/tags/:tagId endpoint
    - Validate association exists
    - Delete AssetTag record
    - Return success response
    - _Requirements: 2.2, 2.4_
  
  - [ ]* 4.4 Write property test for DELETE /api/assets/:assetId/tags/:tagId
    - **Property 7: Tag Association Removal**
    - **Validates: Requirements 2.2**
  
  - [ ]* 4.5 Write unit tests for association edge cases
    - Test removing non-existent association
    - Test adding tag to non-existent asset
    - Test concurrent association modifications
    - _Requirements: 9.3_

- [ ] 5. Enhance GET /api/assets endpoint with tag filtering
  - [ ] 5.1 Add tagIds query parameter support
    - Parse tagIds array from query string
    - Implement AND logic filtering (images with ALL selected tags)
    - Include tag data in asset response
    - Maintain backward compatibility (no tagIds = all assets)
    - _Requirements: 4.1, 5.2_
  
  - [ ]* 5.2 Write property tests for filtering logic
    - **Property 11: Single Tag Filter Correctness**
    - **Validates: Requirements 4.1**
    - **Property 12: Multi-Tag AND Filter Correctness**
    - **Validates: Requirements 5.2**
    - **Property 13: Clear Filter Restoration**
    - **Validates: Requirements 4.4, 5.5**
  
  - [ ]* 5.3 Write unit tests for filtering edge cases
    - Test empty tagIds array
    - Test non-existent tag IDs
    - Test filtering with no matching images
    - _Requirements: 4.3, 9.4_

- [ ] 6. Checkpoint - Verify API layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Create FilterContext for global filter state
  - [ ] 7.1 Implement FilterContext with state management
    - Create context with selectedTagIds state
    - Implement toggleTag function
    - Implement clearFilters function
    - Implement localStorage persistence
    - Implement localStorage restoration on mount
    - Provide filteredAssetIds computed from selected tags
    - _Requirements: 5.1, 5.3, 5.4, 7.1, 7.2, 7.3_
  
  - [ ]* 7.2 Write property tests for FilterContext
    - **Property 14: Filter State Round Trip**
    - **Validates: Requirements 7.1, 7.2**
    - **Property 15: Navigation State Preservation**
    - **Validates: Requirements 6.4**
  
  - [ ]* 7.3 Write unit tests for FilterContext
    - Test initial state
    - Test toggleTag adds and removes tags
    - Test clearFilters resets state
    - Test localStorage edge cases (corrupted data, quota exceeded)
    - _Requirements: 7.4_

- [ ] 8. Implement FilterButton component
  - [ ] 8.1 Create FilterButton component
    - Fixed position in bottom-right corner (20px from edges)
    - Display filter icon with badge showing selected count
    - Animate badge on count change
    - Handle click to open filter panel
    - _Requirements: 3.1, 3.6_
  
  - [ ]* 8.2 Write unit tests for FilterButton
    - Test renders with correct count
    - Test click handler called
    - Test badge visibility (hidden when count is 0)
    - Test positioning styles
    - _Requirements: 3.1, 3.6_

- [ ] 9. Implement FilterPanel component
  - [ ] 9.1 Create FilterPanel component
    - Display scrollable list of tags with checkboxes
    - Show image count for each tag (total and filtered)
    - Implement search bar to filter tag list
    - Add "Manage Tags" button
    - Close on outside click or ESC key
    - Display loading indicator during operations
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 6.2, 8.1, 8.3, 8.4_
  
  - [ ]* 9.2 Write property test for FilterPanel
    - **Property 9: Tag Selection State Consistency**
    - **Validates: Requirements 3.4, 3.6**
  
  - [ ]* 9.3 Write unit tests for FilterPanel
    - Test renders all tags
    - Test search filtering
    - Test checkbox toggle
    - Test outside click closes panel
    - Test ESC key closes panel
    - Test "Manage Tags" button click
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [ ] 10. Implement TagManager component
  - [ ] 10.1 Create TagManager modal component
    - Display list of existing tags with edit/delete buttons
    - Implement create tag form with validation
    - Implement edit tag inline form
    - Implement delete tag with confirmation
    - Display error messages for failed operations
    - Implement optimistic UI updates with rollback
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 9.1, 9.2_
  
  - [ ]* 10.2 Write property test for TagManager
    - **Property 5: Tag Persistence Round Trip**
    - **Validates: Requirements 1.8**
  
  - [ ]* 10.3 Write unit tests for TagManager
    - Test create tag success and failure
    - Test edit tag success and failure
    - Test delete tag success and failure
    - Test validation error display
    - Test optimistic update rollback
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 9.1, 9.2_

- [ ] 11. Implement TagSelector component
  - [ ] 11.1 Create TagSelector component for image tagging
    - Display current tags as removable badges
    - Implement dropdown to add new tags
    - Prevent duplicate tag associations
    - Implement optimistic updates
    - Display error messages on failure
    - _Requirements: 2.1, 2.2, 2.6, 9.3_
  
  - [ ]* 11.2 Write unit tests for TagSelector
    - Test displays current tags
    - Test add tag from dropdown
    - Test remove tag badge click
    - Test prevents duplicate additions
    - Test error handling
    - _Requirements: 2.1, 2.2, 2.6, 9.3_

- [ ] 12. Checkpoint - Verify all components render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Integrate FilterContext with GalleryCanvas
  - [ ] 13.1 Wrap GalleryCanvas with FilterContext provider
    - Add FilterContext.Provider at appropriate level
    - Update GalleryCanvas to consume filteredAssetIds
    - Implement real-time gallery updates on filter change
    - Display empty state when no images match filter
    - _Requirements: 4.1, 4.2, 4.3, 5.3, 5.4, 6.1, 6.3_
  
  - [ ]* 13.2 Write integration tests for gallery filtering
    - Test gallery updates when filter changes
    - Test empty state display
    - Test filter restoration on page load
    - _Requirements: 4.2, 4.3, 6.3, 7.4_

- [ ] 14. Implement tag count updates
  - [ ] 14.1 Add tag count refresh logic
    - Implement refreshTags function in FilterContext
    - Call refreshTags after tag associations change
    - Debounce count updates to prevent excessive re-renders
    - Update both total and filtered counts
    - _Requirements: 8.1, 8.2, 8.4_
  
  - [ ]* 14.2 Write property tests for tag counts
    - **Property 16: Tag Count Accuracy**
    - **Validates: Requirements 8.1**
    - **Property 17: Tag Count Update on Association Change**
    - **Validates: Requirements 8.2**
    - **Property 18: Filtered Count Accuracy**
    - **Validates: Requirements 8.4**
  
  - [ ]* 14.3 Write unit tests for tag count edge cases
    - Test count for tag with zero images
    - Test count updates after multiple rapid changes
    - Test filtered count with no active filters
    - _Requirements: 8.3_

- [ ] 15. Implement error handling and logging
  - [ ] 15.1 Add comprehensive error handling
    - Implement error toast notifications using sonner
    - Add retry logic for network errors (max 2 retries, exponential backoff)
    - Implement graceful degradation (show all images on filter failure)
    - Add error logging to console with context
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 15.2 Write property tests for error handling
    - **Property 19: Tag Creation Error Handling**
    - **Validates: Requirements 9.1**
    - **Property 20: Operation Failure State Preservation**
    - **Validates: Requirements 9.2, 9.3**
    - **Property 21: Filter Error Fallback**
    - **Validates: Requirements 9.4**
  
  - [ ]* 15.3 Write unit tests for error scenarios
    - Test network timeout handling
    - Test database constraint violation
    - Test invalid JSON response
    - Test concurrent modification conflicts
    - Test retry logic
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 16. Checkpoint - Verify error handling works correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Implement performance optimizations
  - [ ] 17.1 Optimize filtering performance
    - Implement client-side filtering in FilterContext
    - Use memoization for filtered asset IDs computation
    - Debounce filter state updates
    - Ensure existing gallery virtualization works with filtering
    - _Requirements: 6.1, 10.1, 10.2, 10.4_
  
  - [ ]* 17.2 Write performance property tests
    - **Property 22: 1000 Image Filter Performance**
    - **Validates: Requirements 6.1, 10.1**
    - **Property 23: 10000 Image Filter Performance**
    - **Validates: Requirements 10.2**
    - **Property 24: 100 Tag Render Performance**
    - **Validates: Requirements 10.3**
  
  - [ ]* 17.3 Write performance unit tests
    - Test filter performance with 1000 images (<200ms)
    - Test filter performance with 10000 images (<500ms)
    - Test FilterPanel render with 100 tags (<200ms)
    - Test tag count update performance (<100ms)
    - _Requirements: 6.1, 10.1, 10.2, 10.3_

- [ ] 18. Add FilterButton to main application layout
  - [ ] 18.1 Integrate FilterButton into app layout
    - Add FilterButton to appropriate layout component
    - Ensure FilterButton appears on gallery pages only
    - Wire FilterButton to open FilterPanel
    - Test FilterButton visibility and positioning
    - _Requirements: 3.1_
  
  - [ ]* 18.2 Write integration tests for FilterButton placement
    - Test FilterButton renders on gallery page
    - Test FilterButton does not render on other pages
    - Test FilterButton opens FilterPanel
    - _Requirements: 3.1_

- [ ] 19. Final integration and wiring
  - [ ] 19.1 Connect all components together
    - Verify FilterContext provides state to all components
    - Verify TagManager updates reflect in FilterPanel
    - Verify TagSelector updates reflect in tag counts
    - Verify filter state persists across page refreshes
    - Test complete user flow: create tag → add to image → filter by tag
    - _Requirements: All requirements_
  
  - [ ]* 19.2 Write end-to-end integration tests
    - Test complete tag creation and filtering flow
    - Test tag editing updates all associations
    - Test tag deletion removes from all images
    - Test multi-tag filtering with various combinations
    - Test filter state persistence across sessions
    - _Requirements: All requirements_

- [ ] 20. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check with 100 iterations minimum
- All property tests include comments with property number and validated requirements
- Performance tests must meet specified targets or fail the build
- Checkpoints ensure incremental validation and user feedback opportunities
- The implementation uses TypeScript throughout (frontend and API)
- Existing database models (Tag, AssetTag) require no schema changes
