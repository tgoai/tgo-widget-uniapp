import type { WidgetData } from '@/types/widget'

/**
 * 解析后的 UI Widget 块
 */
export interface ParsedUIBlock {
  type: string
  data: WidgetData
  raw: string
  blockId: string
  startIndex: number
  endIndex: number
}

/**
 * UI Widget 代码块正则表达式
 * 匹配 ```tgo-ui-widget 开头，``` 结尾的代码块
 */
const UI_WIDGET_REGEX = /```tgo-ui-widget\s*([\s\S]*?)```/gi

/**
 * 生成唯一 ID
 */
function generateBlockId(): string {
  return `ui-block-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * 解析 Markdown 内容中的所有 UI Widget 块
 */
export function parseUIWidgets(content: string): ParsedUIBlock[] {
  const blocks: ParsedUIBlock[] = []
  let match: RegExpExecArray | null

  // Reset regex lastIndex
  UI_WIDGET_REGEX.lastIndex = 0

  while ((match = UI_WIDGET_REGEX.exec(content)) !== null) {
    const rawJson = match[1].trim()

    try {
      const data = JSON.parse(rawJson) as WidgetData

      if (!data.type) {
        console.warn('UI Widget missing type field:', rawJson)
        continue
      }

      blocks.push({
        type: data.type,
        data,
        raw: rawJson,
        blockId: generateBlockId(),
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      })
    }
    catch (e) {
      console.error('Failed to parse UI Widget JSON:', e)
    }
  }

  return blocks
}

/**
 * 替换 Markdown 内容中的 UI Widget 块为占位符
 * 返回处理后的内容和块映射
 */
export function replaceUIWidgetsWithPlaceholders(
  content: string,
): {
  content: string
  blocks: Map<string, ParsedUIBlock>
} {
  const blocks = new Map<string, ParsedUIBlock>()

  // Reset regex lastIndex
  UI_WIDGET_REGEX.lastIndex = 0

  const processedContent = content.replace(
    UI_WIDGET_REGEX,
    (match, jsonContent) => {
      try {
        // Trim the JSON content and remove any trailing newlines before the closing ```
        const trimmedJson = jsonContent.trim()
        const data = JSON.parse(trimmedJson) as WidgetData
        const blockId = generateBlockId()

        blocks.set(blockId, {
          type: data.type,
          data,
          raw: trimmedJson,
          blockId,
          startIndex: 0,
          endIndex: 0,
        })

        // Return a placeholder that can be replaced with the rendered component
        return `\n\n<div data-ui-widget="${blockId}"></div>\n\n`
      }
      catch (e) {
        // If parsing fails, log and return original content
        console.error('Failed to parse UI Widget JSON:', e, 'Content:', jsonContent?.substring(0, 100))
        return match
      }
    },
  )

  return { content: processedContent, blocks }
}

/**
 * 检查内容是否包含 UI Widget
 */
export function hasUIWidgets(content: string): boolean {
  UI_WIDGET_REGEX.lastIndex = 0
  return UI_WIDGET_REGEX.test(content)
}
