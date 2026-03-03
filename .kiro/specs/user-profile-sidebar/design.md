# Design Document: User Profile Sidebar

## Overview

用户侧边栏功能扩展现有的 UserSidebar 组件，添加头像上传、昵称编辑和收藏列表管理功能。该设计基于现有的 React + TypeScript + Prisma 技术栈，使用 Radix UI 组件库和 Framer Motion 动画库，遵循项目现有的架构模式。

核心功能包括：
- 头像上传与预览（支持 JPEG、PNG、WebP 格式，最大 5MB）
- 昵称编辑与验证（1-50 字符，支持空格、连字符、下划线）
- 收藏列表展示（分页或无限滚动，按收藏时间倒序）
- 数据持久化到后端数据库
- 优雅的错误处理和离线状态支持

## Architecture

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│  UserSidebar Component                                       │
│  ├── AvatarUploader (头像上传组件)                           │
│  ├── NicknameEditor (昵称编辑组件)                           │
│  └── FavoritesList (收藏列表组件)                            │
├─────────────────────────────────────────────────────────────┤
│  API Client (services/api.ts)                                │
│  ├── updateProfile()                                         │
│  ├── uploadAvatar()                                          │
│  └── getFavorites()                                          │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Vercel)                         │
├─────────────────────────────────────────────────────────────┤
│  API Routes                                                  │
│  ├── PUT /api/user/profile (更新昵称)                        │
│  ├── POST /api/user/avatar (上传头像)                        │
│  └── GET /api/favorites (获取收藏列表)                       │
├─────────────────────────────────────────────────────────────┤
│  Cloudinary Integration (头像存储)                           │
│  Prisma ORM (数据库访问)                                     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                         │
│  ├── users (用户信息，包含 avatar 字段)                      │
│  └── favorites (收藏记录)                                    │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈

- **Frontend**: React 19, TypeScript, Vite
- **UI Components**: Radix UI, Tailwind CSS
- **Animation**: Framer Motion
- **State Management**: React Context (AuthContext)
- **Backend**: Vercel Serverless Functions
- **Database**: PostgreSQL + Prisma ORM
- **File Storage**: Cloudinary (头像图片存储)
- **Testing**: Vitest + fast-check (property-based testing)

## Components and Interfaces

### 1. Frontend Components

#### UserSidebar (扩展现有组件)

现有组件位于 `app/src/components/UserSidebar/UserSidebar.tsx`，需要扩展以下功能：

```typescript
interface UserSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// 扩展后的组件结构
export const UserSidebar = ({ isOpen, onClose }: UserSidebarProps) => {
  // 现有状态
  const { user, isAuthenticated, logout } = useAuth();
  
  // 新增状态
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // 组件渲染：
  // - 头像显示/上传区域
  // - 昵称显示/编辑区域
  // - 收藏列表入口
  // - 登出按钮
};
```

#### AvatarUploader (新组件)

```typescript
interface AvatarUploaderProps {
  currentAvatar?: string;
  onUploadSuccess: (avatarUrl: string) => void;
  onUploadError: (error: string) => void;
}

export const AvatarUploader = ({
  currentAvatar,
  onUploadSuccess,
  onUploadError
}: AvatarUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 文件选择处理
  const handleFileSelect = (file: File) => {
    // 验证文件格式
    // 验证文件大小
    // 生成预览
  };
  
  // 上传确认
  const handleConfirmUpload = async () => {
    // 调用 API 上传
    // 处理成功/失败
  };
  
  // 取消上传
  const handleCancelUpload = () => {
    // 清除预览
    // 恢复原头像
  };
};
```

**实现细节**：
- 使用 `<input type="file" accept="image/jpeg,image/png,image/webp" />` 选择文件
- 使用 `FileReader` API 生成本地预览
- 使用 CSS `border-radius: 50%` 实现圆形裁剪预览
- 文件大小验证：`file.size <= 5 * 1024 * 1024` (5MB)
- 格式验证：检查 `file.type` 是否为 `image/jpeg`、`image/png` 或 `image/webp`

#### NicknameEditor (新组件)

```typescript
interface NicknameEditorProps {
  currentNickname: string;
  onSave: (newNickname: string) => Promise<void>;
  onCancel: () => void;
}

export const NicknameEditor = ({
  currentNickname,
  onSave,
  onCancel
}: NicknameEditorProps) => {
  const [nickname, setNickname] = useState(currentNickname);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // 验证昵称
  const validateNickname = (value: string): string | null => {
    if (value.length < 1 || value.length > 50) {
      return '昵称长度必须在 1-50 个字符之间';
    }
    if (!/^[a-zA-Z0-9\u4e00-\u9fa5\s_-]+$/.test(value)) {
      return '昵称只能包含字母、数字、中文、空格、连字符和下划线';
    }
    return null;
  };
  
  // 保存处理
  const handleSave = async () => {
    const validationError = validateNickname(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(nickname);
    } catch (err) {
      setError('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };
};
```

**实现细节**：
- 使用受控输入组件 `<input value={nickname} onChange={...} />`
- 实时验证：在 `onChange` 时显示验证错误
- 键盘支持：Enter 保存，Escape 取消
- 使用 Radix UI 的 Input 组件保持样式一致性

#### FavoritesList (新组件)

```typescript
interface FavoritesListProps {
  onClose: () => void;
}

export const FavoritesList = ({ onClose }: FavoritesListProps) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // 加载收藏列表
  const loadFavorites = async (pageNum: number) => {
    setIsLoading(true);
    const response = await apiClient.getFavorites({ page: pageNum, limit: 20 });
    if (response.success && response.data) {
      setFavorites(prev => [...prev, ...response.data.items]);
      setHasMore(response.data.items.length === 20);
    }
    setIsLoading(false);
  };
  
  // 无限滚动
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
  };
  
  // 点击图片导航
  const handleImageClick = (assetId: string) => {
    // 导航到图片详情页
    onClose();
  };
};

interface FavoriteItem {
  id: string;
  asset: {
    id: string;
    title: string;
    thumbnailUrl: string;
  };
  createdAt: string;
}
```

**实现细节**：
- 使用无限滚动而非分页按钮（更好的用户体验）
- 每次加载 20 条记录
- 显示缩略图（使用 `thumbnailUrl`）、标题和收藏时间
- 空状态：显示 "暂无收藏" 提示
- 使用 Radix UI 的 ScrollArea 组件

### 2. API Client Extensions

扩展 `app/src/services/api.ts`：

```typescript
class ApiClient {
  // 现有方法...
  
  /**
   * 更新用户资料（昵称）
   */
  async updateProfile(data: { name: string }): Promise<ApiResponse<User>> {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  /**
   * 上传用户头像
   */
  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const response = await fetch(`${this.baseURL}/user/avatar`, {
        method: 'POST',
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || '上传失败',
        };
      }
      
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败',
      };
    }
  }
  
  /**
   * 获取收藏列表
   */
  async getFavorites(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    items: FavoriteItem[];
    total: number;
    page: number;
    limit: number;
  }>> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/favorites?${query}`);
  }
}
```

### 3. Backend API Routes

#### PUT /api/user/profile

更新用户昵称。

**文件位置**: `api/user/profile.ts`

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  try {
    // 验证用户身份
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    
    // 验证请求体
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid name' });
    }
    
    // 验证昵称格式
    if (name.length < 1 || name.length > 50) {
      return res.status(400).json({
        success: false,
        error: '昵称长度必须在 1-50 个字符之间'
      });
    }
    
    if (!/^[a-zA-Z0-9\u4e00-\u9fa5\s_-]+$/.test(name)) {
      return res.status(400).json({
        success: false,
        error: '昵称只能包含字母、数字、中文、空格、连字符和下划线'
      });
    }
    
    // 更新数据库
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { name },
    });
    
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({
      success: false,
      error: '服务器错误',
    });
  }
}
```

#### POST /api/user/avatar

上传用户头像到 Cloudinary。

**文件位置**: `api/user/avatar.ts`

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';
import { uploadToCloudinary } from '../../lib/cloudinary';
import multer from 'multer';

// Multer 配置
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式'));
    }
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  try {
    // 验证用户身份
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    
    // 处理文件上传
    await new Promise((resolve, reject) => {
      upload.single('avatar')(req as any, res as any, (err) => {
        if (err) reject(err);
        else resolve(null);
      });
    });
    
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ success: false, error: '未找到文件' });
    }
    
    // 上传到 Cloudinary
    const uploadResult = await uploadToCloudinary(file.buffer, {
      folder: 'avatars',
      transformation: [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
    });
    
    // 更新数据库
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { avatar: uploadResult.secure_url },
    });
    
    return res.status(200).json({
      success: true,
      data: { avatarUrl: uploadResult.secure_url },
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '上传失败',
    });
  }
}

export const config = {
  api: {
    bodyParser: false, // 禁用默认 body parser，使用 multer
  },
};
```

#### GET /api/favorites (扩展现有端点)

扩展现有的 `api/favorites.ts` 以支持分页查询。

```typescript
// 在现有 GET handler 中添加分页支持
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      
      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
      }
      
      // 分页参数
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      
      // 查询收藏列表
      const [favorites, total] = await Promise.all([
        prisma.favorite.findMany({
          where: { userId: payload.userId },
          include: {
            asset: {
              select: {
                id: true,
                title: true,
                thumbnailUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.favorite.count({
          where: { userId: payload.userId },
        }),
      ]);
      
      return res.status(200).json({
        success: true,
        data: {
          items: favorites,
          total,
          page,
          limit,
        },
      });
    } catch (error) {
      console.error('Get favorites error:', error);
      return res.status(500).json({
        success: false,
        error: '服务器错误',
      });
    }
  }
  
  // ... 其他方法 (POST, DELETE)
}
```

## Data Models

### Database Schema Updates

需要在 Prisma schema 中为 User 模型添加 `avatar` 字段：

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  avatar    String?  // 新增：头像 URL
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  assets    Asset[]
  likes     Like[]
  favorites Favorite[]
  folders   Folder[]

  @@map("users")
}
```

**Migration 命令**:
```bash
npx prisma migrate dev --name add_user_avatar
```

### TypeScript Types

扩展 `app/src/types/api.ts`：

```typescript
// 扩展 User 类型
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string; // 新增
  createdAt: string;
  updatedAt: string;
}

// 新增 FavoriteItem 类型
export interface FavoriteItem {
  id: string;
  assetId: string;
  userId: string;
  createdAt: string;
  asset: {
    id: string;
    title: string;
    thumbnailUrl: string;
  };
}

// 新增 FavoritesListData 类型
export interface FavoritesListData {
  items: FavoriteItem[];
  total: number;
  page: number;
  limit: number;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: File Format Validation

*For any* file selected for avatar upload, if the file format is not JPEG, PNG, or WebP, then the validation should fail and display an appropriate error message.

**Validates: Requirements 2.1, 2.3**

### Property 2: File Size Validation

*For any* file selected for avatar upload, if the file size exceeds 5MB, then the validation should fail and display an appropriate error message.

**Validates: Requirements 2.2**

### Property 3: Valid Avatar Upload Success

*For any* valid image file (correct format and size ≤ 5MB), uploading it should successfully update the user's avatar in the system.

**Validates: Requirements 2.5**

### Property 4: Nickname Validation Completeness

*For any* string input as a nickname, the validation should correctly identify whether it meets all requirements (length 1-50 characters, contains only letters, numbers, Chinese characters, spaces, hyphens, and underscores), and display appropriate error messages for invalid inputs.

**Validates: Requirements 3.2, 3.3, 3.4**

### Property 5: Valid Nickname Update Success

*For any* valid nickname string, saving it should successfully update the user's nickname in the system.

**Validates: Requirements 3.5**

### Property 6: Edit Cancellation Restores Original State

*For any* original value (nickname or avatar preview), if the user enters edit mode and then cancels, the system should restore the original value without any changes.

**Validates: Requirements 3.7, 7.4**

### Property 7: Favorites Display Completeness

*For any* set of favorited images, when the favorites list is displayed, all favorited images should be present in the list.

**Validates: Requirements 4.1**

### Property 8: Favorites Chronological Ordering

*For any* set of favorited images with different favorite timestamps, the displayed list should be ordered in reverse chronological order (newest first).

**Validates: Requirements 4.2**

### Property 9: Favorite Item Rendering Completeness

*For any* favorite item, the rendered output should contain the thumbnail, title, and favorite date.

**Validates: Requirements 4.5**

### Property 10: Profile Updates Persist to Backend

*For any* valid profile update (avatar or nickname), after a successful update, querying the backend should return the updated value.

**Validates: Requirements 6.1, 6.2**

### Property 11: Backend Failure Rollback

*For any* profile update attempt, if the backend update fails, the UI should display an error message and revert to the previous value.

**Validates: Requirements 6.3**

### Property 12: Data Loading on Sidebar Open

*For any* user, when the sidebar is opened, the system should fetch and display the latest user information from the backend.

**Validates: Requirements 6.5**

### Property 13: Avatar Preview Generation

*For any* valid image file selected for upload, a preview should be generated and displayed with the same dimensions as the final avatar.

**Validates: Requirements 7.1, 7.2**

## Error Handling

### Frontend Error Handling

1. **File Validation Errors**
   - Invalid format: "不支持的文件格式，请上传 JPEG、PNG 或 WebP 格式的图片"
   - File too large: "文件大小超过 5MB，请选择更小的图片"
   - File read error: "无法读取文件，请重试"

2. **Nickname Validation Errors**
   - Too short/long: "昵称长度必须在 1-50 个字符之间"
   - Invalid characters: "昵称只能包含字母、数字、中文、空格、连字符和下划线"
   - Empty input: "昵称不能为空"

3. **Network Errors**
   - Upload failure: "上传失败，请检查网络连接后重试"
   - Update failure: "保存失败，请重试"
   - Load failure: "加载失败，请刷新页面"

4. **Offline State**
   - Display cached data with indicator: "离线模式 - 显示缓存数据"
   - Disable edit operations: "离线状态下无法编辑"

### Backend Error Handling

1. **Authentication Errors**
   - Missing token: 401 Unauthorized
   - Invalid token: 401 Unauthorized
   - Expired token: 401 Unauthorized

2. **Validation Errors**
   - Invalid request body: 400 Bad Request
   - Invalid file format: 400 Bad Request
   - File too large: 413 Payload Too Large
   - Invalid nickname: 400 Bad Request

3. **Database Errors**
   - Connection failure: 503 Service Unavailable
   - Query timeout: 504 Gateway Timeout
   - Constraint violation: 409 Conflict

4. **External Service Errors**
   - Cloudinary upload failure: 502 Bad Gateway
   - Cloudinary timeout: 504 Gateway Timeout

### Error Recovery Strategies

1. **Automatic Retry**
   - Network errors: Retry up to 3 times with exponential backoff
   - Timeout errors: Retry with increased timeout

2. **Graceful Degradation**
   - Offline mode: Use cached data, disable editing
   - Cloudinary failure: Allow upload to local storage as fallback

3. **User Feedback**
   - Show toast notifications for all errors
   - Provide actionable error messages
   - Display loading states during operations

## Testing Strategy

### Unit Testing

使用 Vitest 进行单元测试，重点测试：

1. **Validation Logic**
   - File format validation function
   - File size validation function
   - Nickname validation function
   - Test specific edge cases:
     - Empty files
     - Exactly 5MB files
     - Boundary nickname lengths (0, 1, 50, 51 characters)
     - Special characters in nicknames

2. **Component Behavior**
   - AvatarUploader component state transitions
   - NicknameEditor component state transitions
   - FavoritesList component rendering
   - Error message display
   - Success confirmation display

3. **API Client Methods**
   - Request formatting
   - Response parsing
   - Error handling
   - Token management

4. **Integration Points**
   - Component-to-API communication
   - State updates after API calls
   - Error propagation

### Property-Based Testing

使用 fast-check 库进行基于属性的测试，每个测试运行至少 100 次迭代：

1. **Property 1: File Format Validation**
   ```typescript
   // Feature: user-profile-sidebar, Property 1: File format validation
   fc.assert(
     fc.property(
       fc.record({
         name: fc.string(),
         type: fc.constantFrom('image/gif', 'image/bmp', 'text/plain', 'application/pdf'),
         size: fc.integer({ min: 1, max: 5 * 1024 * 1024 })
       }),
       (invalidFile) => {
         const result = validateAvatarFile(invalidFile);
         expect(result.valid).toBe(false);
         expect(result.error).toContain('不支持的文件格式');
       }
     ),
     { numRuns: 100 }
   );
   ```

2. **Property 2: File Size Validation**
   ```typescript
   // Feature: user-profile-sidebar, Property 2: File size validation
   fc.assert(
     fc.property(
       fc.record({
         name: fc.string(),
         type: fc.constantFrom('image/jpeg', 'image/png', 'image/webp'),
         size: fc.integer({ min: 5 * 1024 * 1024 + 1, max: 50 * 1024 * 1024 })
       }),
       (oversizedFile) => {
         const result = validateAvatarFile(oversizedFile);
         expect(result.valid).toBe(false);
         expect(result.error).toContain('超过 5MB');
       }
     ),
     { numRuns: 100 }
   );
   ```

3. **Property 4: Nickname Validation Completeness**
   ```typescript
   // Feature: user-profile-sidebar, Property 4: Nickname validation completeness
   fc.assert(
     fc.property(
       fc.string(),
       (nickname) => {
         const result = validateNickname(nickname);
         const isValidLength = nickname.length >= 1 && nickname.length <= 50;
         const hasValidChars = /^[a-zA-Z0-9\u4e00-\u9fa5\s_-]+$/.test(nickname);
         const shouldBeValid = isValidLength && hasValidChars;
         
         expect(result.valid).toBe(shouldBeValid);
         if (!shouldBeValid) {
           expect(result.error).toBeTruthy();
         }
       }
     ),
     { numRuns: 100 }
   );
   ```

4. **Property 6: Edit Cancellation Restores Original State**
   ```typescript
   // Feature: user-profile-sidebar, Property 6: Edit cancellation restores original state
   fc.assert(
     fc.property(
       fc.string({ minLength: 1, maxLength: 50 }),
       fc.string({ minLength: 1, maxLength: 50 }),
       (originalNickname, editedNickname) => {
         const editor = new NicknameEditor(originalNickname);
         editor.setValue(editedNickname);
         editor.cancel();
         
         expect(editor.getValue()).toBe(originalNickname);
       }
     ),
     { numRuns: 100 }
   );
   ```

5. **Property 8: Favorites Chronological Ordering**
   ```typescript
   // Feature: user-profile-sidebar, Property 8: Favorites chronological ordering
   fc.assert(
     fc.property(
       fc.array(
         fc.record({
           id: fc.uuid(),
           assetId: fc.uuid(),
           createdAt: fc.date()
         }),
         { minLength: 2, maxLength: 50 }
       ),
       (favorites) => {
         const sorted = sortFavoritesByDate(favorites);
         
         for (let i = 0; i < sorted.length - 1; i++) {
           expect(sorted[i].createdAt >= sorted[i + 1].createdAt).toBe(true);
         }
       }
     ),
     { numRuns: 100 }
   );
   ```

6. **Property 10: Profile Updates Persist to Backend**
   ```typescript
   // Feature: user-profile-sidebar, Property 10: Profile updates persist to backend
   fc.assert(
     fc.asyncProperty(
       fc.string({ minLength: 1, maxLength: 50 }),
       async (newNickname) => {
         const validNickname = newNickname.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s_-]/g, 'a');
         
         await apiClient.updateProfile({ name: validNickname });
         const session = await apiClient.getSession();
         
         expect(session.data?.user.name).toBe(validNickname);
       }
     ),
     { numRuns: 100 }
   );
   ```

### Test Configuration

**测试库**: Vitest + fast-check

**配置文件**: `vitest.config.ts`
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
});
```

**最小迭代次数**: 每个属性测试至少 100 次迭代

**测试标签格式**: `Feature: user-profile-sidebar, Property {number}: {property_text}`

### Manual Testing Checklist

需要手动测试的功能（无法自动化）：

1. **动画和过渡效果**
   - 侧边栏打开/关闭动画流畅度
   - 头像预览过渡效果
   - 加载状态动画

2. **可访问性**
   - 键盘导航完整性
   - 焦点指示器可见性
   - 屏幕阅读器兼容性
   - ARIA 标签正确性

3. **视觉设计**
   - 圆形头像裁剪效果
   - 响应式布局
   - 颜色对比度
   - 字体大小和可读性

4. **跨浏览器兼容性**
   - Chrome, Firefox, Safari, Edge
   - 移动浏览器

5. **性能**
   - 大文件上传响应时间
   - 长收藏列表滚动性能
   - 内存使用情况
