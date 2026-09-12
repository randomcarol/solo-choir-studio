# 和声里 · 一个人的合唱团 Demo

手机端优先的可交互 Web 原型。用户可以选择《欢乐颂》《小星星》《友谊地久天长》三首公版完整旋律，完成声音测评、逐段练习、录制三个声部并在浏览器内同时播放。《彩虹》作为待授权曲目展示，不包含其旋律或录音。

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
- `@tonejs/midi` 在浏览器本地解析用户主动选择且确认有权使用的 MIDI；轻量适配器也支持未压缩的 `score-partwise` MusicXML。文件均不上传。
- 录音从倒计时开始前保存为独立原始音轨；本地能量检测只为合唱试听计算起唱点偏移，不改写原文件。
- 单轨试听和多轨合唱会按检测结果自动对齐；目前只校正整条音轨的起点，不做逐字拉伸或修音。
- `localStorage` 只保存项目进度元数据，不保存音频 Blob。
- `src/audio/` 分别封装参考音、音高检测、录音和多轨播放。
- `src/data/demoSong.ts` 是未来 MusicXML、MIDI、授权声部分轨的适配入口。

## 版权边界

项目不包含“彩虹”的原始音频、歌词、乐谱或真实旋律。内置曲目均为保护期已届满的公版作品旋律，三声部与合成导唱由本项目自行制作；谱源信息记录在 `src/data/songLibrary.ts`。正式素材格式约定见 `public/licensed-audio/README.md`。
