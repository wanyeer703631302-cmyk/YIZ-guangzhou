import { v2 as cloudinary } from 'cloudinary'

/**
 * Cloudinary?�置模�?
 * 
 * ?��?Cloudinary客户端�?置�??��?上�?辅助?�数
 * ?��? 1.3
 */

/**
 * 验�?Cloudinary?�置?�否完整
 * @returns ?�置?�否?��?
 */
export function isCloudinaryConfigured(): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  const missingVars: string[] = []
  
  if (!cloudName) missingVars.push('CLOUDINARY_CLOUD_NAME')
  if (!apiKey) missingVars.push('CLOUDINARY_API_KEY')
  if (!apiSecret) missingVars.push('CLOUDINARY_API_SECRET')

  if (missingVars.length > 0) {
    console.warn(
      `[Cloudinary] ?�置不�???- 缺失?��??��?: ${missingVars.join(', ')}. ` +
      `?�件上�??�能将�??�用?�请设置这�??��??��?以启?�Cloudinary?�能?�`
    )
    return false
  }

  return true
}

// 验�??�置并记录警??
const configured = isCloudinaryConfigured()

// ?�在?�置完整?��?始�?Cloudinary客户�?
if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
} else {
  // ?�置缺失?��?设置空�?置以?��?运�??��?�?
  cloudinary.config({
    cloud_name: '',
    api_key: '',
    api_secret: '',
  })
}

/**
 * 上�??��??�Cloudinary
 * 
 * @param buffer - ?��??�件?�Buffer?�据
 * @param options - 上�??�项
 * @returns Cloudinary上�?结�?
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
    throw new Error('Cloudinary is not configured. Please check environment variables.')
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
          reject(error || new Error('上�?失败'))
        } else {
          resolve(result)
        }
      }
    ).end(buffer)
  })
}

/**
 * 使用Data URI上�??��??�Cloudinary（�??�方法�?
 * 
 * @param dataUri - ?��??�Data URI字符�?
 * @param options - 上�??�项
 * @returns Cloudinary上�?结�?
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
    throw new Error('Cloudinary is not configured. Please check environment variables.')
  }

  return cloudinary.uploader.upload(dataUri, {
    folder: options?.folder || 'pincollect',
    resource_type: options?.resourceType || 'auto',
    transformation: options?.transformation,
  })
}

/**
 * ?��?优�??�缩?�图URL
 * 
 * @param url - ?��?Cloudinary URL
 * @param width - 缩略?�宽度�?默认400�?
 * @returns 优�??��?URL
 */
export function generateThumbnailUrl(url: string, width: number = 400): string {
  if (!url || !url.includes('res.cloudinary.com')) {
    return url
  }

  // 如�?已�??�含优�??�数，直?��???
  if (url.includes('f_auto') && url.includes('q_auto') && url.includes('c_thumb')) {
    return url
  }

  // 添�??�动?��??�自?�质?��?缩略?��??��???
  return url.replace(
    '/upload/',
    `/upload/f_auto,q_auto,c_thumb,w_${width}/`
  )
}

/**
 * 优�?Cloudinary URL（自?�格式�?质�?�?
 * 
 * @param url - ?��?Cloudinary URL
 * @returns 优�??��?URL
 */
export function optimizeCloudinaryUrl(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) {
    return url
  }

  // 如�?已�??�含优�??�数，直?��???
  if (url.includes('f_auto') && url.includes('q_auto')) {
    return url
  }

  // 添�??�动?��??�自?�质?��???
  return url.replace('/upload/', '/upload/f_auto,q_auto/')
}

/**
 * ?�除Cloudinary上�??��?
 * 
 * @param publicId - Cloudinary?�共ID
 * @returns ?�除结�?
 */
export async function deleteImage(publicId: string): Promise<any> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Please check environment variables.')
  }

  return cloudinary.uploader.destroy(publicId)
}

// 导出?�置好�?cloudinary实�?供直?�使??
export { cloudinary }

