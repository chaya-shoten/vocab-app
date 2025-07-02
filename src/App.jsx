// App.jsx（最新版：fetchエラー対策込み + 読み込み安定化）

import React, { useState } from "react";

const extractWords = (text) => { const stopwords = new Set([ "the", "and", "was", "for", "are", "but", "not", "you", "all", "any", "can", "had", "her", "his", "how", "man", "our", "out", "say", "she", "too", "use", "a", "an", "by", "do", "if", "in", "into", "is", "it", "no", "of", "on", "or", "such", "that", "their", "then", "there", "these", "they", "this", "to", "with", "would", "as", "at", "be", "have", "from", "including", "what", "due", "see" ]); return [...new Set( text.toLowerCase().match(/\b[a-z]{3,}\b/g)?.filter(w => !stopwords.has(w)) || [] )]; };

const fetchWordData = async (word) => { try { const res = await fetch(/api/word-info?word=${encodeURIComponent(word)}); if (!res.ok) throw new Error("API failed"); return await res.json(); } catch (err) { console.error("❌ fetch error:", word, err); return { word, meaning: ${word} の情報を取得できませんでした。, synonyms: [], simpleSynonyms: [], etymology: "語源情報が見つかりませんでした。", culturalBackground: "文化的背景情報が見つかりませんでした。", trivia: "雑学情報が見つかりませんでした。", images: [], }; } };

export default function App() { const [text, setText] = useState(""); const [words, setWords] = useState([]); const [wordDataMap, setWordDataMap] = useState({}); const [currentIndex, setCurrentIndex] = useState(0); const [loading, setLoading] = useState(false); const [showDetails, setShowDetails] = useState(false);

const handleSubmitText = async () => { const extracted = extractWords(text); setWords(extracted); setCurrentIndex(0); setShowDetails(false); setLoading(true); const newMap = {}; for (const w of extracted) { newMap[w] = await fetchWordData(w); } setWordDataMap(newMap); setLoading(false); };

const handleNo = () => { setShowDetails(true); };

const handleNext = () => { setCurrentIndex((prev) => prev + 1); setShowDetails(false); };

const currentWord = words[currentIndex]; const currentData = wordDataMap[currentWord] || {};

return ( <div style={{ padding: "20px", fontFamily: "sans-serif" }}> <h2>英文を入力してください</h2> <textarea rows={6} cols={60} value={text} onChange={(e) => setText(e.target.value)} /> <br /> <button onClick={handleSubmitText}>単語抽出して学習開始</button> <button onClick={() => { setWords([]); setWordDataMap({}); setCurrentIndex(0); }}>進捗をリセット</button>

{loading && <p>データ取得中...</p>}

  {!loading && currentWord && (
    <div style={{ marginTop: 20, background: "#f9f9f9", padding: 20, borderRadius: 8 }}>
      <p>進捗: {Math.round(((currentIndex + 1) / words.length) * 100)}%</p>
      <h3>{currentWord}</h3>
      {!showDetails ? (
        <>
          <p>この単語はわかりますか？</p>
          <button onClick={handleNext}>Yes</button>
          <button onClick={handleNo}>No</button>
        </>
      ) : (
        <>
          <p><strong>意味:</strong> {currentData.meaning}</p>
          <p><strong>類語:</strong> {currentData.synonyms?.join(", ")}</p>
          <p><strong>簡単な言い換え:</strong> {currentData.simpleSynonyms?.join(", ")}</p>
          <p><strong>語源:</strong> {currentData.etymology}</p>
          <p><strong>文化的背景:</strong> {currentData.culturalBackground}</p>
          <p><strong>雑学:</strong> {currentData.trivia}</p>
          {currentData.images?.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {currentData.images.map((url, i) => (
                <img key={i} src={url} alt="" width="100" style={{ borderRadius: 4 }} />
              ))}
            </div>
          )}
          <button onClick={handleNext}>次の単語へ</button>
        </>
      )}
    </div>
  )}
</div>

); }

