// ✅ /api/word-info.js - Google画像検索のみ使用版

export default async function handler(req, res) { const { word } = req.query; if (!word) return res.status(400).json({ error: 'word is required' });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; const GOOGLE_API_KEY = 'AIzaSyDA3_HPYFCdUavmWkJl1m0VkvHM4py1k24'; const GOOGLE_CX = '27e106d19abd94bb0';

// JSON抽出用関数 const extractJsonFromText = (text) => { try { const codeBlockMatch = text.match(/json\s*({[\s\S]*?})\s*/i); if (codeBlockMatch) return JSON.parse(codeBlockMatch[1]); const braceMatch = text.match(/{[\s\S]*?}/); if (braceMatch) return JSON.parse(braceMatch[0]); } catch (e) { console.log('❌ JSON parse error:', e); } return null; };

try { // 🔍 Google画像検索 const imgQuery = ${word} english meaning; const imgRes = await fetch( https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(imgQuery)}&searchType=image&num=2 ); const imgJson = await imgRes.json(); const images = imgJson.items?.map(item => item.link) || [];

console.log('🖼 画像URL一覧:', images);

// 🧠 OpenAIから情報取得
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
        content: `英単語 "${word}" に関する情報を以下のJSON形式で返してください。

前後に説明文やコードブロックは一切加えないでください。 { "meaning": "...", "synonyms": ["...", "...", "..."], "simpleSynonyms": ["...", "..."], "etymology": "...", "culturalBackground": "...", "trivia": "..." }` } ], temperature: 0.7 }) });

const aiJson = await openaiRes.json();
const aiContent = aiJson.choices?.[0]?.message?.content || '';

console.log('✅ GPT response object:', aiJson);
console.log('📦 GPT content:', aiContent);

let parsed = extractJsonFromText(aiContent);
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
  images,
});

} catch (err) { console.error('❌ API error:', err); res.status(500).json({ error: '情報取得に失敗しました。' }); } }

