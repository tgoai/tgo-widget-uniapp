import path from 'node:path'
import process from 'node:process'
import Uni from '@uni-helper/plugin-uni'
import Components from '@uni-helper/vite-plugin-uni-components'
import { WotResolver } from '@uni-helper/vite-plugin-uni-components/resolvers'
import UniLayouts from '@uni-helper/vite-plugin-uni-layouts'
import UniManifest from '@uni-helper/vite-plugin-uni-manifest'
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import UniKuRoot from '@uni-ku/root'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig, loadEnv } from 'vite'
import UniPolyfill from 'vite-plugin-uni-polyfill'

export default defineConfig(({ mode }) => {
  const { UNI_PLATFORM } = process.env
  const env = loadEnv(mode, process.cwd(), '')

  return {
    resolve: {
      alias: {
        '@': path.join(process.cwd(), './src'),
        '@img': path.join(process.cwd(), './src/static/images'),
      },
    },
    define: {
      __UNI_PLATFORM__: JSON.stringify(UNI_PLATFORM),
      __API_KEY__: JSON.stringify(env.API_KEY),
      __API_BASE__: JSON.stringify(env.API_BASE),
    },
    plugins: [
      UniManifest(),
      UniPages({
        exclude: ['**/components/**/**.*'],
        dts: 'src/types/uni-pages.d.ts',
      }),
      UniLayouts(),
      Components({
        dts: 'src/types/components.d.ts',
        resolvers: [WotResolver()],
        directoryAsNamespace: true,
      }),
      UniKuRoot(),
      Uni(),
      UniPolyfill(),
      AutoImport({
        imports: [
          'vue',
          '@vueuse/core',
          'uni-app',
          {
            from: 'uni-mini-router',
            imports: ['createRouter', 'useRouter', 'useRoute'],
          },
          {
            from: 'wot-design-uni',
            imports: ['useToast', 'useMessage', 'useNotify', 'CommonUtil'],
          },
        ],
        dts: 'src/types/auto-imports.d.ts',
        dirs: ['src/hooks', 'src/stores', 'src/utils'],
        vueTemplate: true,
      }),
      UnoCSS({
        inspector: false,
      }),
    ],
    server: {
      host: '0.0.0.0',
      port: 3300,
    },
  }
})
