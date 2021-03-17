# pomeloScale
自动扩展服务器。原址：https://github.com/NetEase/pomelo-scale-plugin

## 使用说明

### 配置文件

```shell
{
   # 服务器类型 
  "connector": {
    "type": ["cpu","memory"], # 监控的目标 “cpu” "memory" ["cpu","memory"]
    "scaleCondition": 10,# 查询的条件
    "interval": 50000, # 间隔时间
    "increasement": 2, # 每次增加的服务器个数
    "servers": [ # 可以扩展的服务器列表
          {
                "id": "connector2",
                "host": "127.0.0.1",
                "port": "3152",
                "clientHost": "192.168.31.140",
                "clientPort": "3012",
                "max-connections": 300,
                "frontend": true,
                "args": [
                  "--harmony"
                ]
          },
          {
                "clusterCount": "10", // 批量添加扩展服务器
                "host": "127.0.0.1",
                "port": "3152++",
                "clientHost": "192.168.31.140",
                "clientPort": "3012++",
                "max-connections": 300,
                "frontend": true,
                "args": [
                  "--harmony"
                ]
          }
    ]
  },
  "player": {
    "type": "other",  # 自定义类型
    "scaleCondition": 2,
    "increasement": 2,
    "otherClass":"PlayerScale.js", # 自定义条件脚本
    "servers":
    [
          {
                "id": "player10",
                "host": "127.0.0.1",
                "port": "2222",
                "area": 12,
                "clientPort": "",
                "clientHost": "",
                "max-connections": null,
                "args": [
                  ""
                ]
          }
    ]
}
}
```

### app.js 中添加脚本

```shell

/**
 *  扩展服务器
 */
app.configure('production|development', 'master', () =>
{
	app.use(scale,
		{
			scale :
			{
				backup    : './config/backupServers.json', # 自动扩展服务器路径
				otherPath : 'app/ScaleManager' # 自定义文件脚本路径
			}
		});
});
```