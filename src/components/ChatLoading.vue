<template>
  <view class="chat-loading">
    <view class="loading-box">
      <view class="loading-item"></view>
      <view class="loading-item"></view>
      <view class="loading-item"></view>
    </view>
  </view>
</template>

<style lang="scss">
  .chat-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16rpx 0;
  }
  .loading-box {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .loading-item {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background-color: #007AFF;
    margin: 0 8rpx;
    animation: loading 0.6s ease-in-out infinite;
  }
  .loading-item:nth-child(2) {
    animation-delay: 0.2s;
  }
  @keyframes loading {
    0% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-12rpx);
    }
    100% {
      transform: translateY(0);
    }
  }
</style>
