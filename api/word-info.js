// /api/word-info.js

export default async function handler(req, res) {
  const word = req.query.word;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("OpenAI APIキーが設定されていません");
    return res.status(500).json({ error: "API key missing" });
  }

  try {
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "単語の意味、類語、簡単な言い換え、語源、文化的背景、雑学を日本語でJSON形式で返してください。",
          },
          {
            role: "user",
            content: word,
          },
        ],
      }),
    });

    const data = await completion.json();
    console.log("OpenAI応答:", JSON.stringify(data));

    const text = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(text);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("OpenAI API 呼び出しエラー:", err);
    return res.status(500).json({
      word,
      meaning: `${word} の意味を取得できませんでした。`,
      synonyms: [],
      simpleSynonyms: [],
      etymology: "語源情報が見つかりませんでした。",
      culturalBackground: "文化的背景情報が見つかりませんでした。",
      trivia: "雑学情報が見つかりませんでした。",
      images: [],
    });
  }
}
