<script setup lang="ts">
const themeVars = reactive({
  skeletonRowMarginBottom: '10rpx',
})
</script>

<template>
  <wd-config-provider :theme-vars="themeVars" custom-class="h-full">
    <ku-root-view />
    <wd-notify />
    <wd-message-box />
    <wd-toast />
  </wd-config-provider>
</template>
