// Message history sync service for visitor-facing widget
// API: POST /v1/visitors/messages/sync (docs/api.json)

import { un } from '@uni-helper/uni-network'
import AbortController from 'abort-controller/dist/abort-controller'
import { requireApiKeyOrThrow } from '@/utils/url'

export type PullMode = 0 | 1 // 0=down (older), 1=up (newer)

export interface VisitorMessageSyncRequest {
  platform_api_key?: string | null
  channel_id: string
  channel_type: number
  start_message_seq?: number | null
  end_message_seq?: number | null
  limit?: number | null
  pull_mode?: PullMode | null
}

export interface WuKongIMMessage {
  header: Record<string, any>
  setting: number
  message_id: number
  message_id_str?: string
  client_msg_no: string
  message_seq: number
  from_uid: string
  channel_id: string
  channel_type: number
  timestamp: number // seconds
  payload: any
  end?: number | null
  end_reason?: string | null
  error?: string | null // AI 处理错误信息（与 payload 平级）
  stream_data?: string | null
  setting_flags?: {
    receipt?: boolean
    signal?: boolean
    no_encrypt?: boolean
    topic?: boolean
    stream?: boolean
  }
}

export interface WuKongIMChannelMessageSyncResponse {
  start_message_seq: number
  end_message_seq: number
  more: number // 0=no more, 1=has more
  messages: WuKongIMMessage[]
}

export async function syncVisitorMessages(params: {
  apiBase: string
  channelId: string
  channelType: number
  startSeq?: number | null
  endSeq?: number | null
  limit?: number | null
  pullMode?: PullMode | null
  signal?: AbortSignal
}): Promise<WuKongIMChannelMessageSyncResponse> {
  const { apiBase, channelId, channelType, startSeq, endSeq, limit, pullMode, signal } = params
  const apiKey = requireApiKeyOrThrow()
  const url = `${apiBase.replace(/\/$/, '')}/v1/visitors/messages/sync`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  try {
    const body: VisitorMessageSyncRequest = {
      platform_api_key: apiKey,
      channel_id: channelId,
      channel_type: channelType,
      start_message_seq: startSeq ?? null,
      end_message_seq: endSeq ?? null,
      limit: limit ?? null,
      pull_mode: pullMode ?? null,
    }
    const res = await un.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Platform-API-Key': apiKey,
      },
      signal: signal ?? controller.signal,
    })
    if (res.status !== 200) {
      throw new Error(`[History] sync failed: ${res.status} ${res.errMsg}`)
    }
    const data = res.data as WuKongIMChannelMessageSyncResponse
    if (!data || !Array.isArray(data.messages)) {
      throw new Error('[History] invalid response')
    }
    return data
  }
  finally {
    clearTimeout(timer)
  }
}
