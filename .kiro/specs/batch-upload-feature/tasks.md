# Tasks: Batch Upload Feature

## Phase 1: Backend Extensions

### Task 1.1: Extend Database Schema
- [ ] 1.1.1 Add `relativePath` field to Asset model in Prisma schema
- [ ] 1.1.2 Create and run database migration
- [ ] 1.1.3 Update TypeScript types to reflect schema changes
- [ ] 1.1.4 Verify migration in development database

### Task 1.2: Extend Upload API
- [ ] 1.2.1 Update upload API to accept `relativePath` parameter
- [ ] 1.2.2 Save `relativePath` to database when provided
- [ ] 1.2.3 Add validation for `relativePath` format
- [ ] 1.2.4 Update API response types
- [ ] 1.2.5 Write unit tests for relativePath handling

### Task 1.3: Add Folder Structure Query API (Optional)
- [ ] 1.3.1 Create API endpoint to query assets by folder structure
- [ ] 1.3.2 Implement folder hierarchy reconstruction logic
- [ ] 1.3.3 Add pagination support
- [ ] 1.3.4 Write unit tests for reconstruction logic

## Phase 2: Core Upload Logic

### Task 2.1: Implement FileScanner Module
- [ ] 2.1.1 Create `FileScanner` class with folder scanning logic
- [ ] 2.1.2 Implement recursive file discovery from FileList
- [ ] 2.1.3 Implement file format validation (JPG, JPEG, PNG, GIF, WEBP)
- [ ] 2.1.4 Implement file size validation (max 10MB)
- [ ] 2.1.5 Implement readability check
- [ ] 2.1.6 Build folder structure tree from file paths
- [ ] 2.1.7 Return ScanResult with valid/invalid files

### Task 2.2: Implement UploadManager Class
- [ ] 2.2.1 Create `UploadManager` class with task queue
- [ ] 2.2.2 Implement `addFiles()` method to create upload tasks
- [ ] 2.2.3 Implement concurrency control (max 5 simultaneous uploads)
- [ ] 2.2.4 Implement `start()` method with progress callbacks
- [ ] 2.2.5 Implement retry logic (max 3 retries, 2s delay)
- [ ] 2.2.6 Implement `pause()` and `resume()` methods
- [ ] 2.2.7 Implement `cancel()` method with cleanup
- [ ] 2.2.8 Implement `retryFailed()` method
- [ ] 2.2.9 Implement progress calculation (percentage, speed)
- [ ] 2.2.10 Handle task state transitions

### Task 2.3: Extend API Client
- [ ] 2.3.1 Update `apiClient.uploadAsset()` to accept `relativePath` option
- [ ] 2.3.2 Update request payload to include relativePath
- [ ] 2.3.3 Update TypeScript interfaces for UploadOptions
- [ ] 2.3.4 Add error handling for new field

## Phase 3: UI Components

### Task 3.1: Create BatchUploadModal Component
- [ ] 3.1.1 Create modal component with open/close state
- [ ] 3.1.2 Implement phase state management (selecting, scanning, uploading, etc.)
- [ ] 3.1.3 Add folder input with `webkitdirectory` attribute
- [ ] 3.1.4 Integrate FileScanner for folder scanning
- [ ] 3.1.5 Display scan results (file count, folder structure preview)
- [ ] 3.1.6 Add confirmation UI before starting upload
- [ ] 3.1.7 Integrate UploadManager for upload execution
- [ ] 3.1.8 Handle upload completion and results display

### Task 3.2: Create UploadProgressPanel Component
- [ ] 3.2.1 Create progress panel component
- [ ] 3.2.2 Display overall progress bar
- [ ] 3.2.3 Display completion count (X of Y files)
- [ ] 3.2.4 Display percentage completion
- [ ] 3.2.5 Display upload speed (MB/s)
- [ ] 3.2.6 Display estimated time remaining
- [ ] 3.2.7 Display file list with individual status indicators
- [ ] 3.2.8 Add pause/resume/cancel control buttons
- [ ] 3.2.9 Update UI in real-time based on progress callbacks

### Task 3.3: Create ErrorSummary Component
- [ ] 3.3.1 Create error summary component
- [ ] 3.3.2 Display list of failed files with error messages
- [ ] 3.3.3 Add "Retry All" button
- [ ] 3.3.4 Add individual retry buttons for each failed file
- [ ] 3.3.5 Add "Export Failed List" button
- [ ] 3.3.6 Implement export functionality (CSV or JSON)

### Task 3.4: Create FolderStructurePreview Component (Optional)
- [ ] 3.4.1 Create tree view component for folder structure
- [ ] 3.4.2 Display nested folders and files
- [ ] 3.4.3 Add expand/collapse functionality
- [ ] 3.4.4 Show file count per folder

### Task 3.5: Integrate with Main Application
- [ ] 3.5.1 Add "Batch Upload" button to main UI
- [ ] 3.5.2 Connect button to BatchUploadModal
- [ ] 3.5.3 Refresh gallery after successful batch upload
- [ ] 3.5.4 Show toast notifications for upload events
- [ ] 3.5.5 Handle authentication requirements

## Phase 4: Testing

### Task 4.1: Unit Tests for FileScanner
- [ ] 4.1.1 Test format filtering with mixed file types
- [ ] 4.1.2 Test size validation (files over 10MB)
- [ ] 4.1.3 Test empty folder handling
- [ ] 4.1.4 Test single file folder
- [ ] 4.1.5 Test deeply nested folder structures
- [ ] 4.1.6 Test invalid/unreadable files

### Task 4.2: Unit Tests for UploadManager
- [ ] 4.2.1 Test task creation for file list
- [ ] 4.2.2 Test concurrency limit enforcement
- [ ] 4.2.3 Test retry logic (success after retries)
- [ ] 4.2.4 Test retry exhaustion (permanent failure)
- [ ] 4.2.5 Test pause/resume functionality
- [ ] 4.2.6 Test cancel functionality
- [ ] 4.2.7 Test progress calculation accuracy
- [ ] 4.2.8 Test batch retry functionality

### Task 4.3: Property-Based Tests
- [ ] 4.3.1 Property 1: Recursive folder scanning completeness
- [ ] 4.3.2 Property 2: File count display accuracy
- [ ] 4.3.3 Property 3: Format filtering correctness
- [ ] 4.3.4 Property 4: Task creation completeness
- [ ] 4.3.5 Property 5: Concurrency limit enforcement
- [ ] 4.3.6 Property 6: Task completion state transition
- [ ] 4.3.7 Property 7: Folder structure preservation
- [ ] 4.3.8 Property 8: Progress display accuracy
- [ ] 4.3.9 Property 9: Upload speed calculation
- [ ] 4.3.10 Property 10: Task status display accuracy
- [ ] 4.3.11 Property 11: Summary accuracy
- [ ] 4.3.12 Property 12: Failure handling with error recording
- [ ] 4.3.13 Property 13: Retry logic with failure list
- [ ] 4.3.14 Property 14: Batch retry functionality
- [ ] 4.3.15 Property 15: File validation rules
- [ ] 4.3.16 Property 16: Invalid file exclusion with logging
- [ ] 4.3.17 Property 17: Readable file verification
- [ ] 4.3.18 Property 18: Resume functionality
- [ ] 4.3.19 Property 19: Cancel with cleanup
- [ ] 4.3.20 Property 20: Metadata persistence completeness
- [ ] 4.3.21 Property 21: Folder structure round-trip
- [ ] 4.3.22 Property 22: Database failure recovery

### Task 4.4: Integration Tests
- [ ] 4.4.1 Test complete upload workflow (scan → upload → verify)
- [ ] 4.4.2 Test error handling with database failures
- [ ] 4.4.3 Test error handling with network failures
- [ ] 4.4.4 Test folder structure reconstruction from database
- [ ] 4.4.5 Test concurrent batch uploads (if supported)

### Task 4.5: Component Tests
- [ ] 4.5.1 Test BatchUploadModal rendering and interactions
- [ ] 4.5.2 Test UploadProgressPanel updates
- [ ] 4.5.3 Test ErrorSummary display and retry actions
- [ ] 4.5.4 Test folder input and file selection
- [ ] 4.5.5 Test authentication requirements

## Phase 5: Documentation and Polish

### Task 5.1: User Documentation
- [ ] 5.1.1 Write user guide for batch upload feature
- [ ] 5.1.2 Document supported file formats and limits
- [ ] 5.1.3 Document error messages and troubleshooting
- [ ] 5.1.4 Add tooltips and help text in UI

### Task 5.2: Developer Documentation
- [ ] 5.2.1 Document FileScanner API
- [ ] 5.2.2 Document UploadManager API
- [ ] 5.2.3 Document component props and usage
- [ ] 5.2.4 Add code examples for common scenarios
- [ ] 5.2.5 Document database schema changes

### Task 5.3: Performance Optimization
- [ ] 5.3.1 Profile upload performance with large batches
- [ ] 5.3.2 Optimize file scanning for large folders
- [ ] 5.3.3 Implement virtual scrolling for large file lists
- [ ] 5.3.4 Add memory usage monitoring
- [ ] 5.3.5 Optimize progress update frequency

### Task 5.4: Accessibility
- [ ] 5.4.1 Add ARIA labels to all interactive elements
- [ ] 5.4.2 Ensure keyboard navigation works
- [ ] 5.4.3 Add screen reader announcements for progress updates
- [ ] 5.4.4 Test with screen readers
- [ ] 5.4.5 Ensure color contrast meets WCAG standards

### Task 5.5: Error Recovery and Edge Cases
- [ ] 5.5.1 Handle browser tab close during upload
- [ ] 5.5.2 Handle network disconnection and reconnection
- [ ] 5.5.3 Handle storage quota exceeded
- [ ] 5.5.4 Handle very large folders (1000+ files)
- [ ] 5.5.5 Add upload resume after page refresh (optional)

## Phase 6: Deployment

### Task 6.1: Pre-Deployment Checklist
- [ ] 6.1.1 Run all tests and ensure they pass
- [ ] 6.1.2 Verify database migration in staging
- [ ] 6.1.3 Test with production-like data volumes
- [ ] 6.1.4 Review security implications
- [ ] 6.1.5 Update API documentation

### Task 6.2: Deployment
- [ ] 6.2.1 Deploy database migration to production
- [ ] 6.2.2 Deploy backend changes
- [ ] 6.2.3 Deploy frontend changes
- [ ] 6.2.4 Verify feature works in production
- [ ] 6.2.5 Monitor error logs for issues

### Task 6.3: Post-Deployment
- [ ] 6.3.1 Monitor upload success rates
- [ ] 6.3.2 Monitor performance metrics
- [ ] 6.3.3 Gather user feedback
- [ ] 6.3.4 Create follow-up tasks for improvements
- [ ] 6.3.5 Update changelog and release notes

## Notes

### Dependencies
- Phase 2 depends on Phase 1 (backend extensions must be complete)
- Phase 3 depends on Phase 2 (UI needs core logic)
- Phase 4 can run in parallel with Phase 3 (test as you build)
- Phase 5 can start after Phase 3 core is complete
- Phase 6 requires all previous phases complete

### Priority
- **High Priority**: Tasks 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.3 (property tests)
- **Medium Priority**: Tasks 2.3, 3.3, 4.1, 4.2, 4.4, 5.1, 5.2
- **Low Priority**: Tasks 1.3, 3.4, 5.3, 5.4, 5.5 (nice-to-have enhancements)

### Estimated Effort
- Phase 1: 4-6 hours
- Phase 2: 12-16 hours
- Phase 3: 16-20 hours
- Phase 4: 20-24 hours
- Phase 5: 8-12 hours
- Phase 6: 4-6 hours
- **Total**: 64-84 hours (8-10 working days)
