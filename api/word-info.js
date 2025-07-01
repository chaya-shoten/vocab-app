export default async function handler(req, res) {
  const { word } = req.query;

  if (!word) return res.status(400).json({ error: 'word is required' });

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const GOOGLE_API_KEY = 'AIzaSyDA3_HPYFCdUavmWkJl1m0VkvHM4py1k24';
  const GOOGLE_CX = '27e106d19abd94bb0';

  try {
    // ✅ 画像をGoogleから取得
    const imgRes = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${word}&searchType=image&num=2`
    );
    const imgJson = await imgRes.json();
    const images = imgJson.items?.map((item) => item.link) || [];

    // ✅ OpenAIで情報を取得
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: `英単語 "${word}" について、以下の情報をそれぞれ200文字以内で日本語で説明してください：
1. 意味（簡潔に）
2. 類語（3つ）
3. 簡単な言い換え（2つ）
4. 語源（簡単に）
5. 文化的背景（面白く）
6. 雑学（記憶に残る豆知識）

形式はJSONで：
{
  "meaning": "...",
  "synonyms": ["...", "...", "..."],
  "simpleSynonyms": ["...", "..."],
  "etymology": "...",
  "culturalBackground": "...",
  "trivia": "..."
}`,
          },
        ],
        temperature: 0.7,
      }),
    });

    const aiJson = await openaiRes.json();
    const aiContent = aiJson.choices?.[0]?.message?.content;

    let parsed = null;
    try {
      parsed = JSON.parse(aiContent);
    } catch (e) {
      parsed = {
        meaning: `${word} の意味（取得失敗）`,
        synonyms: [],
        simpleSynonyms: [],
        etymology: '',
        culturalBackground: '',
        trivia: '',
      };
    }

    res.status(200).json({
      word,
      ...parsed,
      images,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OpenAIまたはGoogleの取得に失敗しました' });
  }
}
