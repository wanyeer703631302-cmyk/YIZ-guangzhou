# Tasks: User Profile Sidebar

## 1. Database Schema Updates
- [ ] 1.1 Add `avatar` field to User model in Prisma schema
- [ ] 1.2 Create and run database migration
- [ ] 1.3 Update TypeScript types in `app/src/types/api.ts`

## 2. Backend API Development
- [ ] 2.1 Create PUT /api/user/profile endpoint
  - [ ] 2.1.1 Implement authentication verification
  - [ ] 2.1.2 Implement nickname validation
  - [ ] 2.1.3 Implement database update logic
  - [ ] 2.1.4 Implement error handling
- [ ] 2.2 Create POST /api/user/avatar endpoint
  - [ ] 2.2.1 Configure multer for file upload
  - [ ] 2.2.2 Implement file validation (format and size)
  - [ ] 2.2.3 Implement Cloudinary upload integration
  - [ ] 2.2.4 Implement database update logic
  - [ ] 2.2.5 Implement error handling
- [ ] 2.3 Extend GET /api/favorites endpoint
  - [ ] 2.3.1 Add pagination parameters support
  - [ ] 2.3.2 Implement query with pagination
  - [ ] 2.3.3 Return total count and pagination metadata

## 3. API Client Extensions
- [ ] 3.1 Add `updateProfile()` method to ApiClient
- [ ] 3.2 Add `uploadAvatar()` method to ApiClient
- [ ] 3.3 Add `getFavorites()` method with pagination support
- [ ] 3.4 Update TypeScript interfaces for new API responses

## 4. Frontend Components Development
- [ ] 4.1 Create AvatarUploader component
  - [ ] 4.1.1 Implement file input and selection
  - [ ] 4.1.2 Implement file validation (format and size)
  - [ ] 4.1.3 Implement preview generation using FileReader
  - [ ] 4.1.4 Implement circular preview styling
  - [ ] 4.1.5 Implement confirm/cancel actions
  - [ ] 4.1.6 Implement upload progress indication
  - [ ] 4.1.7 Implement error message display
- [ ] 4.2 Create NicknameEditor component
  - [ ] 4.2.1 Implement controlled input field
  - [ ] 4.2.2 Implement real-time validation
  - [ ] 4.2.3 Implement save/cancel actions
  - [ ] 4.2.4 Implement keyboard support (Enter to save, Escape to cancel)
  - [ ] 4.2.5 Implement error message display
  - [ ] 4.2.6 Implement loading state during save
- [ ] 4.3 Create FavoritesList component
  - [ ] 4.3.1 Implement favorites data fetching
  - [ ] 4.3.2 Implement infinite scroll with pagination
  - [ ] 4.3.3 Implement favorite item rendering (thumbnail, title, date)
  - [ ] 4.3.4 Implement empty state display
  - [ ] 4.3.5 Implement loading state
  - [ ] 4.3.6 Implement click navigation to image detail
- [ ] 4.4 Extend UserSidebar component
  - [ ] 4.4.1 Integrate AvatarUploader component
  - [ ] 4.4.2 Integrate NicknameEditor component
  - [ ] 4.4.3 Integrate FavoritesList component
  - [ ] 4.4.4 Implement edit mode state management
  - [ ] 4.4.5 Implement success/error toast notifications
  - [ ] 4.4.6 Update layout and styling

## 5. Validation Logic
- [ ] 5.1 Create file validation utility functions
  - [ ] 5.1.1 Implement `validateFileFormat()` function
  - [ ] 5.1.2 Implement `validateFileSize()` function
  - [ ] 5.1.3 Implement `validateAvatarFile()` combined function
- [ ] 5.2 Create nickname validation utility function
  - [ ] 5.2.1 Implement `validateNickname()` function
  - [ ] 5.2.2 Add validation error message generation

## 6. Unit Tests
- [ ] 6.1 Write unit tests for validation functions
  - [ ] 6.1.1 Test file format validation with valid formats
  - [ ] 6.1.2 Test file format validation with invalid formats
  - [ ] 6.1.3 Test file size validation with boundary cases
  - [ ] 6.1.4 Test nickname length validation
  - [ ] 6.1.5 Test nickname character validation
- [ ] 6.2 Write unit tests for AvatarUploader component
  - [ ] 6.2.1 Test file selection and preview generation
  - [ ] 6.2.2 Test validation error display
  - [ ] 6.2.3 Test upload confirmation
  - [ ] 6.2.4 Test upload cancellation
- [ ] 6.3 Write unit tests for NicknameEditor component
  - [ ] 6.3.1 Test edit mode activation
  - [ ] 6.3.2 Test validation error display
  - [ ] 6.3.3 Test save action
  - [ ] 6.3.4 Test cancel action
  - [ ] 6.3.5 Test keyboard shortcuts
- [ ] 6.4 Write unit tests for FavoritesList component
  - [ ] 6.4.1 Test favorites loading
  - [ ] 6.4.2 Test empty state display
  - [ ] 6.4.3 Test pagination/infinite scroll
  - [ ] 6.4.4 Test item rendering
- [ ] 6.5 Write unit tests for API client methods
  - [ ] 6.5.1 Test updateProfile() method
  - [ ] 6.5.2 Test uploadAvatar() method
  - [ ] 6.5.3 Test getFavorites() method

## 7. Property-Based Tests
- [ ] 7.1 Write property test for file format validation (Property 1)
- [ ] 7.2 Write property test for file size validation (Property 2)
- [ ] 7.3 Write property test for nickname validation completeness (Property 4)
- [ ] 7.4 Write property test for edit cancellation (Property 6)
- [ ] 7.5 Write property test for favorites chronological ordering (Property 8)
- [ ] 7.6 Write property test for favorite item rendering completeness (Property 9)

## 8. Integration Tests
- [ ] 8.1 Test avatar upload end-to-end flow
  - [ ] 8.1.1 Test successful upload
  - [ ] 8.1.2 Test upload with validation errors
  - [ ] 8.1.3 Test upload with network errors
- [ ] 8.2 Test nickname update end-to-end flow
  - [ ] 8.2.1 Test successful update
  - [ ] 8.2.2 Test update with validation errors
  - [ ] 8.2.3 Test update with network errors
- [ ] 8.3 Test favorites list end-to-end flow
  - [ ] 8.3.1 Test loading favorites
  - [ ] 8.3.2 Test pagination
  - [ ] 8.3.3 Test navigation to image detail

## 9. Error Handling Implementation
- [ ] 9.1 Implement frontend error handling
  - [ ] 9.1.1 Add error message constants
  - [ ] 9.1.2 Implement toast notification system
  - [ ] 9.1.3 Implement error state display in components
- [ ] 9.2 Implement backend error handling
  - [ ] 9.2.1 Add error response formatting
  - [ ] 9.2.2 Implement authentication error handling
  - [ ] 9.2.3 Implement validation error handling
  - [ ] 9.2.4 Implement database error handling
  - [ ] 9.2.5 Implement Cloudinary error handling

## 10. Offline Support
- [ ] 10.1 Implement offline detection
- [ ] 10.2 Implement cached data display
- [ ] 10.3 Implement offline indicator UI
- [ ] 10.4 Disable edit operations in offline mode

## 11. Documentation
- [ ] 11.1 Update API documentation with new endpoints
- [ ] 11.2 Add component usage documentation
- [ ] 11.3 Add validation rules documentation
- [ ] 11.4 Update README with new features

## 12. Manual Testing
- [ ] 12.1 Test animations and transitions
  - [ ] 12.1.1 Test sidebar open/close animation
  - [ ] 12.1.2 Test avatar preview transition
  - [ ] 12.1.3 Test loading state animations
- [ ] 12.2 Test accessibility
  - [ ] 12.2.1 Test keyboard navigation
  - [ ] 12.2.2 Test focus indicators
  - [ ] 12.2.3 Test screen reader compatibility
  - [ ] 12.2.4 Test ARIA labels
- [ ] 12.3 Test visual design
  - [ ] 12.3.1 Test circular avatar cropping
  - [ ] 12.3.2 Test responsive layout
  - [ ] 12.3.3 Test color contrast
  - [ ] 12.3.4 Test font sizes and readability
- [ ] 12.4 Test cross-browser compatibility
  - [ ] 12.4.1 Test on Chrome
  - [ ] 12.4.2 Test on Firefox
  - [ ] 12.4.3 Test on Safari
  - [ ] 12.4.4 Test on Edge
  - [ ] 12.4.5 Test on mobile browsers
- [ ] 12.5 Test performance
  - [ ] 12.5.1 Test large file upload response time
  - [ ] 12.5.2 Test long favorites list scroll performance
  - [ ] 12.5.3 Test memory usage

## 13. Deployment
- [ ] 13.1 Review and merge code
- [ ] 13.2 Run all tests in CI/CD pipeline
- [ ] 13.3 Deploy to staging environment
- [ ] 13.4 Perform smoke testing on staging
- [ ] 13.5 Deploy to production
- [ ] 13.6 Monitor error logs and performance metrics
