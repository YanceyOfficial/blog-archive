# Prometheus + Grafana + Alertmanager 搭建你的监控平台

> 前段时间并行了几个持续部署把服务器搞崩了, 因为我的服务器是 Debian, 下面的指令都是基于此, 如果你使用 CentOS 或者别的, 请对号入座.

## 什么是 Prometheus

## 添加 HTTP Basic Auth

看起来是大功告成了! 我们集成了数据大盘, 监控报警功能. 但你是否隐隐有一丝不安呢? 没错, 这几个服务目前还暴露在公网上, 任何人都可以访问到你的配置, 我们需要做个加密才行. 加密的方式有多种, 比如你自己有个单点登录系统, 后面用 Cookie Credentials 接入认证, 或者用 TLS Client Auth 之类的. 本次我们偷个懒, 直接使用 [Basic auth](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Authentication#nginx%E8%AE%BF%E9%97%AE%E9%99%90%E5%88%B6%E5%92%8C%E5%9F%BA%E6%9C%AC%E8%AE%A4%E8%AF%81), 当然这种方式还是不优雅的, 毕竟用的是 HTTP 明文传输.
