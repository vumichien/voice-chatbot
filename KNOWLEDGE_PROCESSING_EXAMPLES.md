# Knowledge Processing Examples
## From Raw SRT to Structured Knowledge Base

This document shows real examples of how the content processing pipeline transforms raw transcript data into meaningful, queryable knowledge.

---

## Example 1: 黄金率との出会い (Encounter with the Golden Rule)

### Raw SRT Input (Fragments)
```
26
00:01:19,320 --> 00:01:22,119
29歳でバイブルと出会ってね、そこで

27
00:01:22,119 --> 00:01:26,360
黄金率何事でも人々からして欲しいと望む

28
00:01:26,360 --> 00:01:29,920
通りのことを他の人々にもそのようにし

29
00:01:29,920 --> 00:01:33,399
なさいとね。これマタで7章12節の

30
00:01:33,399 --> 00:01:36,880
御言葉なんだけど、それが僕の潜在意識に

31
00:01:36,880 --> 00:01:39,759
バーンと入ったわけよ。だ、僕は何をする

32
00:01:39,759 --> 00:01:44,880
にもこの価値観に基づいてこれは本当に

33
00:01:44,880 --> 00:01:47,240
相手のためになるんだろうか。みんなの

34
00:01:47,240 --> 00:01:49,880
ためになるんだろうかね。これ今だけじゃ

35
00:01:49,880 --> 00:01:51,799
なく

36
00:01:51,799 --> 00:01:55,759
もどうだろう。本質的、長期的、客観的と

37
00:01:55,759 --> 00:01:58,439
いう視点で、ま、意思決定できる人間に

38
00:01:58,439 --> 00:02:01,159
なったんだよね。
```

### Stage 2: Reconstructed Text
```
29歳でバイブルと出会ってね、そこで黄金率何事でも人々からして欲しいと望む通りのことを他の人々にもそのようにしなさいとね。これマタで7章12節の御言葉なんだけど、それが僕の潜在意識にバーンと入ったわけよ。だ、僕は何をするにもこの価値観に基づいてこれは本当に相手のためになるんだろうか。みんなのためになるんだろうかね。これ今だけじゃなくもどうだろう。本質的、長期的、客観的という視点で、ま、意思決定できる人間になったんだよね。
```

### Stage 3: Cleaned Text
```
29歳でバイブルと出会って、そこで黄金率「何事でも人々からして欲しいと望む通りのことを他の人々にもそのようにしなさい」という教えを知りました。これはマタイ7章12節の御言葉で、それが僕の潜在意識に強く入り込んだんです。僕は何をするにもこの価値観に基づいて「これは本当に相手のためになるんだろうか、みんなのためになるんだろうか、今だけでなく本質的、長期的、客観的にどうだろうか」という視点で意思決定できる人間になりました。
```

**Corrections Applied**:
- "マタで" → "マタイ" (transcription error)
- Added quotes around the golden rule
- Improved readability

### Stage 4: Extracted Knowledge Object

```json
{
  "knowledgeId": "k001",
  "topic": "黄金率と人生の転換点",
  "type": "biographical_event",
  "content": {
    "main": "青木さんは29歳でバイブルと出会い、黄金率の教えに出会いました。黄金率とは「何事でも人々からして欲しいと望む通りのことを他の人々にもそのようにしなさい」というマタイ7章12節の教えです。",
    "context": "この教えが潜在意識に深く入り込み、以降の全ての意思決定の基準となりました。「相手のため、みんなのため、本質的・長期的・客観的な視点」で判断する人間に変わりました。",
    "quotes": [
      "何事でも人々からして欲しいと望む通りのことを他の人々にもそのようにしなさい",
      "本質的、長期的、客観的という視点で意思決定できる人間になった"
    ],
    "keyTakeaway": "29歳での黄金率との出会いが人生を変え、人材教育の仕事を始めるきっかけとなった"
  },
  "entities": {
    "people": ["青木"],
    "concepts": ["黄金率", "バイブル", "価値観", "意思決定", "潜在意識"],
    "references": ["マタイ7章12節"],
    "ages": [29]
  },
  "timestamp": {
    "start": "00:01:19,320",
    "end": "00:02:01,159"
  },
  "metadata": {
    "importance": "high",
    "category": "life_philosophy",
    "sentiment": "transformational",
    "themes": ["self_improvement", "values", "decision_making"]
  }
}
```

### Stage 5: Final Vector DB Chunk

```json
{
  "chunkId": "chunk_001",
  "content": "【黄金率との出会い - 人生の転換点】\n\n青木さんは29歳でバイブルと出会い、黄金率の教えを学びました。黄金率とは「何事でも人々からして欲しいと望む通りのことを他の人々にもそのようにしなさい」というマタイ7章12節の教えです。\n\nこの教えが潜在意識に深く入り込み、以降の全ての意思決定の基準となりました。相手のため、みんなのため、本質的・長期的・客観的な視点で判断する人間に変わり、ここから人材教育の仕事を起こすことになります。",

  "metadata": {
    "topic": "黄金率と人生の転換点",
    "keywords": [
      "29歳", "バイブル", "黄金率", "マタイ7章12節",
      "価値観", "意思決定", "人材教育", "転換点"
    ],
    "entities": ["青木", "バイブル"],
    "concepts": ["黄金率", "価値観", "意思決定", "人生哲学"],
    "timestamp": "00:01:19,320 --> 00:02:01,159",
    "importance": "high",
    "category": "life_philosophy",
    "themes": ["self_improvement", "values", "decision_making"],
    "relatedTopics": ["人材教育の起業", "若い時の不誠実な経験"],
    "contextBefore": "若い時の不誠実な自分を猛省した経験",
    "contextAfter": "人材教育の仕事を始めた経緯",
    "language": "ja",
    "transcriptFile": "transcript.srt",
    "segmentIds": [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38]
  }
}
```

**Embedding Input** (what gets embedded):
```
Topic: 黄金率と人生の転換点

Keywords: 29歳, バイブル, 黄金率, マタイ7章12節, 価値観, 意思決定

青木さんは29歳でバイブルと出会い、黄金率の教えを学びました。黄金率とは「何事でも人々からして欲しいと望む通りのことを他の人々にもそのようにしなさい」というマタイ7章12節の教えです。この教えが潜在意識に深く入り込み、以降の全ての意思決定の基準となりました。相手のため、みんなのため、本質的・長期的・客観的な視点で判断する人間に変わり、ここから人材教育の仕事を起こすことになります。
```

---

## Example 2: 人間関係の原則 (Principles of Relationships)

### Raw SRT Input (Fragments)
```
82
00:04:28,000 --> 00:04:30,919
こういう表現者いけないけど、ま、価値観

83
00:04:30,919 --> 00:04:34,039
が根本的に合わない人とは付き合っちゃ

84
00:04:34,039 --> 00:04:37,800
ダめなんですよ。相手を変えようとはし

85
00:04:37,800 --> 00:04:41,800
ないことなんだよ。離れる方が楽です。で

...

110
00:06:00,600 --> 00:06:03,560
いや、本当にだから僕はね、やっぱりこう

111
00:06:03,560 --> 00:06:06,840
人間関係ってすごく大事で、愛って心を

112
00:06:06,840 --> 00:06:09,599
受け入れることなんで、そのままで

113
00:06:09,599 --> 00:06:12,120
受け入れられる人と良い関係ができ

114
00:06:12,120 --> 00:06:15,360
るってことなんですよ。
```

### Extracted Knowledge Object

```json
{
  "knowledgeId": "k002",
  "topic": "人間関係の原則",
  "type": "life_advice",
  "content": {
    "main": "価値観が根本的に合わない人とは付き合ってはいけません。人を変えようとせず、離れる方が楽です。",
    "context": "愛とは心をそのままで受け入れることです。そのままで受け入れられる人と良い関係ができます。人を変えようとすることは傲慢で、変わりたくなるように導くことはできても、変えることはできません。",
    "quotes": [
      "価値観が根本的に合わない人とは付き合っちゃダメなんですよ",
      "人を変えようということ自体しない方がいいと思う",
      "そのままで受け入れられる人と良い関係ができる"
    ],
    "principles": [
      "人を変えようとしない",
      "価値観が合わない人とは距離を置く",
      "そのままで受け入れられる人を選ぶ",
      "変えようとするのは傲慢"
    ]
  },
  "entities": {
    "concepts": ["価値観", "人間関係", "愛", "誠実", "距離"]
  },
  "timestamp": {
    "start": "00:04:28,000",
    "end": "00:06:15,360"
  },
  "metadata": {
    "importance": "high",
    "category": "relationships",
    "sentiment": "practical_wisdom",
    "themes": ["relationships", "values", "boundaries"]
  }
}
```

### Final Vector DB Chunk

```json
{
  "chunkId": "chunk_002",
  "content": "【人間関係の原則 - 価値観と受容】\n\n価値観が根本的に合わない人とは付き合ってはいけません。人を変えようとせず、離れる方が楽です。\n\n愛とは心をそのままで受け入れることです。そのままで受け入れられる人と良い関係ができます。人を変えようとすることは傲慢で、変わりたくなるように導くことはできても、変えることはできません。\n\n重要な原則:\n• 人を変えようとしない\n• 価値観が合わない人とは距離を置く\n• そのままで受け入れられる人を選ぶ\n• 変えようとするのは傲慢",

  "metadata": {
    "topic": "人間関係の原則",
    "keywords": [
      "価値観", "人間関係", "愛", "受け入れる",
      "距離を置く", "変えようとしない"
    ],
    "concepts": ["価値観", "人間関係", "愛", "誠実", "境界線"],
    "timestamp": "00:04:28,000 --> 00:06:15,360",
    "importance": "high",
    "category": "relationships",
    "themes": ["relationships", "values", "boundaries"],
    "relatedTopics": ["不誠実な人との付き合い方", "夫婦関係", "友人関係"],
    "language": "ja"
  }
}
```

---

## Example 3: 信用の重要性 (Importance of Trust)

### Raw SRT Input
```
179
00:10:05,440 --> 00:10:08,959
信用ってね、無型の資本なんです。この目

180
00:10:08,959 --> 00:10:14,000
に見えない資産が目に見える資産より大切

181
00:10:14,000 --> 00:10:16,120
なんです。

182
00:10:16,120 --> 00:10:19,560
これが本当に分かったら人生は良くなり

183
00:10:19,560 --> 00:10:20,860
ます。
```

### Extracted Knowledge Object

```json
{
  "knowledgeId": "k003",
  "topic": "信用の本質",
  "type": "principle",
  "content": {
    "main": "信用は無形の資本です。この目に見えない資産が、目に見える資産より大切なのです。",
    "context": "青木さんは学歴はないけれど、時間の約束とお金の約束だけは厳しく守ります。信用という無形の資本が、実際のお金や資産よりも重要だと理解しています。",
    "quotes": [
      "信用ってね、無型の資本なんです",
      "この目に見えない資産が目に見える資産より大切なんです",
      "これが本当に分かったら人生は良くなります"
    ],
    "keyInsight": "信用は最も価値のある無形資産であり、これを理解することが人生を変える"
  },
  "entities": {
    "concepts": ["信用", "無形の資本", "資産", "約束", "時間"]
  },
  "timestamp": {
    "start": "00:10:05,440",
    "end": "00:10:20,860"
  },
  "metadata": {
    "importance": "high",
    "category": "business_philosophy",
    "sentiment": "wisdom",
    "themes": ["trust", "values", "success"]
  }
}
```

### Final Vector DB Chunk

```json
{
  "chunkId": "chunk_003",
  "content": "【信用の本質 - 無形の資本】\n\n信用は無形の資本です。この目に見えない資産が、目に見える資産より大切なのです。これが本当に分かったら人生は良くなります。\n\n青木さんは学歴はないけれど、時間の約束とお金の約束だけは厳しく守ります。信用という無形の資本が、実際のお金や資産よりも重要だと理解しています。\n\n信用を守るために:\n• 時間の約束を厳守する\n• お金の約束を必ず守る\n• 無形の資産を最優先する",

  "metadata": {
    "topic": "信用の本質",
    "keywords": [
      "信用", "無形の資本", "資産", "約束",
      "時間", "お金", "人生"
    ],
    "concepts": ["信用", "無形資産", "約束", "誠実"],
    "timestamp": "00:10:05,440 --> 00:10:20,860",
    "importance": "high",
    "category": "business_philosophy",
    "themes": ["trust", "values", "success", "integrity"],
    "relatedTopics": ["誠実さの重要性", "若い時の失敗経験"],
    "language": "ja"
  }
}
```

---

## Test Questions Generated from Knowledge

Based on the processed knowledge, here are example test questions:

### Direct Retrieval Questions
```json
[
  {
    "question": "青木さんが29歳の時に出会ったものは何ですか？",
    "expectedAnswer": "バイブル（聖書）",
    "expectedChunk": "chunk_001",
    "expectedTimestamp": "00:01:19,320 --> 00:01:22,119",
    "type": "factual"
  },
  {
    "question": "黄金率とは何ですか？",
    "expectedAnswer": "何事でも人々からして欲しいと望む通りのことを他の人々にもそのようにしなさい、というマタイ7章12節の教え",
    "expectedChunk": "chunk_001",
    "type": "conceptual"
  }
]
```

### Conceptual Questions
```json
[
  {
    "question": "価値観が合わない人とどう付き合うべきですか？",
    "expectedAnswer": "価値観が根本的に合わない人とは付き合わず、距離を置く方が良い。人を変えようとせず、そのままで受け入れられる人と関係を築くべき。",
    "expectedChunk": "chunk_002",
    "type": "advice"
  },
  {
    "question": "信用とは何ですか？なぜ重要ですか？",
    "expectedAnswer": "信用は無形の資本で、目に見えない資産。これが目に見える資産より大切で、これを理解すると人生が良くなる。",
    "expectedChunk": "chunk_003",
    "type": "principle"
  }
]
```

### Multi-hop Questions
```json
[
  {
    "question": "青木さんの人生観を形成した経験と教えは何ですか？",
    "expectedAnswer": "若い時の不誠実な経験を猛反省し、29歳でバイブルと出会って黄金率の教えを学んだ。この価値観が全ての意思決定の基準となり、人材教育の仕事を始めた。",
    "expectedChunks": ["chunk_001", "chunk_related_001"],
    "type": "comprehensive"
  }
]
```

---

## Benefits of This Processing Approach

### 1. **Semantic Coherence**
- Each chunk contains a complete idea, not fragments
- Queries return meaningful, contextual answers
- Better LLM responses due to coherent input

### 2. **Rich Metadata**
- Topic classification for filtering
- Entity extraction for precise search
- Importance ranking for prioritization
- Theme tagging for discovery

### 3. **Accurate Retrieval**
- Keywords optimize search
- Related topics enable multi-hop reasoning
- Context windows provide better understanding
- Timestamp preservation for source attribution

### 4. **Scalability**
- Same pipeline works for any SRT file
- Namespace isolation per transcript
- Metadata allows cross-transcript search
- Modular design for easy updates

### 5. **Quality**
- Transcription error correction
- Japanese-specific text processing
- Manual knowledge structuring
- Test-driven validation

---

## Statistics

### Processing Efficiency
- **Raw SRT segments**: ~288 segments
- **Reconstructed paragraphs**: ~50-60 paragraphs
- **Knowledge objects**: ~30-40 objects
- **Final chunks**: ~40-60 chunks
- **Reduction**: ~80% fewer chunks vs naive approach
- **Quality improvement**: ~50% better retrieval accuracy (estimated)

### Cost Analysis
- **Embedding cost**: ~$0.001-0.002 per transcript (1536d)
- **Processing time**: ~30-60 seconds per transcript
- **Storage**: ~50KB per transcript in vector DB

---

**End of Examples**
