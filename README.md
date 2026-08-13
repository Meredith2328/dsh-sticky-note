# dsh-sticky-note

DSH（DeepSeek Harness）便签插件：在编辑框工具栏随手记点子 / 感想 / TODO，自动保存为 Markdown，一键发送到对话。

![dsh-sticky-note 示意图](assets/screenshot.png)

## ✨ 功能

- 📝 **随手记**：编辑框工具栏上的便签按钮，点击弹出便签面板
- 💾 **自动保存**：按设定间隔（10 秒 / 1 分钟 / 5 分钟）自动落盘，`Ctrl+S` 立即保存
- 🏷️ **三分类**：点子 / 感想 / TODO，快捷键 `Ctrl+Shift+1/2/3` 切换
- 📤 **一键发送**：便签内容直接发给当前对话（或追加到输入框）
- 📋 **历史便签**：分组清单 + 展开收起，双击查看、单击预备发送
- ✏️ **可编辑**：历史便签可二次编辑保存
- 📌 **选择保留**：标记保留的便签不会被自动清除（针形图标）
- 🧹 **自动清除**：过期未保留的文件自动删除（1 / 3 / 7 天或永久）
- 🖥️ **Markdown**：编辑 ↔ 实时预览（`Ctrl+Shift+V`），格式化快捷键齐全
- ⚙️ **可配置**：存储路径、保存间隔、清除周期、默认类别、发送方式

## 📦 安装

```sh
dsh plugin --profile web add dsh-sticky-note
```

或本地目录：

```sh
dsh plugin --profile web add file:/path/to/dsh-sticky-note
```

安装后重启 DSH（Web 或 Desktop）。

## 🗂️ 存储结构

```
<root>/
├── 点子/    ← 以时间戳命名的 .md 文件
├── 感想/
├── TODO/
└── 归档/    ← 归档的便签（前缀类别名）
```

默认根路径 `~/.dsh/sticky-notes`（`DSH_HOME` 下），可在设置页修改。

## 📄 License

MIT
