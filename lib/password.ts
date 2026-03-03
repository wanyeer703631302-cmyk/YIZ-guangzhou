import bcrypt from 'bcryptjs'

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * 验证密码复杂度
 * 
 * 要求：
 * - 至少8个字符
 * - 包含至少一个大写字母
 * - 包含至少一个小写字母
 * - 包含至少一个数字
 * 
 * @param password - 待验证的密码
 * @returns 验证结果
 */
export function validatePasswordComplexity(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (!password || password.length < 8) {
    errors.push('密码至少需要8个字符')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含至少一个数字')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 生成临时密码
 * 
 * 生成符合复杂度要求的随机密码：
 * - 12个字符长度
 * - 包含大小写字母和数字
 * 
 * @returns 临时密码（明文）
 */
export function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const allChars = uppercase + lowercase + numbers

  // 确保至少包含一个大写字母、一个小写字母和一个数字
  let password = ''
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]

  // 填充剩余字符到12位
  for (let i = 3; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // 打乱字符顺序
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * 哈希密码
 * 
 * @param password - 明文密码
 * @returns 哈希后的密码
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * 验证密码
 * 
 * @param password - 明文密码
 * @param hashedPassword - 哈希后的密码
 * @returns 是否匹配
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
