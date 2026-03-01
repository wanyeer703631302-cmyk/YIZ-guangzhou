import { v2 as cloudinary } from 'cloudinary'

/**
 * Cloudinary配置模块
 * 
 * 提供Cloudinary客户端配置和图片上传辅助函数
 * 需求: 1.3
 */

// 配置Cloudinary客户端
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * 验证Cloudinary配置是否完整
 * @returns 配置是否有效
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

/**
 * 上传图片到Cloudinary
 * 
 * @param buffer - 图片文件的Buffer数据
 * @param options - 上传选项
 * @returns Cloudinary上传结果
 */
export async function uploadImage(
  buffer: Buffer,
  options?: {
    folder?: string
    resourceType?: 'image' | 'video' | 'raw' | 'auto'
    transformation?: any[]
  }
): Promise<any> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary未配置，请检查环境变量')
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: options?.folder || 'pincollect',
        resource_type: options?.resourceType || 'auto',
        transformation: options?.transformation,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('上传失败'))
        } else {
          resolve(result)
        }
      }
    ).end(buffer)
  })
}

/**
 * 使用Data URI上传图片到Cloudinary（备用方法）
 * 
 * @param dataUri - 图片的Data URI字符串
 * @param options - 上传选项
 * @returns Cloudinary上传结果
 */
export async function uploadImageFromDataUri(
  dataUri: string,
  options?: {
    folder?: string
    resourceType?: 'image' | 'video' | 'raw' | 'auto'
    transformation?: any[]
  }
): Promise<any> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary未配置，请检查环境变量')
  }

  return cloudinary.uploader.upload(dataUri, {
    folder: options?.folder || 'pincollect',
    resource_type: options?.resourceType || 'auto',
    transformation: options?.transformation,
  })
}

/**
 * 生成优化的缩略图URL
 * 
 * @param url - 原始Cloudinary URL
 * @param width - 缩略图宽度（默认400）
 * @returns 优化后的URL
 */
export function generateThumbnailUrl(url: string, width: number = 400): string {
  if (!url || !url.includes('res.cloudinary.com')) {
    return url
  }

  // 如果已经包含优化参数，直接返回
  if (url.includes('f_auto') && url.includes('q_auto') && url.includes('c_thumb')) {
    return url
  }

  // 添加自动格式、自动质量和缩略图裁剪参数
  return url.replace(
    '/upload/',
    `/upload/f_auto,q_auto,c_thumb,w_${width}/`
  )
}

/**
 * 优化Cloudinary URL（自动格式和质量）
 * 
 * @param url - 原始Cloudinary URL
 * @returns 优化后的URL
 */
export function optimizeCloudinaryUrl(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) {
    return url
  }

  // 如果已经包含优化参数，直接返回
  if (url.includes('f_auto') && url.includes('q_auto')) {
    return url
  }

  // 添加自动格式和自动质量参数
  return url.replace('/upload/', '/upload/f_auto,q_auto/')
}

/**
 * 删除Cloudinary上的图片
 * 
 * @param publicId - Cloudinary公共ID
 * @returns 删除结果
 */
export async function deleteImage(publicId: string): Promise<any> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary未配置，请检查环境变量')
  }

  return cloudinary.uploader.destroy(publicId)
}

// 导出配置好的cloudinary实例供直接使用
export { cloudinary }
