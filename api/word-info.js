// /api/word-info.js

import { GoogleGenerativeAI } from "@google/generative-ai"; import OpenAI from "openai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY); const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const getGoogleImages = async (word) => { try { const cx = process.env.CUSTOM_SEARCH_CX; const key = process.env.CUSTOM_SEARCH_API_KEY; const res = await fetch(https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(word)}&searchType=image&num=5&key=${key}&cx=${cx}); const data = await res.json(); return data.items?.map(item => item.link) || []; } catch (err) { console.error("Google Images error:", err); return []; } };

const getOpenAIData = async (word) => { try { const prompt = 以下の英単語に対して、日本語で以下の情報を順番に出力してください：\n\n1. 意味（中学生でもわかるくらいの簡単な日本語）\n2. 類語（英語で3つ）\n3. 簡単な言い換え（英語で2つ）\n4. 語源（日本語）\n5. 文化的背景（日本語）\n6. 雑学（日本語）\n\n単語: ${word}; const chat = await openai.chat.completions.create({ model: "gpt-4", messages: [{ role: "user", content: prompt }], temperature: 0.7, }); return chat.choices[0].message.content; } catch (err) { console.error("OpenAI error:", err); return null; } };

const parseResponse = (word, content) => { try { const meaning = content.match(/1..?\n：:/)?.[1]?.trim() || ""; const synonyms = content.match(/2..?\n：:/)?.[1]?.split(/[、,]/).map(s => s.trim()).filter(Boolean) || []; const simpleSynonyms = content.match(/3..?\n：:/)?.[1]?.split(/[、,]/).map(s => s.trim()).filter(Boolean) || []; const etymology = content.match(/4..?\n：:/)?.[1]?.trim() || ""; const culturalBackground = content.match(/5..?\n：:/)?.[1]?.trim() || ""; const trivia = content.match(/6..?\n：:/)?.[1]?.trim() || ""; return { word, meaning, synonyms, simpleSynonyms, etymology, culturalBackground, trivia }; } catch (err) { console.error("Parse error:", err); return null; } };

export default async function handler(req, res) { const { word } = req.query; if (!word) return res.status(400).json({ error: "No word provided." });

try { const gptContent = await getOpenAIData(word); const parsed = gptContent ? parseResponse(word, gptContent) : null; const images = await getGoogleImages(word);

if (!parsed || !parsed.meaning) {
  return res.json({
    word,
    meaning: `${word} の簡易な意味は取得できませんでした。`,
    synonyms: [],
    simpleSynonyms: [],
    etymology: "語源情報が見つかりませんでした。",
    culturalBackground: "文化的背景情報が見つかりませんでした。",
    trivia: "雑学情報が見つかりませんでした。",
    images,
  });
}

res.json({ ...parsed, images });

} catch (err) { console.error("Handler error:", err); res.status(500).json({ error: "Internal error." }); } }

