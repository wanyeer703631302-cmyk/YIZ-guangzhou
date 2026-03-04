import bcrypt from 'bcryptjs'

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * 验�?密�?复�?�?
 * 
 * 要�?�?
 * - ?��?8个�?�?
 * - ?�含?��?一个大?��?�?
 * - ?�含?��?一个�??��?�?
 * - ?�含?��?一个数�?
 * 
 * @param password - 待�?证�?密�?
 * @returns 验�?结�?
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
 * ?��?临时密�?
 * 
 * ?��?符�?复�?度�?求�??�机密�?�?
 * - 12个�?符长�?
 * - ?�含大�??��?母�??��?
 * 
 * @returns 临时密�?（�??��?
 */
export function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const allChars = uppercase + lowercase + numbers

  // 确�??��??�含一个大?��?母、�?个�??��?母�?一个数�?
  let password = ''
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]

  // 填�??��?字符??2�?
  for (let i = 3; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // ?�乱字符顺�?
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * ?��?密�?
 * 
 * @param password - ?��?密�?
 * @returns ?��??��?密�?
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * 验�?密�?
 * 
 * @param password - ?��?密�?
 * @param hashedPassword - ?��??��?密�?
 * @returns ?�否?��?
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

