export default async function handler(req, res) {
  const { word } = req.query;

  if (!word) return res.status(400).json({ error: 'word is required' });

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const GOOGLE_API_KEY = 'AIzaSyDA3_HPYFCdUavmWkJl1m0VkvHM4py1k24';
  const GOOGLE_CX = '27e106d19abd94bb0';

  const extractJsonFromText = (text) => {
    try {
      // ```json\n{...}\n``` の中を抽出
      const codeBlockMatch = text.match(/```json\\s*({[\\s\\S]*?})\\s*```/i);
      if (codeBlockMatch) {
        return JSON.parse(codeBlockMatch[1]);
      }

      // 通常の { ... } のみ抽出
      const braceMatch = text.match(/{[\s\S]*?}/);
      if (braceMatch) {
        return JSON.parse(braceMatch[0]);
      }

      return null;
    } catch {
      return null;
    }
  };

  try {
    // ✅ Google画像取得
    const imgRes = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${word}&searchType=image&num=2`
    );
    const imgJson = await imgRes.json();
    const images = imgJson.items?.map((item) => item.link) || [];

    // ✅ OpenAIから情報取得
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
            content: `英単語 "${word}" について以下の形式の JSON オブジェクトのみを返してください。  
前後に説明、文章、コードブロック（\`\`\`）などは一切加えず、  
**{ ... } の中身のみ**を純粋に出力してください：

{
  "meaning": "〜の意味を簡潔に",
  "synonyms": ["...", "...", "..."],
  "simpleSynonyms": ["...", "..."],
  "etymology": "語源（面白く）",
  "culturalBackground": "文化的背景（印象に残るように）",
  "trivia": "雑学・豆知識"
}`,
          },
        ],
        temperature: 0.7,
      }),
    });

    const aiJson = await openaiRes.json();
    const aiContent = aiJson.choices?.[0]?.message?.content || '';
    let parsed = extractJsonFromText(aiContent);

    if (!parsed) {
      parsed = {
        meaning: `${word} の簡易な意味は取得できませんでした。`,
        synonyms: [],
        simpleSynonyms: [],
        etymology: '語源情報が見つかりませんでした。',
        culturalBackground: '文化的背景情報が見つかりませんでした。',
        trivia: '雑学情報が見つかりませんでした。',
      };
    }

    res.status(200).json({
      word,
      ...parsed,
      images,
    });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: '情報取得に失敗しました。' });
  }
}
