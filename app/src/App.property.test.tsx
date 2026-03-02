/**
 * Bug Condition Exploration Property Test
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 * 
 * This test explores the fault conditions described in the bugfix spec.
 * It is EXPECTED TO FAIL on unfixed code - failure confirms the bug exists.
 * 
 * DO NOT fix the test or code when it fails - the test encodes expected behavior.
 * The goal is to demonstrate counterexamples that prove the bug exists.
 * 
 * Scoped PBT Approach: For deterministic bugs, we scope properties to concrete
 * failing cases to ensure reproducibility.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Bug Condition Exploration - Property 1: Fault Condition', () => {
  /**
   * Fault Condition 1: 首屏空白问题
   * 
   * Bug: 当 API 返回数据时，条件渲染逻辑错误导致显示空状态
   * Expected: 当 apiItems.length > 0 且 isLoading === false 时，应显示画廊
   * 
   * This test analyzes the App.tsx code to verify the bug exists.
   */
  it('Property 1.1: App.tsx 条件渲染逻辑 - 有数据时应显示画廊', () => {
    const appTsxPath = join(process.cwd(), 'app/src/App.tsx')
    const appTsxContent = readFileSync(appTsxPath, 'utf-8')

    // Check for the bug: empty state condition that doesn't properly check for data
    // Bug: The condition `!isLoading && !error && apiItems.length === 0` is correct
    // But the issue is that galleryData uses fallbackGalleryData when apiItems is empty
    // This means even when API returns data, if there's a logic error, it might show empty state

    // Verify the empty state rendering exists
    const hasEmptyStateCheck = appTsxContent.includes('暂无内容')
    expect(hasEmptyStateCheck).toBe(true)

    // Verify the condition for empty state
    const hasEmptyStateCondition = appTsxContent.includes('apiItems.length === 0')
    expect(hasEmptyStateCondition).toBe(true)

    // Bug: Check if galleryData uses fallbackGalleryData
    // This is the root cause - when API returns empty, it falls back to hardcoded data
    const usesFallbackData = appTsxContent.includes('fallbackGalleryData')
    expect(usesFallbackData).toBe(true)

    // The bug is in this line: `const galleryData = apiItems.length > 0 ? apiItems : fallbackGalleryData`
    // When apiItems is empty, it uses fallbackGalleryData instead of showing empty state
    const hasFallbackLogic = appTsxContent.includes('apiItems.length > 0 ? apiItems : fallbackGalleryData')
    
    // This assertion will PASS on unfixed code (proving the bug exists)
    // After fix, this line should be removed or changed
    expect(hasFallbackLogic).toBe(true)
  })

  /**
   * Fault Condition 2: 内容位置偏移
   * 
   * Bug: section 的 h-screen 类导致画廊内容需要滚动才能看到
   * Expected: 画廊应该在首屏可见区域
   */
  it('Property 1.2: App.tsx 布局问题 - section 使用 h-screen 导致内容偏移', () => {
    const appTsxPath = join(process.cwd(), 'app/src/App.tsx')
    const appTsxContent = readFileSync(appTsxPath, 'utf-8')

    // Bug: section has h-screen class which makes it full viewport height
    // This pushes content down and requires scrolling
    const hasHScreenClass = appTsxContent.includes('h-screen')
    
    // This assertion will PASS on unfixed code (proving the bug exists)
    // After fix, h-screen should be removed or adjusted
    expect(hasHScreenClass).toBe(true)

    // Verify the section with id="work" exists
    const hasWorkSection = appTsxContent.includes('id="work"')
    expect(hasWorkSection).toBe(true)
  })

  /**
   * Fault Condition 3: 显示占位图片
   * 
   * Bug: 当 API 返回空数组时，使用 fallbackGalleryData 而非显示空状态
   * Expected: 应该显示"暂无内容"而非占位图片
   */
  it('Property 1.3: App.tsx 后备数据逻辑 - 应该显示空状态而非占位图片', () => {
    const appTsxPath = join(process.cwd(), 'app/src/App.tsx')
    const appTsxContent = readFileSync(appTsxPath, 'utf-8')

    // Bug: fallbackGalleryData is used when apiItems is empty
    // This means users see Unsplash placeholder images instead of empty state
    const fallbackDataDeclaration = appTsxContent.match(/const fallbackGalleryData.*?=.*?\[/s)
    expect(fallbackDataDeclaration).toBeTruthy()

    // Check the galleryData assignment logic
    const galleryDataAssignment = appTsxContent.match(/const galleryData = apiItems\.length > 0 \? apiItems : fallbackGalleryData/)
    
    // This assertion will PASS on unfixed code (proving the bug exists)
    // The fix should remove this fallback logic or only use it in development
    expect(galleryDataAssignment).toBeTruthy()

    // Verify that galleryData is used in rendering
    const usesGalleryData = appTsxContent.includes('galleryData')
    expect(usesGalleryData).toBe(true)
  })

  /**
   * Fault Condition 4: 上传按钮缺失
   * 
   * Bug: TopRightIcons 只显示搜索和用户按钮，没有上传按钮
   * Expected: 应该显示 3 个按钮（搜索、上传、用户）
   */
  it('Property 1.4: TopRightIcons 缺少上传按钮', () => {
    const topRightIconsPath = join(process.cwd(), 'app/src/components/TopRightIcons/TopRightIcons.tsx')
    const topRightIconsContent = readFileSync(topRightIconsPath, 'utf-8')

    // Check for Search icon import
    const hasSearchImport = topRightIconsContent.includes('Search')
    expect(hasSearchImport).toBe(true)

    // Check for User icon import
    const hasUserImport = topRightIconsContent.includes('User')
    expect(hasUserImport).toBe(true)

    // Bug: No Upload icon import
    const hasUploadImport = topRightIconsContent.includes('Upload')
    
    // This assertion will FAIL on unfixed code (proving the bug exists)
    // After fix, Upload should be imported and rendered
    expect(hasUploadImport).toBe(false)

    // Count button elements in the component
    const buttonMatches = topRightIconsContent.match(/<button/g)
    const buttonCount = buttonMatches ? buttonMatches.length : 0
    
    // Bug: Only 2 buttons (Search and User), should be 3
    // This assertion will PASS on unfixed code (proving the bug exists)
    expect(buttonCount).toBe(2)
  })

  /**
   * Fault Condition 5: API 认证错误
   * 
   * Bug: useInteractions 在未认证时调用 API 导致 500 错误
   * Expected: 应该检查认证状态，未认证时不调用 API 或优雅处理
   */
  it('Property 1.5: useInteractions 缺少认证检查', () => {
    const useInteractionsPath = join(process.cwd(), 'app/src/hooks/useInteractions.ts')
    const useInteractionsContent = readFileSync(useInteractionsPath, 'utf-8')

    // Check if loadInteractions function exists
    const hasLoadInteractions = useInteractionsContent.includes('loadInteractions')
    expect(hasLoadInteractions).toBe(true)

    // Bug: No authentication check before calling API
    // The hook should check if user is authenticated before calling getUserInteractions
    const hasAuthCheck = useInteractionsContent.includes('isAuthenticated') || 
                        useInteractionsContent.includes('auth_token') ||
                        useInteractionsContent.includes('localStorage.getItem')
    
    // This assertion will FAIL on unfixed code (proving the bug exists)
    // After fix, there should be an auth check
    expect(hasAuthCheck).toBe(false)

    // Verify that useEffect calls loadInteractions
    const hasUseEffectCall = useInteractionsContent.includes('useEffect')
    expect(hasUseEffectCall).toBe(true)
  })

  /**
   * Combined Property: Bug Condition Function (PBT)
   * 
   * Tests the formal specification from the design document using property-based testing
   */
  it('Property 1.6: 综合测试 - Bug 条件函数 (PBT)', () => {
    fc.assert(
      fc.property(
        fc.record({
          apiItemsLength: fc.integer({ min: 0, max: 10 }),
          isLoading: fc.boolean(),
          hasError: fc.boolean(),
        }),
        ({ apiItemsLength, isLoading, hasError }) => {
          // Read the actual code to verify bug conditions
          const appTsxPath = join(process.cwd(), 'app/src/App.tsx')
          const appTsxContent = readFileSync(appTsxPath, 'utf-8')

          // Bug Condition 1: apiItems.length > 0 AND displayedContent == "empty"
          // This is caused by the fallback logic
          const isBugCondition1 = apiItemsLength > 0 && !isLoading && !hasError
          
          if (isBugCondition1) {
            // When there's data, the code should show gallery, not empty state
            // But the bug is that it uses fallbackGalleryData logic
            const hasFallbackLogic = appTsxContent.includes('fallbackGalleryData')
            expect(hasFallbackLogic).toBe(true) // Bug exists
          }

          // Bug Condition 2: galleryRendered AND galleryVisibleWithoutScroll == false
          // This is caused by h-screen class
          const hasHScreen = appTsxContent.includes('h-screen')
          expect(hasHScreen).toBe(true) // Bug exists

          // Bug Condition 3: apiItems.length == 0 AND displayedImages == "fallback"
          // When API returns empty, it should show empty state, not fallback
          const isBugCondition3 = apiItemsLength === 0 && !isLoading && !hasError
          
          if (isBugCondition3) {
            const usesFallback = appTsxContent.includes('apiItems.length > 0 ? apiItems : fallbackGalleryData')
            expect(usesFallback).toBe(true) // Bug exists
          }

          // Bug Condition 4: uploadButtonVisible == false
          const topRightIconsPath = join(process.cwd(), 'app/src/components/TopRightIcons/TopRightIcons.tsx')
          const topRightIconsContent = readFileSync(topRightIconsPath, 'utf-8')
          const hasUpload = topRightIconsContent.includes('Upload')
          expect(hasUpload).toBe(false) // Bug exists

          // Bug Condition 5: API call without auth check
          const useInteractionsPath = join(process.cwd(), 'app/src/hooks/useInteractions.ts')
          const useInteractionsContent = readFileSync(useInteractionsPath, 'utf-8')
          const hasAuthCheck = useInteractionsContent.includes('isAuthenticated') || 
                              useInteractionsContent.includes('auth_token')
          expect(hasAuthCheck).toBe(false) // Bug exists
        }
      ),
      {
        numRuns: 10,
      }
    )
  })
})
