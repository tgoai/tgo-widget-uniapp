import { useChatStore } from '@/store/chat'
import { usePlatformStore } from '@/store/platform'

export interface TgoWidgetConfig {
  apiKey: string // 机器人 apiKey
  apiBase: string // 机器人 apiBase
  config?: {
    title?: string // 标题
    color?: string // 颜色
    logoUrl?: string // logo地址
    darkMode?: boolean // 是否开启暗黑模式
    locale?: string // 语言
    welcomeMessage?: string // 欢迎语
  }
}

interface VisitorInfo {
  platformOpenId?: string // 平台用户openid
  name?: string // 用户名
  nickname?: string // 昵称
  avatarUrl?: string // 头像地址
  phoneNumber?: string // 电话号码
  email?: string // 邮箱
  company?: string // 公司
  jobTitle?: string // 职位
  customAttributes?: Record<string, any> // 自定义属性
}

class TgoWidget {
  public apiKey: string = ''
  public apiBase: string = ''
  public config: TgoWidgetConfig['config'] = {}
  public visitorInfo: VisitorInfo = {}

  constructor() {
    this.apiKey = ''
    this.apiBase = ''
    this.config = {}
    this.visitorInfo = {}
  }

  /**
   * 初始化
   */
  public async init({ apiKey, apiBase, config }: TgoWidgetConfig) {
    this.apiKey = apiKey
    this.apiBase = apiBase
    this.config = config
    // 存储配置
    uni.setStorageSync('tgo:apiKey', apiKey)
    uni.setStorageSync('tgo:apiBase', apiBase)
    uni.setStorageSync('tgo:config', config)

    const platformStore = usePlatformStore()
    await platformStore.init(apiBase, apiKey)
    const { initIM } = useChatStore()
    initIM({ apiBase })
  }

  /**
   * 显示
   */
  public show() {
    uni.navigateTo({
      url: '/pages/chat/chat',
    })
  }

  /**
   * 隐藏
   */
  public hide() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      uni.navigateBack()
    }
  }

  /**
   * 设置访客信息
   */
  public setVisitorInfo(visitorInfo: VisitorInfo) {
    this.visitorInfo = visitorInfo
    uni.setStorageSync('tgo:visitorInfo', visitorInfo)
  }

  /**
   * 清空访客信息
   */
  public clearVisitorInfo() {
    this.visitorInfo = {}
    uni.removeStorageSync('tgo:visitorInfo')
  }
}

export default TgoWidget
