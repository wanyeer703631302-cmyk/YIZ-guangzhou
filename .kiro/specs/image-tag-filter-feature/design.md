# Design Document: Image Tag Filter Feature

## Overview

The image tag filter feature enables users to organize and filter images using a flexible tagging system. Users can create custom tags, associate them with images, and filter the gallery using single or multiple tags with AND logic (showing only images that have ALL selected tags). The feature is designed for high performance, handling up to 10,000 images with sub-500ms filtering response times.

The system consists of three main layers:
1. **Database Layer**: Tag and AssetTag models (already exist in schema) for persistent storage
2. **API Layer**: RESTful endpoints for tag CRUD operations and filtering logic
3. **Frontend Layer**: React components for tag management UI and filter interface in the bottom-right corner

Key design decisions:
- Use existing Prisma Tag and AssetTag models (no schema changes needed)
- Implement client-side filtering for performance (<200ms for 1000 images)
- Store filter state in localStorage for persistence across sessions
- Use React Context for global filter state management
- Implement optimistic UI updates for responsive user experience

## Architecture

### System Components

```mermaid
graph TB
    subgraph Frontend
        A[FilterButton] --> B[FilterPanel]
        B --> C[TagManager]
        B --> D[TagSelector]
        E[GalleryCanvas] --> F[FilterContext]
        D --> F
    end
    
    subgraph API
        G[/api/tags] --> H[Tag CRUD]
        I[/api/assets] --> J[Asset Filtering]
    end
    
    subgraph Database
        K[(Tag Table)]
        L[(AssetTag Table)]
        M[(Asset Table)]
    end
    
    F --> G
    F --> I
    H --> K
    H --> L
    J --> L
    J --> M
</mermaid>

### Data Flow

1. **Tag Management Flow**:
   - User creates/edits/deletes tag → API validates → Database updates → UI refreshes
   
2. **Image Tagging Flow**:
   - User adds/removes tag from image → API creates/deletes AssetTag record → Database updates → UI updates

3. **Filtering Flow**:
   - User selects tags → FilterContext updates → Client-side filter applies → Gallery re-renders
   - Filter state persists to localStorage
   - On page load, filter state restores from localStorage

### Performance Strategy

- **Client-side filtering**: All assets loaded once, filtering happens in memory
- **Indexed queries**: Database queries use indexes on assetId and tagId
- **Debounced updates**: Tag count updates debounced to prevent excessive re-renders
- **Virtualization**: Gallery uses existing virtualization for large result sets
- **Optimistic updates**: UI updates immediately, rollback on API failure

## Components and Interfaces

### Frontend Components

#### 1. FilterButton Component
**Location**: `app/src/components/FilterButton/FilterButton.tsx`

**Purpose**: Fixed button in bottom-right corner that opens the filter panel

**Props**:
```typescript
interface FilterButtonProps {
  selectedCount: number
  onClick: () => void
}
```

**State**:
- None (controlled by parent)

**Behavior**:
- Displays filter icon with badge showing selected tag count
- Fixed position: bottom-right corner (20px from edges)
- Animated badge when count changes
- Opens FilterPanel on click

#### 2. FilterPanel Component
**Location**: `app/src/components/FilterPanel/FilterPanel.tsx`

**Purpose**: Popup panel displaying all tags with selection controls

**Props**:
```typescript
interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  tags: Tag[]
  selectedTagIds: string[]
  onTagToggle: (tagId: string) => void
  onManageTags: () => void
}
```

**State**:
- Local search filter for tags

**Behavior**:
- Displays scrollable list of tags with checkboxes
- Shows image count for each tag (total and filtered)
- Search bar to filter tag list
- "Manage Tags" button opens TagManager
- Closes on outside click or ESC key

#### 3. TagManager Component
**Location**: `app/src/components/TagManager/TagManager.tsx`

**Purpose**: Modal for creating, editing, and deleting tags

**Props**:
```typescript
interface TagManagerProps {
  isOpen: boolean
  onClose: () => void
}
```

**State**:
- Tag list
- Edit mode state
- Form validation errors

**Behavior**:
- Create new tag with validation (non-empty, unique name)
- Edit existing tag name (updates all associations)
- Delete tag (removes all associations)
- Displays error messages for failed operations
- Optimistic UI updates with rollback on failure

#### 4. TagSelector Component
**Location**: `app/src/components/TagSelector/TagSelector.tsx`

**Purpose**: Component for adding/removing tags from a specific image

**Props**:
```typescript
interface TagSelectorProps {
  assetId: string
  currentTags: Tag[]
  allTags: Tag[]
  onAddTag: (assetId: string, tagId: string) => Promise<void>
  onRemoveTag: (assetId: string, tagId: string) => Promise<void>
}
```

**Behavior**:
- Displays current tags as removable badges
- Dropdown to add new tags
- Prevents duplicate tag associations
- Optimistic updates

### Context

#### FilterContext
**Location**: `app/src/contexts/FilterContext.tsx`

**State**:
```typescript
interface FilterContextState {
  selectedTagIds: string[]
  tags: Tag[]
  filteredAssetIds: string[]
  isLoading: boolean
  toggleTag: (tagId: string) => void
  clearFilters: () => void
  refreshTags: () => Promise<void>
}
```

**Responsibilities**:
- Manage selected tag IDs
- Compute filtered asset IDs based on selected tags
- Persist filter state to localStorage
- Restore filter state on mount
- Provide filter state to all components

### API Endpoints

#### 1. GET /api/tags
**Purpose**: Retrieve all tags with image counts

**Response**:
```typescript
{
  success: boolean
  data: {
    id: string
    name: string
    imageCount: number
    createdAt: string
  }[]
}
```

**Query Logic**:
```sql
SELECT t.id, t.name, COUNT(at.assetId) as imageCount
FROM tags t
LEFT JOIN asset_tags at ON t.id = at.tagId
GROUP BY t.id
ORDER BY t.name ASC
```

#### 2. POST /api/tags
**Purpose**: Create a new tag

**Request Body**:
```typescript
{
  name: string
}
```

**Validation**:
- Name must not be empty
- Name must be unique (case-insensitive)
- Name trimmed of whitespace

**Response**:
```typescript
{
  success: boolean
  data: {
    id: string
    name: string
    createdAt: string
  }
}
```

#### 3. PUT /api/tags/:id
**Purpose**: Update tag name

**Request Body**:
```typescript
{
  name: string
}
```

**Validation**:
- Same as POST
- Tag must exist

**Response**:
```typescript
{
  success: boolean
  data: {
    id: string
    name: string
    createdAt: string
  }
}
```

#### 4. DELETE /api/tags/:id
**Purpose**: Delete tag and all associations

**Response**:
```typescript
{
  success: boolean
}
```

**Side Effects**:
- Deletes all AssetTag records for this tag
- Cascading delete handled by database

#### 5. POST /api/assets/:assetId/tags
**Purpose**: Add tag to asset

**Request Body**:
```typescript
{
  tagId: string
}
```

**Validation**:
- Asset must exist
- Tag must exist
- Prevents duplicate associations

**Response**:
```typescript
{
  success: boolean
  data: {
    assetId: string
    tagId: string
  }
}
```

#### 6. DELETE /api/assets/:assetId/tags/:tagId
**Purpose**: Remove tag from asset

**Response**:
```typescript
{
  success: boolean
}
```

#### 7. GET /api/assets (Enhanced)
**Purpose**: Get assets with optional tag filtering

**Query Parameters**:
```typescript
{
  tagIds?: string[] // Array of tag IDs (AND logic)
  userId?: string
}
```

**Query Logic** (when tagIds provided):
```sql
SELECT a.*
FROM assets a
WHERE a.id IN (
  SELECT at.assetId
  FROM asset_tags at
  WHERE at.tagId IN (tagIds)
  GROUP BY at.assetId
  HAVING COUNT(DISTINCT at.tagId) = LENGTH(tagIds)
)
```

**Response**:
```typescript
{
  success: boolean
  data: {
    id: string
    title: string
    url: string
    thumbnailUrl: string
    tags: { id: string, name: string }[]
    // ... other asset fields
  }[]
}
```

## Data Models

### Existing Models (No Changes Needed)

The database schema already includes the necessary models:

#### Tag Model
```prisma
model Tag {
  id        String   @id @default(cuid())
  name      String   @unique
  createdAt DateTime @default(now())
  assets    AssetTag[]
  @@map("tags")
}
```

#### AssetTag Model (Junction Table)
```prisma
model AssetTag {
  assetId String
  tagId   String
  asset   Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)
  tag     Tag   @relation(fields: [tagId], references: [id], onDelete: Cascade)
  @@id([assetId, tagId])
  @@map("asset_tags")
}
```

#### Asset Model (Already has tags relation)
```prisma
model Asset {
  // ... existing fields
  tags AssetTag[]
  // ...
}
```

### Type Definitions

**Frontend Types** (`app/src/types/tags.ts`):
```typescript
export interface Tag {
  id: string
  name: string
  imageCount?: number
  createdAt: string
}

export interface AssetTag {
  assetId: string
  tagId: string
}

export interface TagWithCount extends Tag {
  totalCount: number
  filteredCount: number
}
```

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Tag Management Properties

#### Property 1: Tag Creation with Unique Names
*For any* tag name that is non-empty and not already in use, creating a tag with that name should succeed and the tag should be retrievable by its ID.

**Validates: Requirements 1.1, 1.2**

#### Property 2: Empty Tag Name Rejection
*For any* string composed entirely of whitespace characters, attempting to create a tag with that name should fail with a validation error.

**Validates: Requirements 1.2**

#### Property 3: Tag Name Edit Propagation
*For any* existing tag with associated images, editing the tag name should result in all image associations reflecting the new tag name when queried.

**Validates: Requirements 1.4, 1.5**

#### Property 4: Tag Deletion Cascade
*For any* tag with associated images, deleting the tag should result in zero associations remaining for that tag ID in the database.

**Validates: Requirements 1.6, 1.7**

#### Property 5: Tag Persistence Round Trip
*For any* tag created in the system, the tag should be retrievable after simulating a session restart (new database connection).

**Validates: Requirements 1.8**

### Image-Tag Association Properties

#### Property 6: Multiple Tag Association
*For any* image and any set of tags, adding all tags to the image should result in the image having exactly those tag associations.

**Validates: Requirements 2.1, 2.5**

#### Property 7: Tag Association Removal
*For any* image with multiple tags, removing a specific tag should result in that tag no longer being associated with the image while other tags remain.

**Validates: Requirements 2.2**

#### Property 8: Duplicate Association Prevention
*For any* image and tag, attempting to add the same tag to the image twice should result in only one association existing.

**Validates: Requirements 2.6**

### Filter UI Properties

#### Property 9: Tag Selection State Consistency
*For any* set of selected tags, the filter UI should display all and only those tags as selected, and the filter button should show the correct count.

**Validates: Requirements 3.4, 3.6**

#### Property 10: All Tags Displayed
*For any* set of tags in the system, opening the filter panel should display all tags as selectable options.

**Validates: Requirements 3.2, 3.3**

### Filtering Logic Properties

#### Property 11: Single Tag Filter Correctness
*For any* tag and any set of images, selecting that tag should result in the gallery displaying all and only those images that have that tag associated.

**Validates: Requirements 4.1**

#### Property 12: Multi-Tag AND Filter Correctness
*For any* set of selected tags and any set of images, the gallery should display all and only those images that have ALL of the selected tags associated (AND logic).

**Validates: Requirements 5.2**

#### Property 13: Clear Filter Restoration
*For any* filter state with selected tags, deselecting all tags should result in the gallery displaying all images in the system.

**Validates: Requirements 4.4, 5.5**

### Filter State Persistence Properties

#### Property 14: Filter State Round Trip
*For any* set of selected tags, persisting the filter state to localStorage and then restoring it (simulating page refresh) should result in the same tags being selected.

**Validates: Requirements 7.1, 7.2**

#### Property 15: Navigation State Preservation
*For any* filter state, navigating away from the gallery and returning should result in the same filter state being active.

**Validates: Requirements 6.4**

### Tag Count Properties

#### Property 16: Tag Count Accuracy
*For any* tag, the displayed image count should equal the actual number of images associated with that tag in the database.

**Validates: Requirements 8.1**

#### Property 17: Tag Count Update on Association Change
*For any* tag, adding or removing an image association should result in the tag's displayed count updating to reflect the change.

**Validates: Requirements 8.2**

#### Property 18: Filtered Count Accuracy
*For any* active filter state and any tag, the displayed filtered count should equal the number of images that have both that tag AND all selected filter tags.

**Validates: Requirements 8.4**

### Error Handling Properties

#### Property 19: Tag Creation Error Handling
*For any* invalid tag creation attempt (empty name, duplicate name), the system should display an appropriate error message and not create a tag.

**Validates: Requirements 9.1**

#### Property 20: Operation Failure State Preservation
*For any* failed operation (tag deletion, association change), the system should display an error message and maintain the state that existed before the operation was attempted.

**Validates: Requirements 9.2, 9.3**

#### Property 21: Filter Error Fallback
*For any* filtering operation that fails, the system should display an error message and show all images as a safe fallback.

**Validates: Requirements 9.4**

### Performance Properties

#### Property 22: 1000 Image Filter Performance
*For any* set of 1000 images and any filter selection, the filtering operation should complete within 200ms.

**Validates: Requirements 6.1, 10.1**

#### Property 23: 10000 Image Filter Performance
*For any* set of 10000 images and any filter selection, the filtering operation should complete within 500ms.

**Validates: Requirements 10.2**

#### Property 24: 100 Tag Render Performance
*For any* set of 100 tags, rendering the filter panel should complete within 200ms without blocking the UI.

**Validates: Requirements 10.3**

## Error Handling

### Error Categories

1. **Validation Errors** (400 Bad Request)
   - Empty tag name
   - Duplicate tag name
   - Missing required fields
   - Invalid tag/asset IDs

2. **Not Found Errors** (404 Not Found)
   - Tag does not exist
   - Asset does not exist
   - Association does not exist

3. **Conflict Errors** (409 Conflict)
   - Duplicate tag association attempt

4. **Server Errors** (500 Internal Server Error)
   - Database connection failures
   - Unexpected errors during operations

### Error Response Format

All API errors follow this format:
```typescript
{
  success: false,
  error: string // User-friendly error message in Chinese
}
```

### Frontend Error Handling

1. **Optimistic Updates with Rollback**:
   - UI updates immediately on user action
   - If API call fails, revert to previous state
   - Display error toast notification

2. **Error Toast Messages**:
   - Use existing toast system (sonner)
   - Display for 3 seconds
   - Include actionable information when possible

3. **Graceful Degradation**:
   - If tag loading fails, show empty tag list with retry button
   - If filtering fails, show all images
   - If count loading fails, show "—" instead of count

4. **Retry Logic**:
   - Automatic retry for network errors (max 2 retries)
   - Manual retry button for persistent failures
   - Exponential backoff for retries

### Error Logging

All errors logged to console with:
- Timestamp
- Operation type
- Error message
- Stack trace (in development)
- User ID (if authenticated)

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property-based tests**: Verify universal properties across all inputs using randomized test data

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property-based tests verify general correctness across a wide range of inputs.

### Property-Based Testing

**Library**: `fast-check` (already installed in the project)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with comment referencing design property
- Tag format: `// Feature: image-tag-filter-feature, Property {number}: {property_text}`

**Test Organization**:
```
api/__tests__/
  tags.property.test.ts          # Tag CRUD properties
  asset-tags.property.test.ts    # Association properties
  filtering.property.test.ts     # Filter logic properties

app/src/__tests__/
  FilterContext.property.test.tsx    # Filter state properties
  TagManager.property.test.tsx       # Tag management UI properties
  FilterPanel.property.test.tsx      # Filter UI properties
```

**Example Property Test Structure**:
```typescript
import fc from 'fast-check'

// Feature: image-tag-filter-feature, Property 1: Tag Creation with Unique Names
describe('Tag Creation Properties', () => {
  it('should create tags with unique non-empty names', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        async (tagName) => {
          const tag = await createTag(tagName.trim())
          expect(tag).toBeDefined()
          expect(tag.name).toBe(tagName.trim())
          
          const retrieved = await getTagById(tag.id)
          expect(retrieved.name).toBe(tagName.trim())
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Unit Testing

**Focus Areas**:
1. **Specific Examples**:
   - Creating a tag named "设计"
   - Filtering with tags ["摄影", "风景"]
   - Empty state when no images match filter

2. **Edge Cases**:
   - Tag with zero associated images
   - Image with maximum number of tags
   - Empty tag list
   - Empty image list
   - Filter panel with no tags

3. **Error Conditions**:
   - Network timeout during tag creation
   - Database constraint violation
   - Invalid JSON response
   - Concurrent modification conflicts

4. **Integration Points**:
   - FilterContext integration with API
   - TagManager integration with FilterContext
   - Gallery re-render on filter change

**Test Organization**:
```
api/__tests__/
  tags.test.ts              # Tag CRUD unit tests
  asset-tags.test.ts        # Association unit tests

app/src/__tests__/
  FilterButton.test.tsx     # FilterButton component tests
  FilterPanel.test.tsx      # FilterPanel component tests
  TagManager.test.tsx       # TagManager component tests
  TagSelector.test.tsx      # TagSelector component tests
  FilterContext.test.tsx    # FilterContext unit tests
```

### Performance Testing

**Tools**: 
- `vitest` with performance benchmarks
- Browser DevTools Performance profiler

**Test Cases**:
1. Filter 1000 images with single tag (target: <200ms)
2. Filter 10000 images with multiple tags (target: <500ms)
3. Render 100 tags in filter panel (target: <200ms)
4. Update tag counts after association change (target: <100ms)

**Performance Test Structure**:
```typescript
describe('Filter Performance', () => {
  it('should filter 1000 images within 200ms', async () => {
    const images = generateRandomImages(1000)
    const tag = createTag('test')
    
    const start = performance.now()
    const filtered = filterImagesByTags(images, [tag.id])
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(200)
  })
})
```

### Test Data Generation

**Generators for Property Tests**:
```typescript
// Tag name generator
const tagNameArb = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0)

// Tag generator
const tagArb = fc.record({
  id: fc.uuid(),
  name: tagNameArb,
  createdAt: fc.date()
})

// Asset generator
const assetArb = fc.record({
  id: fc.uuid(),
  title: fc.string(),
  url: fc.webUrl(),
  thumbnailUrl: fc.webUrl(),
  tags: fc.array(tagArb, { maxLength: 20 })
})

// Filter state generator
const filterStateArb = fc.record({
  selectedTagIds: fc.array(fc.uuid(), { maxLength: 10 })
})
```

### Coverage Goals

- **Line Coverage**: >80% for all new code
- **Branch Coverage**: >75% for all new code
- **Property Coverage**: 100% of correctness properties tested
- **Edge Case Coverage**: All identified edge cases tested

### Continuous Integration

All tests run on:
- Pre-commit hook (unit tests only)
- Pull request (all tests)
- Main branch merge (all tests + performance tests)

Performance tests fail the build if targets are not met.
