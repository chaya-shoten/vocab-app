// /api/word-info.js import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY, }); const openai = new OpenAIApi(configuration);

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; const GOOGLE_CX = process.env.GOOGLE_CX;

async function fetchOpenAIContent(word) { try { const prompt = ${word} という英単語について、以下の情報を日本語で簡潔に出力してください：\n1. 意味（簡単な日本語訳）\n2. 類語（英語で3語）\n3. 簡単な言い換え（英語で2語）\n4. 語源（ラテン語などがあれば）\n5. 文化的背景（どんな場面で使われるか、歴史的背景など）\n6. 雑学（面白い事実など1つ）;

const completion = await openai.createChatCompletion({
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.7,
});

const result = completion.data.choices[0].message.content;

const meaning = result.match(/1\. .*?[\s\S]*?(?=2\.|$)/)?.[0].replace(/^1\.\s*/, '').trim();
const synonyms = result.match(/2\. .*?[\s\S]*?(?=3\.|$)/)?.[0].replace(/^2\.\s*/, '').split(',').map(s => s.trim());
const simpleSynonyms = result.match(/3\. .*?[\s\S]*?(?=4\.|$)/)?.[0].replace(/^3\.\s*/, '').split(',').map(s => s.trim());
const etymology = result.match(/4\. .*?[\s\S]*?(?=5\.|$)/)?.[0].replace(/^4\.\s*/, '').trim();
const culturalBackground = result.match(/5\. .*?[\s\S]*?(?=6\.|$)/)?.[0].replace(/^5\.\s*/, '').trim();
const trivia = result.match(/6\. .*$/)?.[0].replace(/^6\.\s*/, '').trim();

return { meaning, synonyms, simpleSynonyms, etymology, culturalBackground, trivia };

} catch (err) { console.error('OpenAI error:', err); return null; } }

async function fetchGoogleImages(word) { try { const searchUrl = https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${word}&searchType=image&num=3; const res = await fetch(searchUrl); const data = await res.json(); return data.items?.map(item => item.link) || []; } catch (err) { console.error('Image fetch error:', err); return []; } }

export default async function handler(req, res) { const { word } = req.query;

if (!word) { return res.status(400).json({ error: 'word parameter is required' }); }

let gptResult = await fetchOpenAIContent(word); const images = await fetchGoogleImages(word);

if (!gptResult) { gptResult = { meaning: ${word} の簡易な意味は取得できませんでした。, synonyms: [], simpleSynonyms: [], etymology: '語源情報が見つかりませんでした。', culturalBackground: '文化的背景情報が見つかりませんでした。', trivia: '雑学情報が見つかりませんでした。', }; }

res.status(200).json({ word, ...gptResult, images, }); }

