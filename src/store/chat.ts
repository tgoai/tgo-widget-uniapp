import type { ChannelInfo, StaffInfo } from '@/services/channel'
import type { WuKongIMMessage } from '@/services/messageHistory'
import type { ChatMessage, MessagePayload } from '@/types/chat'

import { un } from '@uni-helper/uni-network'
import { ReasonCode } from 'easyjssdk'
import { defineStore } from 'pinia'
import { fetchChannelInfo } from '@/services/channel'
import { syncVisitorMessages } from '@/services/messageHistory'
import { makeChatFileUrl, readImageDimensions, uploadChatFile } from '@/services/upload'
import { loadCachedVisitor, registerVisitor, saveCachedVisitor } from '@/services/visitor'
import IMService from '@/services/wukongim'
import { isSystemMessageType } from '@/types/chat'
import { collectVisitorSystemInfo } from '@/utils/systemInfo'
import { resolveApiKey } from '@/utils/url'

// Keep module-level unsubs to avoid duplicate registrations on re-init
let offMsg: null | (() => void) = null
let offStatus: null | (() => void) = null
let offCustom: null | (() => void) = null

// Streaming control timer (auto-revert if no end event)
let streamTimer: any = null
const STREAM_TIMEOUT_MS = 60000

export interface ChatConfig {
  apiBase: string
}

// Map channel type to string representation
function mapChannelTypeToString(t?: number): 'person' | 'group' {
  if (t === 1)
    return 'person'
  if (t === 2)
    return 'group'
  // Fallback: many platforms use group for customer service routing
  return 'group'
}
// Convert any message payload to standard format
function toPayloadFromAny(raw: any): MessagePayload {
  const t = raw?.type
  if (t === 1 && typeof raw?.content === 'string')
    return { type: 1, content: raw.content }
  if (t === 2 && typeof raw?.url === 'string' && typeof raw?.width === 'number' && typeof raw?.height === 'number') {
    return { type: 2, url: raw.url, width: raw.width, height: raw.height }
  }
  if (t === 3 && typeof raw?.url === 'string' && typeof raw?.name === 'string' && typeof raw?.size === 'number') {
    return { type: 3, content: (typeof raw?.content === 'string' && raw.content) ? raw.content : '[文件]', url: raw.url, name: raw.name, size: raw.size }
  }
  if (t === 12 && typeof raw?.content === 'string' && Array.isArray(raw?.images)) {
    const images = raw.images
      .filter((i: any) => i && typeof i.url === 'string' && typeof i.width === 'number' && typeof i.height === 'number')
      .map((i: any) => ({ url: i.url, width: i.width, height: i.height }))
    let file: undefined | { url: string, name: string, size: number }
    if (raw?.file && typeof raw.file.url === 'string' && typeof raw.file.name === 'string' && typeof raw.file.size === 'number') {
      file = { url: raw.file.url, name: raw.file.name, size: raw.file.size }
    }
    return file ? { type: 12, content: raw.content, images, file } : { type: 12, content: raw.content, images }
  }
  if (t === 99 && typeof raw?.cmd === 'string')
    return { type: 99, cmd: raw.cmd, param: raw?.param ?? {} }
  if (t === 100)
    return { type: 100 }
  // System message (type 1000-2000)
  if (typeof t === 'number' && isSystemMessageType(t) && typeof raw?.content === 'string') {
    return { type: t, content: raw.content, extra: Array.isArray(raw?.extra) ? raw.extra : undefined }
  }
  if (typeof raw === 'string')
    return { type: 1, content: raw }
  return { type: 1, content: typeof raw?.content === 'string' ? raw.content : JSON.stringify(raw ?? {}) }
}

const pendingFiles = new Map<string, File>()
const uploadControllers = new Map<string, AbortController>()

function mapHistoryToChatMessage(m: WuKongIMMessage, myUid?: string): ChatMessage {
  const isStreamEnded = m?.setting_flags?.stream === true && m?.end === 1 && typeof m?.stream_data === 'string' && m.stream_data.length > 0
  const payload: MessagePayload = isStreamEnded ? { type: 1, content: m.stream_data as string } : toPayloadFromAny(m?.payload)
  // 检查消息的 error 字段（与 payload 平级）
  const errorMessage = m?.error ? String(m.error) : undefined
  return {
    id: m.message_id_str ?? m.client_msg_no ?? `h-${m.message_seq}`,
    role: m.from_uid && myUid && m.from_uid === myUid ? 'user' : 'agent',
    payload,
    time: new Date((m.timestamp || 0) * 1000),
    messageSeq: typeof m.message_seq === 'number' ? m.message_seq : undefined,
    clientMsgNo: m.client_msg_no ? String(m.client_msg_no) : undefined,
    fromUid: m.from_uid ? String(m.from_uid) : undefined,
    channelId: m.channel_id ? String(m.channel_id) : undefined,
    channelType: typeof m.channel_type === 'number' ? m.channel_type : undefined,
    errorMessage,
  }
}

const inflightStaff = new Set<string>()

export const useChatStore = defineStore('chat', () => {
  // messages
  const messages = ref<ChatMessage[]>([])
  const online = ref<boolean>(false)
  const initializing = ref<boolean>(false)
  const error = ref<Error | null>(null)
  // history state
  const historyLoading = ref<boolean>(false)
  const historyHasMore = ref<boolean>(false)
  const historyError = ref<Error | null>(null)
  const earliestSeq = ref<number | null>(null)
  // channel / identity
  const apiBase = ref<string | undefined>(undefined)
  const myUid = ref<string | undefined>(undefined)
  const channelId = ref<string | undefined>(undefined)
  const channelType = ref<number | undefined>(undefined)
  // staff info cache
  const staffInfoCache = ref<Record<string, StaffInfo>>({})
  // streaming state
  const isStreaming = ref<boolean>(false)
  const streamCanceling = ref<boolean>(false)
  const streamingClientMsgNo = ref<string | undefined>(undefined)
  // unread count
  const unreadCount = ref<number>(0)

  async function fetchStaffInfo(uid: string) {
    if (!uid)
      return
    if (staffInfoCache.value[uid])
      return
    if (inflightStaff.has(uid))
      return
    inflightStaff.add(uid)

    try {
      const info: ChannelInfo = await fetchChannelInfo({
        apiBase: apiBase.value || '',
        platformApiKey: resolveApiKey() || '',
        channelId: uid,
        channelType: 1,
      })
      const name = info?.name || (info?.extra?.name ?? info?.extra?.nickname) || uid
      const avatar = info?.avatar || info?.extra?.avatar_url || ''
      staffInfoCache.value[uid] = { name, avatar }
    }
    catch (e) {
      console.error('fetchStaffInfo error', e)
    }
    finally {
      inflightStaff.delete(uid)
    }
  }

  // init IM
  async function initIM(cfg: ChatConfig) {
    if (!cfg?.apiBase)
      return
    // already initialized
    if (initializing.value || IMService.isReady)
      return
    initializing.value = true
    error.value = null
    try {
      // set channel info
      apiBase.value = cfg.apiBase
      const platformApiKey = resolveApiKey() || ''
      if (!platformApiKey)
        throw new Error('[Visitor] Missing apiKey in URL (?apiKey=...). Ensure the SDK injects it into the control iframe URL via history.replaceState.')

      // Load cached visitor/channel or register
      let cached = loadCachedVisitor(cfg.apiBase, platformApiKey)
      if (!cached) {
        const sys = collectVisitorSystemInfo()
        // 获取访客时区
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null
        const res = await registerVisitor({
          apiBase: cfg.apiBase,
          platformApiKey,
          extra: {
            ...(sys ? { system_info: sys } : {}),
            timezone,
          },
        })

        saveCachedVisitor(cfg.apiBase, platformApiKey, res)
        cached = loadCachedVisitor(cfg.apiBase, platformApiKey)!
      }

      // WuKongIM 连接要求：使用 visitor_id + "-vtr" 作为 uid
      const uid = String(cached.visitor_id || '')
      const uidForIM = uid.endsWith('-vtr') ? uid : `${uid}-vtr`
      const target = cached.channel_id
      const channel_type = mapChannelTypeToString(cached.channel_type)
      const token = cached.im_token
      console.log('[Chat] Initializing IM with:', { uid: uidForIM, target, channel_type, hasToken: !!token, token: token ? `${token.substring(0, 10)}...` : 'undefined' })

      myUid.value = uidForIM
      channelId.value = target
      channelType.value = cached.channel_type ?? 251

      if (!token) {
        throw new Error('[Chat] Missing im_token from visitor registration. Please check that the /v1/visitors/register API returns im_token field.')
      }

      await IMService.init({ apiBase: cfg.apiBase, uid: uidForIM, token, target, channelType: channel_type })

      // status events (de-duped)
      if (offStatus) {
        try { offStatus() }
        catch {} ; offStatus = null
      }
      offStatus = IMService.onStatus((s) => {
        online.value = s === 'connected'
      })

      // message events (de-duped)
      if (offMsg) {
        try { offMsg() }
        catch {} ; offMsg = null
      }
      offMsg = IMService.onMessage((m) => {
        // skip self echoes
        if (!m.fromUid || m.fromUid === uidForIM)
          return
        try { void fetchStaffInfo(m.fromUid) }
        catch {}
        // prefetch staff info by sender uid (personal channel)
        const chat: ChatMessage = {
          id: String(m.messageId),
          role: 'agent',
          payload: toPayloadFromAny(m?.payload),
          time: new Date(m.timestamp * 1000),
          messageSeq: typeof m.messageSeq === 'number' ? m.messageSeq : undefined,
          clientMsgNo: m?.clientMsgNo,
          fromUid: m.fromUid,
          channelId: m.channelId,
          channelType: m.channelType,
        }

        // Check if message already exists (de-duplicate)
        if (messages.value.some(x => x.id === chat.id))
          return

        let content = ''
        if (chat.payload.type === 1) {
          content = chat.payload.content || ''
        }
        else if (chat.payload.type === 2) {
          content = '[图片]'
        }
        else if (chat.payload.type === 3) {
          content = '[文件]'
        }
        if (content) {
          console.log('content:', content)
        }
        incrementUnreadCount()
        // update existing message with clientMsgNo
        if (chat.clientMsgNo) {
          const idx = messages.value.findIndex(x => x.clientMsgNo && x.clientMsgNo === chat.clientMsgNo)
          if (idx >= 0) {
            const next = messages.value.slice()
            next[idx] = { ...messages.value[idx], ...chat, streamData: undefined }
            messages.value = next
          }
          messages.value = [...messages.value, chat]
        }
      })

      // custom stream events (de-duped)
      if (offCustom) {
        try { offCustom() }
        catch {} ; offCustom = null
      }
      offCustom = IMService.onCustom((ev: any) => {
        try {
          if (!ev)
            return

          // Handle stream start event
          if (ev.type === '___TextMessageStart') {
            const id = ev?.id ? String(ev.id) : ''
            if (!id)
              return

            console.log('[Chat] Stream started for message:', id)
            incrementUnreadCount()

            try { markStreamingStart(id) }
            catch {}

            return
          }

          // Handle stream content event
          if (ev.type === '___TextMessageContent') {
            const id = ev?.id ? String(ev.id) : ''
            if (!id)
              return

            const chunk = typeof ev.data === 'string' ? ev.data : (ev.data != null ? String(ev.data) : '')
            if (!chunk)
              return
            console.log('[Chat] Stream chunk for message:', id, chunk)
            appendStreamData(id, chunk)
            return
          }

          // Handle stream end event
          if (ev.type === '___TextMessageEnd') {
            const id = ev?.id ? String(ev.id) : ''
            if (!id)
              return

            // 如果 data 字段有值，则认为是错误信息
            const errorMessage = ev?.data ? String(ev.data) : undefined
            console.log('[Chat] Stream ended for message:', id, errorMessage ? `error: ${errorMessage}` : '')

            finalizeStreamMessage(id, errorMessage)

            try { markStreamingEnd(id) }
            catch {}

            return
          }
        }
        catch (err) {
          console.error('[Chat] Custom event handler error:', err)
        }
      })

      // connect IM
      await IMService.connect()
      // initial history load (latest N)
      await loadInitialHistory(20)
    }
    catch (e: any) {
      const errMsg = e?.message || String(e)
      console.error('[Chat] IM initialization failed:', errMsg, e)
      error.value = errMsg
      online.value = false
    }
    finally {
      initializing.value = false
    }
  }
  // send message to wukongim
  async function sendMessage(text: string) {
    const v = (text || '').trim(); if (!v)
      return
    const clientMsgNo = `cmn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const id = `u-${Date.now()}`
    const you: ChatMessage = { id, role: 'user', payload: { type: 1, content: v }, time: new Date(), status: 'sending', clientMsgNo }
    // 1. 先渲染消息到消息列表（发送中状态）
    messages.value = [...messages.value, you]

    try {
      const platformApiKey = resolveApiKey() || ''
      if (!apiBase.value || !platformApiKey || !myUid.value) {
        throw new Error('Cannot send message: missing apiBase, apiKey, or myUid')
      }

      // If a previous stream is ongoing, auto-cancel it before sending a new one
      if (isStreaming.value) {
        try { cancelStreaming('auto_cancel_on_new_send') }
        catch {}
      }

      // 2. 先通过 websocket 发送
      // 确保 IM 已就绪
      if (!IMService.isReady) {
        if (!initializing.value && apiBase.value) {
          console.log('[Chat] IM not ready, attempting to initialize...')
          try { void initIM({ apiBase: apiBase.value }) }
          catch {}
        }
        const start = Date.now()
        const timeout = 10000
        while (!IMService.isReady && (Date.now() - start) < timeout) {
          await new Promise(r => setTimeout(r, 120))
        }
        if (!IMService.isReady) {
          throw new Error('Cannot send message: IM service is not ready after waiting.')
        }
      }

      console.log('[Chat] WebSocket sending...')
      const result = await IMService.sendText(v, { clientMsgNo })
      console.log('[Chat] WebSocket send result:', result)
      // 只有 WebSocket 发送成功（reasonCode 为 Success）才继续调用 completion 接口
      if (result.reasonCode !== ReasonCode.Success) {
        console.warn('[Chat] WebSocket send did not return Success, skipping completion API.', result.reasonCode)
        messages.value = messages.value.map(m => m.id === id ? { ...m, status: undefined, reasonCode: result.reasonCode } : m)
        return
      }

      // 3. WebSocket 发送成功后，再调用 /v1/chat/completion 接口（stream=false）
      const url = `${apiBase.value.replace(/\/$/, '')}/v1/chat/completion`
      const payload: Record<string, any> = {
        api_key: platformApiKey,
        message: v,
        from_uid: myUid.value,
        wukongim_only: true,
        forward_user_message_to_wukongim: false,
        stream: false,
      }
      if (channelId.value)
        payload.channel_id = channelId.value
      if (channelType.value != null)
        payload.channel_type = channelType.value

      console.log('[Chat] Calling /v1/chat/completion:', { url, payload: { ...payload, api_key: '***' } })

      const res = await un.post(url, payload, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.status !== 200) {
        throw new Error(`/v1/chat/completion failed:  ${res.status} ${res.errMsg}`)
      }

      console.log('[Chat] /v1/chat/completion success')

      messages.value = messages.value.map(m => m.id === id ? { ...m, status: undefined, reasonCode: result.reasonCode } : m)
    }
    catch (e) {
      console.error('[Chat] Send failed:', e)
      try { markStreamingEnd() }
      catch {}

      messages.value = messages.value.map(m => m.id === id ? { ...m, status: undefined, reasonCode: ReasonCode.Unknown } : m)
      error.value = (e as any)?.message || String(e)
    }
  }
  // upload file to wukongim
  async function uploadFiles(files: FileList | File[]) {
    const arr: File[] = Array.isArray(files as any) ? (files as any as File[]) : Array.from(files as FileList)

    for (const file of arr) {
      ;(async () => {
        try {
          if (!apiBase.value || !channelId.value || !channelType.value) {
            error.value = { name: 'UploadError', message: '[Upload] Not initialized' }
            return
          }
          const isImage = (file?.type || '').startsWith('image/')
          const dimsPromise = isImage ? readImageDimensions(file) : Promise.resolve(null)
          const clientMsgNo = (typeof crypto !== 'undefined' && (crypto as any)?.randomUUID) ? (crypto as any).randomUUID() : `um-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          const id = `u-up-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          const placeholder: ChatMessage = {
            id,
            role: 'user',
            payload: { type: 1, content: isImage ? '图片上传中…' : '文件上传中…' } as any,
            time: new Date(),
            status: 'uploading',
            uploadProgress: 0,
            clientMsgNo,
          }
          messages.value = [...messages.value, placeholder]
          pendingFiles.set(id, file)
          const controller = new AbortController()
          uploadControllers.set(id, controller)

          try {
            const res = await uploadChatFile({
              apiBase: apiBase.value,
              channelId: channelId.value,
              channelType: channelType.value,
              file,
              signal: controller.signal,
              onProgress: (p: number) => {
                messages.value = messages.value.map(m => m.id === id ? { ...m, uploadProgress: p } : m)
              },
            })

            const dims = await dimsPromise
            if (isImage) {
              const w = Math.max(1, dims?.width ?? 1)
              const h = Math.max(1, dims?.height ?? 1)
              const fileUrl = makeChatFileUrl(apiBase.value, res.file_id)
              const payload: MessagePayload = { type: 2, url: fileUrl, width: w, height: h }
              messages.value = messages.value.map(m => m.id === id ? { ...m, payload, status: 'sending', uploadProgress: undefined, uploadError: undefined } : m)
              const result = await IMService.sendPayload(payload, { clientMsgNo })
              messages.value = messages.value.map(m => m.id === id ? { ...m, status: undefined, reasonCode: (result?.reasonCode ?? ReasonCode.Unknown) as ReasonCode } : m)
            }
            else {
              const fileUrl = makeChatFileUrl(apiBase.value, res.file_id)
              const payload: MessagePayload = { type: 3, content: file.name || '[文件]', url: fileUrl, name: res.file_name || file.name, size: res.file_size ?? file.size }
              messages.value = messages.value.map(m => m.id === id ? { ...m, payload, status: 'sending', uploadProgress: undefined, uploadError: undefined } : m)
              const result = await IMService.sendPayload(payload, { clientMsgNo })
              messages.value = messages.value.map(m => m.id === id ? { ...m, status: undefined, reasonCode: (result?.reasonCode ?? ReasonCode.Unknown) as ReasonCode } : m)
            }
            // success: cleanup retained file/controller
            uploadControllers.delete(id)
            pendingFiles.delete(id)
          }
          catch (err: any) {
            // error
            uploadControllers.delete(id)
            const aborted = err?.name === 'AbortError'
            messages.value = messages.value.map(m => m.id === id ? { ...m, status: undefined, uploadError: aborted ? '已取消' : (err?.message || '上传失败') } : m)
            error.value = aborted ? error : (err?.message || String(err))
            // keep pendingFiles for retry on failure
          }
        }
        catch (e) {
          error.value = (e as any)?.message || String(e)
        }
      })()
    }
  }

  async function retryUpload(messageId: string) {
    const file = pendingFiles.get(messageId)
    if (!file)
      return
    if (!apiBase.value || !channelId.value || !channelType.value)
      return

    const isImage = (file?.type || '').startsWith('image/')

    const dimsPromise = isImage ? readImageDimensions(file) : Promise.resolve(null)
    const clientMsgNo = `um-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    // reset state
    messages.value = messages.value.map(m => m.id === messageId ? { ...m, clientMsgNo } : m)
    const controller = new AbortController()
    uploadControllers.set(messageId, controller)

    try {
      const res = await uploadChatFile({
        apiBase: apiBase.value,
        channelId: channelId.value,
        channelType: channelType.value,
        file,
        signal: controller.signal,
        onProgress: p => messages.value = messages.value.map(m => m.id === messageId ? { ...m, uploadProgress: p } : m),
      })

      const dims = await dimsPromise
      if (isImage) {
        const w = Math.max(1, dims?.width ?? 1)
        const h = Math.max(1, dims?.height ?? 1)
        const fileUrl = makeChatFileUrl(apiBase.value, res.file_id)
        const payload: MessagePayload = { type: 2, url: fileUrl, width: w, height: h }
        messages.value = messages.value.map(m => m.id === messageId ? { ...m, payload, status: 'sending', uploadProgress: undefined, uploadError: undefined } : m)
        const result = await IMService.sendPayload(payload, { clientMsgNo })
        messages.value = messages.value.map(m => m.id === messageId ? { ...m, status: undefined, reasonCode: (result?.reasonCode ?? ReasonCode.Unknown) as ReasonCode } : m)
      }
      else {
        const fileUrl = makeChatFileUrl(apiBase.value, res.file_id)
        const payload: MessagePayload = { type: 3, content: file.name || '[文件]', url: fileUrl, name: res.file_name || file.name, size: res.file_size ?? file.size }
        messages.value = messages.value.map(m => m.id === messageId ? { ...m, payload, status: 'sending', uploadProgress: undefined, uploadError: undefined } : m)
        const result = await IMService.sendPayload(payload, { clientMsgNo })
        messages.value = messages.value.map(m => m.id === messageId ? { ...m, status: undefined, reasonCode: (result?.reasonCode ?? ReasonCode.Unknown) as ReasonCode } : m)
      }
      uploadControllers.delete(messageId)
      pendingFiles.delete(messageId)
    }
    catch (err: any) {
      uploadControllers.delete(messageId)
      const aborted = err?.name === 'AbortError'
      messages.value = messages.value.map(m => m.id === messageId ? { ...m, status: undefined, uploadError: aborted ? '已取消' : (err?.message || '上传失败') } : m)
      error.value = aborted ? error : (err?.message || String(err))
    }
  }

  function cancelUpload(messageId: string) {
    const ctl = uploadControllers.get(messageId)
    if (ctl) {
      try { ctl.abort() }
      catch {}
      uploadControllers.delete(messageId)
    }
    else {
      // if no inflight controller, mark as cancelled locally
      messages.value = messages.value.map(m => m.id === messageId ? { ...m, status: undefined, uploadError: '已取消' } : m)
    }
  }

  async function retryMessage(messageId: string) {
    const msg = messages.value.find(m => m.id === messageId)
    if (!msg || msg.role !== 'user')
      return

    messages.value = messages.value.map(m => m.id === messageId ? { ...m, status: 'sending', reasonCode: undefined } : m)
    try {
      const result = await IMService.sendPayload(msg.payload)
      const code: ReasonCode = (result?.reasonCode ?? ReasonCode.Unknown) as ReasonCode
      messages.value = messages.value.map(m => m.id === messageId ? { ...m, status: undefined, reasonCode: code } : m)
    }
    catch (e) {
      messages.value = messages.value.map(m => m.id === messageId ? { ...m, status: undefined, reasonCode: ReasonCode.Unknown } : m)
      error.value = (e as any)?.message || String(e)
    }
  }

  // remove message by id
  function removeMessage(messageId: string) {
    messages.value = messages.value.filter(x => x.id !== messageId)
  }

  // load initial history
  async function loadInitialHistory(limit = 20) {
    if (!channelId.value || !channelType.value)
      return
    if (historyLoading.value)
      return
    historyLoading.value = true
    historyError.value = null

    try {
      const res = await syncVisitorMessages({
        apiBase: apiBase.value || '',
        channelId: channelId.value,
        channelType: channelType.value,
        startSeq: 0,
        endSeq: 0,
        limit,
        pullMode: 1,
      })

      // Sort ascending by seq
      const list = [...res.messages].sort((a, b) => (a.message_seq || 0) - (b.message_seq || 0)).map(m => mapHistoryToChatMessage(m, myUid.value))
      // prefetch staff names for agent messages
      try {
        const uids = Array.from(new Set(list.filter(x => x.role === 'agent' && x.fromUid).map(x => String(x.fromUid))))
        uids.forEach((u) => {
          try { void fetchStaffInfo(u) }
          catch {}
        })
      }
      catch {}

      // dedup by seq or id, then prepend
      const existingSeqs = new Set<number>()
      messages.value.forEach((m) => {
        if (typeof m.messageSeq === 'number')
          existingSeqs.add(m.messageSeq)
      })
      const existingIds = new Set(messages.value.map(m => m.id))
      const mergedHead = list.filter(m => (m.messageSeq != null ? !existingSeqs.has(m.messageSeq) : !existingIds.has(m.id)))
      const earliest = mergedHead.length ? Math.min(...mergedHead.map(m => m.messageSeq ?? Number.MAX_SAFE_INTEGER), earliestSeq.value ?? Number.MAX_SAFE_INTEGER) : earliestSeq.value

      messages.value = [...mergedHead, ...messages.value]
      earliestSeq.value = earliest ?? null
      historyHasMore.value = res.more === 1
    }
    catch (e) {
      historyError.value = (e as any)?.message || String(e)
    }
    finally {
      historyLoading.value = false
    }
  }

  async function loadMoreHistory(limit = 20) {
    if (!channelId.value || !channelType.value)
      return
    if (historyLoading.value)
      return
    const start = earliestSeq.value ?? 0
    historyLoading.value = true
    historyError.value = null

    try {
      const res = await syncVisitorMessages({
        apiBase: apiBase.value || '',
        channelId: channelId.value,
        channelType: channelType.value,
        startSeq: start,
        endSeq: 0,
        limit,
        pullMode: 0,
      })

      const _myUid = myUid.value

      // sort descending (down pull returns <= start), then reverse to maintain ascending order when prepending
      const listAsc = [...res.messages]
        .sort((a, b) => (a.message_seq || 0) - (b.message_seq || 0))
        .map(m => mapHistoryToChatMessage(m, _myUid))

      // prefetch staff names for agent messages
      try {
        const uids = Array.from(new Set(listAsc.filter(x => x.role === 'agent' && x.fromUid).map(x => String(x.fromUid))))
        uids.forEach((u) => {
          try { void fetchStaffInfo(u) }
          catch {}
        })
      }
      catch {}

      const existingSeqs = new Set<number>()
      messages.value.forEach((m) => {
        if (typeof m.messageSeq === 'number')
          existingSeqs.add(m.messageSeq)
      })

      // dedup by seq or id, then prepend
      const existingIds = new Set(messages.value.map(m => m.id))
      const prepend = listAsc.filter(m => (m.messageSeq != null ? !existingSeqs.has(m.messageSeq) : !existingIds.has(m.id)))
      const earliest = prepend.length ? Math.min(...prepend.map(m => m.messageSeq ?? Number.MAX_SAFE_INTEGER), earliestSeq.value ?? Number.MAX_SAFE_INTEGER) : earliestSeq.value

      messages.value = [...prepend, ...messages.value]
      earliestSeq.value = earliest ?? null
      historyHasMore.value = res.more === 1
    }
    catch (e: any) {
      historyError.value = e?.message || String(e)
    }
    finally {
      historyLoading.value = false
    }
  }

  // mark streaming start
  function markStreamingStart(clientMsgNo: string) {
    if (!clientMsgNo)
      return
    // clear previous timer
    if (streamTimer) {
      try { clearTimeout(streamTimer) }
      catch {} ; streamTimer = null
    }
    isStreaming.value = true
    streamCanceling.value = false
    streamingClientMsgNo.value = clientMsgNo

    streamTimer = setTimeout(() => {
      if (isStreaming.value && streamingClientMsgNo.value === clientMsgNo) {
        isStreaming.value = false
        streamingClientMsgNo.value = undefined
        streamCanceling.value = false
      }
    }, STREAM_TIMEOUT_MS)
  }
  // mark streaming end
  function markStreamingEnd(_clientMsgNo?: string) {
    if (streamTimer) {
      try { clearTimeout(streamTimer) }
      catch {} ; streamTimer = null
    }
    isStreaming.value = false
    streamCanceling.value = false
    streamingClientMsgNo.value = undefined
  }
  // interrupt API integration
  async function cancelStreaming(reason?: string) {
    if (streamCanceling.value)
      return
    const clientMsgNo = streamingClientMsgNo.value
    const platformApiKey = resolveApiKey() || ''
    streamCanceling.value = true
    if (!apiBase.value || !platformApiKey || !clientMsgNo)
      return

    try {
      const url = `${apiBase.value.replace(/\/$/, '')}/v1/ai/runs/cancel-by-client`
      const res = await un.post(url, { platform_api_key: platformApiKey, client_msg_no: clientMsgNo, reason: reason || 'user_cancel' }, {
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.status !== 200) {
        console.warn('[Chat] Cancel streaming failed:', res.status, res.statusText, res.errMsg)
      }
    }
    catch (e) {
      console.warn('[Chat] Cancel streaming error:', e)
    }
    finally {
      if (streamTimer) {
        try { clearTimeout(streamTimer) }
        catch {} ; streamTimer = null
      }
      isStreaming.value = false
      streamingClientMsgNo.value = undefined
      streamCanceling.value = false
    }
  }
  // append stream data to existing message
  function appendStreamData(clientMsgNo: string, data: string) {
    if (!clientMsgNo || !data)
      return

    let found = false
    const _messages = messages.value.map((m) => {
      if (m.clientMsgNo && m.clientMsgNo === clientMsgNo) {
        found = true
        return { ...m, streamData: (m.streamData || '') + data }
      }
      return m
    })
    if (found) {
      messages.value = _messages
      return
    }

    // Not found: create a placeholder agent message to display streaming content immediately
    const placeholder: ChatMessage = {
      id: `stream-${clientMsgNo}`,
      role: 'agent',
      payload: { type: 1, content: '' },
      time: new Date(),
      clientMsgNo,
      streamData: data,
    }

    messages.value = [..._messages, placeholder]

    // Mark streaming start if not already marked
    if (!isStreaming.value) {
      try { markStreamingStart(clientMsgNo) }
      catch {}
    }
  }

  function finalizeStreamMessage(clientMsgNo: string, errorMessage?: string) {
    if (!clientMsgNo)
      return

    const _messages = messages.value.map((m) => {
      if (m.clientMsgNo && m.clientMsgNo === clientMsgNo) {
        return { ...m, payload: m.streamData ? { type: 1, content: m.streamData } as MessagePayload : m.payload, streamData: undefined, errorMessage: errorMessage || undefined }
      }
      return m
    })
    messages.value = _messages

    if (streamingClientMsgNo.value === clientMsgNo) {
      if (streamTimer) {
        try { clearTimeout(streamTimer) }
        catch {} ; streamTimer = null
      }
      isStreaming.value = false
      streamingClientMsgNo.value = undefined
      streamCanceling.value = false
    }
  }

  function ensureWelcomeMessage(text: string) {
    const t = (text || '').trim(); if (!t)
      return
    const idx = messages.value.findIndex(m => m.id === 'welcome')
    if (idx >= 0) {
      const next = messages.value.slice()
      const m = next[idx]
      next[idx] = { ...m, payload: { type: 1, content: t } as any }
      messages.value = next
    }
    const welcome: ChatMessage = { id: 'welcome', role: 'agent', payload: { type: 1, content: t }, time: new Date() }
    messages.value = [welcome, ...messages.value]
  }

  // clear unread count
  function clearUnreadCount() {
    console.log('[Chat] Clearing unread count')
    unreadCount.value = 0
  }

  // increment unread count
  function incrementUnreadCount() {
    const newCount = unreadCount.value + 1
    console.log('[Chat] Incrementing unread count to:', newCount)
    unreadCount.value = newCount
  }

  return {
    messages,
    online,
    initializing,
    error,
    historyLoading,
    historyHasMore,
    historyError,
    earliestSeq,
    apiBase,
    myUid,
    channelId,
    channelType,
    staffInfoCache,
    isStreaming,
    streamCanceling,
    streamingClientMsgNo,
    unreadCount,
    fetchStaffInfo,
    initIM,
    sendMessage,
    uploadFiles,
    retryUpload,
    cancelUpload,
    retryMessage,
    removeMessage,
    loadInitialHistory,
    loadMoreHistory,
    markStreamingStart,
    markStreamingEnd,
    cancelStreaming,
    appendStreamData,
    finalizeStreamMessage,
    ensureWelcomeMessage,
    clearUnreadCount,
    incrementUnreadCount,
  }
})
