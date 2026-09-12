# 正式授权素材接入说明

此目录当前不包含任何音频、歌词、乐谱或原曲旋律素材。

未来获得完整授权后，可将经过确认的正式素材放入本目录，并通过 `src/data/demoSong.ts` 中的 `AUTHORIZED_ASSET_ADAPTER` 接入：

- `score.musicxml`：UTF-8 MusicXML，包含合法授权的音符与段落标记。
- `guide.mid`：标准 MIDI（Type 1 优先），各声部使用独立轨道。
- `stems/soprano.webm`、`stems/alto.webm`、`stems/bass.webm`：48 kHz 声部导唱或伴奏分轨，可另提供 AAC/MP4 兼容版本。
- 可选的节拍与段落元数据应使用 JSON，并以秒为统一时间基准。

替换素材前请确认网络传播、改编、录制和交互式使用授权范围。本 Demo 的 TypeScript 虚构示例旋律应在正式接入后通过适配层替换，不要直接覆盖音频模块。
