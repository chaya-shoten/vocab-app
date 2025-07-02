import OpenAI from "openai";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const { word } = req.query;
  console.log("🔍 処理開始:", word);

  const fallbackData = {
    word,
    meaning: `${word} の意味を取得できませんでした。`,
    synonyms: [],
    simpleSynonyms: [],
    etymology: "語源情報が見つかりませんでした。",
    culturalBackground: "文化的背景情報が見つかりませんでした。",
    trivia: "雑学情報が見つかりませんでした。",
    images: [],
  };

  try {
    const prompt = `
次の英単語について、日本語で以下の情報を詳しく教えてください。
1. 簡単な意味（例: 〜を特定する、〜を表す）
2. 類語（3つ以内）
3. 簡単な言い換え（よりやさしい英語で）
4. 語源（ラテン語やギリシャ語の成り立ちなど）
5. 文化的背景（どんな場面で使われるか、現代社会での役割など）
6. 雑学（豆知識）

出力は以下のJSON形式で：
{
  "meaning": "...",
  "synonyms": [...],
  "simpleSynonyms": [...],
  "etymology": "...",
  "culturalBackground": "...",
  "trivia": "..."
}

英単語: ${word}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    console.log("✅ GPT 応答受信");

    const text = completion.choices[0].message.content.trim();

    const parsed = JSON.parse(text);

    // 🔽 Google画像検索の代替として Bing Image Search API または空配列を設定（仮）
    let images = [];

    try {
      const response = await axios.get(
        `https://www.googleapis.com/customsearch/v1`,
        {
          params: {
            q: word,
            searchType: "image",
            num: 3,
            key: process.env.GOOGLE_API_KEY,
            cx: process.env.GOOGLE_CSE_ID,
          },
        }
      );
      images = response.data.items?.map((item) => item.link) || [];
      console.log("✅ 画像取得完了");
    } catch (imgErr) {
      console.error("⚠️ 画像取得エラー:", imgErr.message);
    }

    const result = {
      word,
      meaning: parsed.meaning || fallbackData.meaning,
      synonyms: parsed.synonyms || [],
      simpleSynonyms: parsed.simpleSynonyms || [],
      etymology: parsed.etymology || fallbackData.etymology,
      culturalBackground: parsed.culturalBackground || fallbackData.culturalBackground,
      trivia: parsed.trivia || fallbackData.trivia,
      images,
    };

    res.status(200).json(result);
  } catch (err) {
    console.error("❌ GPT処理エラー:", err.message, err);

    res.status(200).json(fallbackData);
  }
}
