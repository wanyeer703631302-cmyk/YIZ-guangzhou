# User API Endpoints

This directory contains user-specific API endpoints.

## Endpoints

### GET /api/user/interactions

Returns all likes and favorites for the authenticated user.

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "data": {
    "likes": [
      {
        "id": "like-id",
        "assetId": "asset-id",
        "userId": "user-id",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "favorites": [
      {
        "id": "favorite-id",
        "assetId": "asset-id",
        "userId": "user-id",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Requirements:** 8.3, 8.8

**Implementation:** `api/user/interactions.ts`
