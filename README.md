# 每日喝水记录

一个纯前端喝水记录网页，可以记录每天饮水量、按 400 mL / 600 mL 杯子快速添加、查看今日进度和最近 7 天统计。

直接打开 `index.html` 即可使用。数据保存在当前浏览器的 localStorage 中。

## 电脑右下角提醒

网页打开时可以使用浏览器通知。即使网页关闭，也可以在 Windows 上安装本地定时提醒：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install-reminder.ps1 -Minutes 60
```

关闭提醒：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\uninstall-reminder.ps1
```
