import { presetUni } from '@uni-helper/unocss-preset-uni'
import {
  defineConfig,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  theme: {
    platforms: {},
    colors: {
      primary: {
        DEFAULT: '#FDA23F',
        red: '#FF1423',
        blue: '#2682ea',
      },
      success: {
        DEFAULT: '#06AE56',
      },
      bg: {
        DEFAULT: '#f7f8fa',
      },
    },
    spacing: {
      xxs: '6rpx',
      xs: '10rpx',
      sm: '20rpx',
      md: '30rpx',
      lg: '40rpx',
    },
    boxShadow: {
      sm: '0 0 12rpx 0 rgba(0,0,0,0.05)',
    },
    animation: {
      keyframes: {
        zoom: `{
  50% {
    transform: scale(1.05)
  }
}`,
      },
    },
  },
  shortcuts: [
    [/^square-(.+)$/, ([, s]) => `w-${s} h-${s}`],
    ['center', 'flex justify-center items-center'],
    ['absolute-center', 'absolute! top-50% left-50% -translate-y-50% -translate-x-50%'],
    {
      'flex-center': 'center',
      'flex-col-center': 'flex-center flex-col',
      'flex-x-center': 'flex justify-center',
      'flex-y-center': 'flex items-center',
    },
  ],
  presets: [
    presetUni(),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
      // HBuilderX 必须针对要使用的 Collections 做异步导入
      // collections: {
      //   carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default),
      // },
    }),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
})
