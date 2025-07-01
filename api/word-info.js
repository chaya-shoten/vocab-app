import axios from 'axios';

export default async function handler(req, res) {
  const { word } = req.query;
  if (!word) return res.status(400).json({ error: 'word is required' });

  const API_KEY = 'AIzaSyDA3_HPYFCdUavmWkJl1m0VkvHM4py1k24';
  const CX = '27e106d19abd94bb0';

  try {
    const imageRes = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: API_KEY,
        cx: CX,
        q: word,
        searchType: 'image',
        num: 2
      }
    });

    const images = imageRes.data.items.map(item => item.link);

    const wikiRes = await axios.get(`https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`).catch(() => null);

    const summary = wikiRes?.data?.extract || `${word} に関する情報はWikipediaで見つかりませんでした。`;
    const trimmed = summary.length > 180 ? summary.slice(0, 160) + '...' : summary;

    res.status(200).json({
      word,
      meaning: `${word} の日本語の意味（仮）です。`,
      synonyms: ['類語1', '類語2'],
      simpleSynonyms: ['簡単な言い換え'],
      etymology: trimmed,
      culturalBackground: trimmed,
      trivia: trimmed,
      images
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'データ取得に失敗しました' });
  }
}
