# 和声里 · 一个人的合唱团 Demo

手机端优先的可交互 Web 原型。用户可以为“彩虹”这一曲目条目完成声音测评、练习虚构示例旋律、录制三个声部，并在浏览器内同时播放。

## 启动

```bash
pnpm install
pnpm dev
```

生产构建与测试：

```bash
pnpm check
pnpm build
```

## 技术说明

- Vite + React + TypeScript。
- Web Audio API 负责虚构参考音和合成声部。
- `pitchy` 在本机进行实时音高检测，不上传麦克风音频。
- `MediaRecorder` 保存本次浏览器会话中的用户录音。
- `localStorage` 只保存项目进度元数据，不保存音频 Blob。
- `src/audio/` 分别封装参考音、音高检测、录音和多轨播放。
- `src/data/demoSong.ts` 是未来 MusicXML、MIDI、授权声部分轨的适配入口。

## 版权边界

项目不包含“彩虹”的原始音频、歌词、乐谱或真实旋律。所有练习音符均为本 Demo 自行创建的示例数据。正式素材格式约定见 `public/licensed-audio/README.md`。
