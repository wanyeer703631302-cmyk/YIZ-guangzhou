// TypeScript type definitions for tag filtering feature

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

export interface CreateTagRequest {
  name: string
}

export interface UpdateTagRequest {
  name: string
}

export interface AddTagToAssetRequest {
  tagId: string
}

export interface TagApiResponse {
  success: boolean
  data?: Tag
  error?: string
}

export interface TagsListApiResponse {
  success: boolean
  data?: Tag[]
  error?: string
}

export interface AssetTagApiResponse {
  success: boolean
  data?: AssetTag
  error?: string
}
