/**
 * Widget 数据基础接口
 * 所有 Widget 数据都必须包含 type 字段
 */
export interface WidgetData {
  type: string
  [key: string]: unknown
}

/**
 * Widget 操作按钮
 */
export interface WidgetAction {
  label: string
  action: string
  style?: 'default' | 'primary' | 'danger' | 'link'
  url?: string
  payload?: Record<string, unknown>
}

/**
 * Widget 组件 Props
 */
export interface WidgetComponentProps<T extends WidgetData = WidgetData> {
  /** Widget 数据 */
  data: T
  /** 操作按钮点击回调（用于非标准 URI 或向后兼容） */
  onAction?: (action: string, payload?: Record<string, unknown>) => void
  /** 发送消息回调（用于 msg:// 协议） */
  onSendMessage?: (message: string) => void
  /** 复制成功回调 */
  onCopySuccess?: (text: string) => void
}

/**
 * 工具栏颜色样式配置
 */
export interface ToolbarColorStyle {
  /** 文字颜色 */
  color: string
  /** 背景颜色 */
  background: string
  /** 悬停背景颜色 */
  hoverBackground: string
  /** 深色模式文字颜色 */
  darkColor: string
  /** 深色模式背景颜色 */
  darkBackground: string
  /** 深色模式悬停背景颜色 */
  darkHoverBackground: string
}

/**
 * Widget 定义接口
 * 用于注册新的 Widget 类型
 */
export interface WidgetDefinition<T extends WidgetData = WidgetData> {
  /** Widget 类型标识 */
  type: string
  /** Widget 显示名称 */
  displayName: string
  /** Widget 描述 */
  description?: string
  /** Widget 渲染组件 */
  component: any
  /** 验证数据是否有效 */
  validate?: (data: unknown) => data is T
  /** Widget 图标（用于开发模式工具栏） */
  icon?: any
  /** 工具栏按钮颜色样式 */
  toolbarColor?: ToolbarColorStyle
}

/**
 * Widget 注册表类型
 */
export type WidgetRegistry = Map<string, WidgetDefinition>

// ============================================
// 预定义的 Widget 数据类型
// ============================================

/**
 * 订单状态
 */
export type OrderStatus
  = | 'pending'
    | 'paid'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'completed'
    | 'cancelled'
    | 'refunded'

/**
 * 订单商品项
 */
export interface OrderItem {
  name: string
  sku?: string
  quantity: number
  unit_price: number
  total_price: number
  image?: {
    url: string
    alt?: string
  }
  attributes?: Record<string, string>
}

/**
 * 订单 Widget 数据
 */
export interface OrderWidgetData extends WidgetData {
  type: 'order'
  order_id: string
  status: OrderStatus
  status_text?: string
  created_at?: string
  paid_at?: string
  shipped_at?: string
  delivered_at?: string
  items: OrderItem[]
  subtotal: number
  shipping_fee?: number
  discount?: number
  total: number
  currency?: string
  shipping_address?: string
  receiver_name?: string
  receiver_phone?: string
  tracking_number?: string
  carrier?: string
  actions?: WidgetAction[]
}

/**
 * 物流状态
 */
export type LogisticsStatus
  = | 'pending'
    | 'picked_up'
    | 'in_transit'
    | 'out_for_delivery'
    | 'delivered'
    | 'exception'
    | 'returned'

/**
 * 物流事件
 */
export interface LogisticsEvent {
  time: string
  status?: LogisticsStatus
  description: string
  location?: string
  operator?: string
  phone?: string
}

/**
 * 物流 Widget 数据
 */
export interface LogisticsWidgetData extends WidgetData {
  type: 'logistics'
  tracking_number: string
  carrier: string
  carrier_logo?: string
  carrier_phone?: string
  status: LogisticsStatus
  status_text?: string
  estimated_delivery?: string
  receiver?: string
  receiver_address?: string
  receiver_phone?: string
  courier_name?: string
  courier_phone?: string
  timeline: LogisticsEvent[]
  order_id?: string
  actions?: WidgetAction[]
}

/**
 * 产品 Widget 数据
 */
export interface ProductWidgetData extends WidgetData {
  type: 'product'
  product_id: string
  name: string
  description?: string
  brand?: string
  category?: string
  thumbnail?: {
    url: string
    alt?: string
  }
  price: number
  original_price?: number
  currency?: string
  discount_label?: string
  in_stock?: boolean
  stock_quantity?: number
  stock_status?: string
  specs?: Array<{ name: string, value: string }>
  rating?: number
  review_count?: number
  tags?: string[]
  actions?: WidgetAction[]
  url?: string
}

/**
 * 产品列表项
 */
export interface ProductListItem {
  product_id: string
  name: string
  price: number
  thumbnail?: string
  rating?: number
}

/**
 * 产品列表 Widget 数据
 */
export interface ProductListWidgetData extends WidgetData {
  type: 'product_list'
  title?: string
  subtitle?: string
  products: ProductListItem[]
  total_count?: number
  page?: number
  page_size?: number
  has_more?: boolean
  actions?: WidgetAction[]
}

/**
 * 价格对比 Widget 数据
 */
export interface PriceComparisonWidgetData extends WidgetData {
  type: 'price_comparison'
  title?: string
  columns: string[]
  items: Array<Record<string, string>>
  recommended_index?: number
  recommendation_reason?: string
  actions?: WidgetAction[]
}

/**
 * 所有预定义 Widget 数据类型联合
 */
export type PresetWidgetData
  = | OrderWidgetData
    | LogisticsWidgetData
    | ProductWidgetData
    | ProductListWidgetData
    | PriceComparisonWidgetData
