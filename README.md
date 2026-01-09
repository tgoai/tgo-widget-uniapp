# TGO-WIDGET-UNI-APP

## 安装依赖

```sh
pnpm install
```
## 本地运行
1.  H5端
> 进行访问 URL 拼接参数 `?apiKey=‘你的API Key’&apiSecret=‘你的API Secret’` ，例如：`http://localhost:8080?apiKey=123456&apiSecret=123456`
```sh
pnpm dev
```
2.  微信小程序端
> 进行访问 URL 拼接参数 `?apiKey=‘你的API Key’&apiSecret=‘你的API Secret’` ，例如：`http://localhost:8080?apiKey=123456&apiSecret=123456`
```sh
pnpm dev:mp-weixin
```

## 打包编译

1.  H5端
```sh
pnpm build
```
2.  微信小程序端
```sh
pnpm build:mp-weixin
```
