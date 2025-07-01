// ✅ /api/word-info.js - OpenAI応答ログ付き・代替辞書構成あり・画像強化版

export default async function handler(req, res) {
  const { word } = req.query;

  if (!word) return res.status(400).json({ error: 'word is required' });

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const GOOGLE_API_KEY = 'AIzaSyDA3_HPYFCdUavmWkJl1m0VkvHM4py1k24';
  const GOOGLE_CX = '27e106d19abd94bb0';

  const fallbackDictionary = {
    identify: {
      meaning: '誰かや何かを特定すること。',
      synonyms: ['recognize', 'determine', 'verify'],
      simpleSynonyms: ['find', 'name'],
      etymology: 'ラテン語 identitas（同一性）+ facere（作る）に由来。',
      culturalBackground: '警察・科学・医療などの現場で頻繁に使用される単語。',
      trivia: 'ID（身分証明）の由来ともなる語である。'
    }
  };

  const extractJsonFromText = (text) => {
    try {
      const codeBlockMatch = text.match(/```json\s*({[\s\S]*?})\s*```/i);
      if (codeBlockMatch) return JSON.parse(codeBlockMatch[1]);

      const braceMatch = text.match(/{[\s\S]*?}/);
      if (braceMatch) return JSON.parse(braceMatch[0]);
    } catch (e) {
      console.log('❌ JSON parse error:', e);
    }
    return null;
  };

  try {
    // ✅ 画像検索クエリを強化
    const imgQuery = `${word} english meaning`;
    const imgRes = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(imgQuery)}&searchType=image&num=2`
    );
    const imgJson = await imgRes.json();
    const images = imgJson.items?.map((item) => item.link) || [];

    // ✅ OpenAI API呼び出し
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
            content: `英単語 "${word}" に関する情報を次の形式で返してください。
前後に解説やコードブロックは絶対に入れず、以下のJSONだけ返してください：
{
  "meaning": "...",
  "synonyms": ["...", "...", "..."],
  "simpleSynonyms": ["...", "..."],
  "etymology": "...",
  "culturalBackground": "...",
  "trivia": "..."
}`
          }
        ],
        temperature: 0.7
      })
    });

    const aiJson = await openaiRes.json();
    const aiContent = aiJson.choices?.[0]?.message?.content || '';

    console.log('✅ GPT full response:', aiJson);
    console.log('📦 Extracted content:', aiContent);

    let parsed = extractJsonFromText(aiContent);

    if (!parsed && fallbackDictionary[word.toLowerCase()]) {
      parsed = fallbackDictionary[word.toLowerCase()];
    }

    if (!parsed) {
      parsed = {
        meaning: `${word} の簡易な意味は取得できませんでした。`,
        synonyms: [],
        simpleSynonyms: [],
        etymology: '語源情報が見つかりませんでした。',
        culturalBackground: '文化的背景情報が見つかりませんでした。',
        trivia: '雑学情報が見つかりませんでした。'
      };
    }

    res.status(200).json({
      word,
      ...parsed,
      images
    });
  } catch (err) {
    console.error('❌ API全体エラー:', err);
    res.status(500).json({ error: '情報取得に失敗しました。' });
  }
}
