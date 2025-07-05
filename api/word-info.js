// /api/word-info.js（画像取得なし・安定版）

import OpenAI from "openai";

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
  };

  try {
    const prompt = `次の英単語について、日本語で以下の情報を詳しく教えてください。\n1. 簡単な意味\n2. 類語（3つ以内）\n3. 簡単な言い換え（やさしい英語で）\n4. 語源（ラテン語やギリシャ語の成り立ちなど）\n5. 文化的背景（どんな場面で使われるか）\n6. 雑学（豆知識）\nJSON形式で：{ meaning, synonyms, simpleSynonyms, etymology, culturalBackground, trivia }\n単語: ${word}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const content = completion.choices[0].message.content.trim();
    const parsed = JSON.parse(content);

    res.status(200).json({
      word,
      meaning: parsed.meaning || fallbackData.meaning,
      synonyms: parsed.synonyms || [],
      simpleSynonyms: parsed.simpleSynonyms || [],
      etymology: parsed.etymology || fallbackData.etymology,
      culturalBackground: parsed.culturalBackground || fallbackData.culturalBackground,
      trivia: parsed.trivia || fallbackData.trivia,
    });
  } catch (err) {
    console.error("❌ OpenAI処理エラー:", err.message);
    res.status(200).json(fallbackData);
  }
}
