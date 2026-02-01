<script setup lang="ts">
import { isH5 } from '@uni-helper/uni-env'

definePage(() => {
  if (!isH5) {
    return {
      type: 'home',
      style: {
        navigationBarTitleText: 'Tgo AI 客服演示',
        enablePullDownRefresh: true,
      },
    }
  }
  return {
    type: 'home',
    style: {
      navigationBarTitleText: 'Tgo AI 客服演示',
      navigationStyle: 'custom',
    },
  }
})

const instance = getCurrentInstance()
const tgoWidget = instance?.appContext?.config?.globalProperties?.$tgoWidget

// 跳转TGO
function navigateToTGO() {
  tgoWidget.show()
}
</script>

<template>
  <view class="page h-full flex flex-col bg-[#f5f5f5]">
    <view class="p-3">
      <wd-button :block="true" @click="navigateToTGO">
        跳转TGO 客服
      </wd-button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
// #ifdef H5
uni-page-body, .page {
  height: 100%;
}
// #endif

// #ifdef MP-WEIXIN
.page {
  height: 100vh;
}
// #endif

.page {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.chat__body {
  flex: 1;
  overflow-y: auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
</style>
