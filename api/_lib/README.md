# Shared Library Modules

This directory contains shared utility modules used across the application.

## Authentication Module (`auth.ts`)

The authentication module provides JWT-based authentication utilities for protecting API endpoints and managing user sessions.

### Features

- **JWT Token Generation**: Create secure JWT tokens with configurable expiration
- **Authentication Middleware**: Express middleware for protecting API routes
- **Token Verification**: Automatic token validation and user ID extraction
- **Error Handling**: Standardized error responses for authentication failures

### Usage

#### Generating Tokens

```typescript
import { generateToken } from '../lib/auth'

// After successful login/registration
const userId = 'user-123'
const token = generateToken(userId)

// Return token to client
res.json({
  success: true,
  data: {
    user: userData,
    token: token
  }
})
```

#### Protecting API Endpoints

```typescript
import express from 'express'
import { withAuth, AuthRequest } from '../lib/auth'

const app = express()

// Protected route - requires authentication
app.get('/api/user/profile', withAuth, (req: AuthRequest, res) => {
  // Access authenticated user ID
  const userId = req.userId
  
  // Fetch user data
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  
  res.json({ success: true, data: user })
})

// Protected POST route
app.post('/api/likes', withAuth, async (req: AuthRequest, res) => {
  const userId = req.userId
  const { assetId } = req.body
  
  const like = await prisma.like.create({
    data: {
      userId,
      assetId
    }
  })
  
  res.json({ success: true, data: like })
})
```

#### Client-Side Token Usage

```typescript
// Store token after login
localStorage.setItem('auth_token', token)

// Include token in API requests
const response = await fetch('/api/user/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
})
```

### Environment Variables

The authentication module requires:

- `JWT_SECRET`: Secret key for signing JWT tokens (use a strong, random string in production)

Example `.env`:
```
JWT_SECRET=your-super-secret-key-change-this-in-production
```

### Token Configuration

- **Expiration**: Tokens expire after 7 days
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Payload**: Contains `userId` field

### Error Responses

The middleware returns standardized error responses:

**Missing Token (401)**:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Invalid Token (401)**:
```json
{
  "success": false,
  "error": "Invalid token"
}
```

### Security Best Practices

1. **Use strong JWT secrets**: Generate a random, long secret key for production
2. **Use HTTPS**: Always transmit tokens over HTTPS in production
3. **Store tokens securely**: Use httpOnly cookies or secure localStorage
4. **Implement token refresh**: Consider implementing refresh tokens for long-lived sessions
5. **Validate on every request**: The middleware automatically validates tokens on protected routes
6. **Handle token expiration**: Implement client-side logic to handle expired tokens

### Testing

The module includes comprehensive unit tests:

```bash
npm test -- lib/__tests__/auth.test.ts
```

Tests cover:
- Token generation with correct userId
- Token expiration (7 days)
- Middleware rejection of missing tokens
- Middleware rejection of invalid tokens
- Middleware acceptance of valid tokens
- UserId extraction from tokens

## Prisma Client (`prisma.ts`)

The Prisma client module provides a singleton instance of the Prisma Client with proper connection pool management and error handling.

### Features

- **Singleton Pattern**: Ensures only one Prisma Client instance exists
- **Connection Pool Management**: Optimized connection pooling for performance
- **Error Handling**: Comprehensive error handling for database operations
- **Development Support**: Hot-reload support in development mode
- **Logging**: Query logging in development, error-only logging in production

### Usage

#### Basic Usage

```typescript
import prisma from '../lib/prisma'

// Query users
const users = await prisma.user.findMany()

// Create a new asset
const asset = await prisma.asset.create({
  data: {
    title: 'My Image',
    url: 'https://example.com/image.jpg',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    size: 1024,
    userId: 'user-id',
  },
})
```

#### Testing Database Connection

```typescript
import { testDatabaseConnection } from '../lib/prisma'

const isConnected = await testDatabaseConnection()
if (!isConnected) {
  console.error('Database connection failed')
}
```

#### Getting Database Status

```typescript
import { getDatabaseStatus } from '../lib/prisma'

const status = await getDatabaseStatus()
console.log('Database connected:', status.connected)
if (status.error) {
  console.error('Error:', status.error)
}
```

#### Graceful Shutdown

```typescript
import { disconnectDatabase } from '../lib/prisma'

// Call this when shutting down your application
process.on('SIGTERM', async () => {
  await disconnectDatabase()
  process.exit(0)
})
```

### Environment Variables

The Prisma client requires the following environment variable:

- `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://user:password@localhost:5432/dbname`)

### Connection Pool Configuration

The Prisma client is configured with optimal connection pool settings:

- **Development**: Query logging enabled for debugging
- **Production**: Error-only logging for performance

### Error Handling

All database operations should be wrapped in try-catch blocks:

```typescript
import prisma from '../lib/prisma'

try {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })
  
  if (!user) {
    throw new Error('User not found')
  }
  
  return user
} catch (error) {
  console.error('Database error:', error)
  throw error
}
```

### Best Practices

1. **Always use the singleton instance**: Import from `lib/prisma` instead of creating new instances
2. **Handle errors gracefully**: Wrap database operations in try-catch blocks
3. **Use transactions for related operations**: Use `prisma.$transaction()` for atomic operations
4. **Close connections on shutdown**: Call `disconnectDatabase()` when shutting down
5. **Test connections on startup**: Use `testDatabaseConnection()` to verify database availability

### Related Files

- `prisma/schema.prisma`: Database schema definition
- `.env.example`: Environment variable template
- `api/health.ts`: Health check endpoint that uses database status

## Cloudinary Module (`cloudinary.ts`)

The Cloudinary module provides configuration and helper functions for image upload and management using Cloudinary's cloud storage service.

### Features

- **Cloudinary Client Configuration**: Automatic configuration from environment variables
- **Image Upload**: Upload images from Buffer or Data URI
- **URL Optimization**: Generate optimized and thumbnail URLs
- **Configuration Validation**: Check if Cloudinary is properly configured
- **Image Deletion**: Delete images from Cloudinary storage

### Usage

#### Checking Configuration

```typescript
import { isCloudinaryConfigured } from '../lib/cloudinary'

if (!isCloudinaryConfigured()) {
  console.error('Cloudinary is not configured')
  return res.status(500).json({
    success: false,
    error: 'Cloudinary未配置，请检查环境变量'
  })
}
```

#### Uploading Images from Buffer

```typescript
import { uploadImage } from '../lib/cloudinary'

// Convert file to buffer
const arrayBuffer = await file.arrayBuffer()
const buffer = Buffer.from(arrayBuffer)

// Upload to Cloudinary
try {
  const result = await uploadImage(buffer, {
    folder: 'pincollect',
    resourceType: 'auto'
  })
  
  console.log('Upload successful:', result.secure_url)
  console.log('Image dimensions:', result.width, 'x', result.height)
  console.log('File size:', result.bytes)
} catch (error) {
  console.error('Upload failed:', error)
}
```

#### Uploading Images from Data URI (Fallback)

```typescript
import { uploadImageFromDataUri } from '../lib/cloudinary'

// Create data URI from buffer
const mime = file.type || 'application/octet-stream'
const b64 = buffer.toString('base64')
const dataUri = `data:${mime};base64,${b64}`

// Upload using data URI
const result = await uploadImageFromDataUri(dataUri, {
  folder: 'pincollect'
})
```

#### Generating Thumbnail URLs

```typescript
import { generateThumbnailUrl } from '../lib/cloudinary'

const originalUrl = 'https://res.cloudinary.com/demo/upload/sample.jpg'

// Generate 400px wide thumbnail (default)
const thumbnail = generateThumbnailUrl(originalUrl)
// Result: https://res.cloudinary.com/demo/upload/f_auto,q_auto,c_thumb,w_400/sample.jpg

// Generate custom width thumbnail
const largeThumbnail = generateThumbnailUrl(originalUrl, 800)
// Result: https://res.cloudinary.com/demo/upload/f_auto,q_auto,c_thumb,w_800/sample.jpg
```

#### Optimizing Cloudinary URLs

```typescript
import { optimizeCloudinaryUrl } from '../lib/cloudinary'

const originalUrl = 'https://res.cloudinary.com/demo/upload/sample.jpg'
const optimizedUrl = optimizeCloudinaryUrl(originalUrl)
// Result: https://res.cloudinary.com/demo/upload/f_auto,q_auto/sample.jpg
```

#### Deleting Images

```typescript
import { deleteImage } from '../lib/cloudinary'

// Extract public ID from URL or use stored public ID
const publicId = 'pincollect/image123'

try {
  const result = await deleteImage(publicId)
  console.log('Image deleted:', result)
} catch (error) {
  console.error('Delete failed:', error)
}
```

#### Using the Cloudinary Instance Directly

```typescript
import { cloudinary } from '../lib/cloudinary'

// Access the configured cloudinary instance for advanced operations
const result = await cloudinary.api.resources({
  type: 'upload',
  prefix: 'pincollect/',
  max_results: 30
})
```

### Environment Variables

The Cloudinary module requires the following environment variables:

- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

Example `.env`:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Get these credentials from your [Cloudinary Dashboard](https://cloudinary.com/console).

### Upload Options

The `uploadImage` and `uploadImageFromDataUri` functions accept the following options:

- `folder`: Cloudinary folder to store the image (default: 'pincollect')
- `resourceType`: Type of resource - 'image', 'video', 'raw', or 'auto' (default: 'auto')
- `transformation`: Array of transformation objects for image manipulation

Example with transformations:
```typescript
const result = await uploadImage(buffer, {
  folder: 'avatars',
  resourceType: 'image',
  transformation: [
    { width: 200, height: 200, crop: 'fill' }
  ]
})
```

### URL Optimization

The module provides two types of URL optimization:

1. **Full Optimization** (`optimizeCloudinaryUrl`):
   - Adds `f_auto` (automatic format selection)
   - Adds `q_auto` (automatic quality optimization)
   - Best for general image display

2. **Thumbnail Generation** (`generateThumbnailUrl`):
   - Adds `f_auto` and `q_auto`
   - Adds `c_thumb` (thumbnail crop mode)
   - Adds `w_XXX` (width specification)
   - Best for generating thumbnails

### Error Handling

All upload and delete operations throw errors if Cloudinary is not configured:

```typescript
try {
  const result = await uploadImage(buffer)
} catch (error) {
  if (error.message.includes('未配置')) {
    // Handle configuration error
    return res.status(500).json({
      success: false,
      error: 'Cloudinary未配置，请检查环境变量'
    })
  }
  // Handle other errors
  return res.status(500).json({
    success: false,
    error: '上传失败'
  })
}
```

### Best Practices

1. **Always check configuration**: Use `isCloudinaryConfigured()` before operations
2. **Use appropriate folders**: Organize images in folders (e.g., 'avatars', 'covers', 'pincollect')
3. **Generate thumbnails**: Use `generateThumbnailUrl()` for list views to improve performance
4. **Optimize URLs**: Use `optimizeCloudinaryUrl()` for automatic format and quality optimization
5. **Handle upload failures**: Implement fallback to Data URI upload if stream upload fails
6. **Store public IDs**: Save Cloudinary public IDs in your database for easy deletion

### Testing

The module includes comprehensive unit tests:

```bash
npm test -- lib/__tests__/cloudinary.test.ts
```

Tests cover:
- Configuration validation with various environment variable combinations
- Thumbnail URL generation with default and custom widths
- URL optimization for Cloudinary URLs
- Handling of non-Cloudinary URLs
- Edge cases (empty URLs, already optimized URLs)

### Related Files

- `.env.example`: Environment variable template with Cloudinary configuration
- `api/upload.ts`: Upload endpoint that uses Cloudinary module
- `api/health.ts`: Health check endpoint that verifies Cloudinary configuration
