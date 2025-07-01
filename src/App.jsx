// src/App.jsx import React, { useState, useEffect } from "react"; import "./index.css";

export default function App() { const [text, setText] = useState(""); const [words, setWords] = useState([]); const [currentIndex, setCurrentIndex] = useState(0); const [knownWords, setKnownWords] = useState(() => { const saved = localStorage.getItem("knownWords"); return saved ? JSON.parse(saved) : []; }); const [wordDataMap, setWordDataMap] = useState({}); const [showDetails, setShowDetails] = useState(false); const [loading, setLoading] = useState(false);

const extractWords = (text) => { const stopwords = new Set([ "the", "and", "was", "for", "are", "but", "not", "you", "all", "any", "can", "had", "her", "his", "how", "man", "our", "out", "say", "she", "too", "use", "a", "an", "by", "do", "if", "in", "into", "is", "it", "no", "of", "on", "or", "such", "that", "their", "then", "there", "these", "they", "this", "to", "with", "would", "as", "at", "be", "have", "from", "including", "what", "due", "see" ]); return [...new Set( text.toLowerCase().match(/\b[a-z]{3,}\b/g)?.filter(w => !stopwords.has(w)) || [] )]; };

const fetchWordData = async (word) => { try { const res = await fetch(/api/word-info?word=${encodeURIComponent(word)}); return await res.json(); } catch { return { meaning: "取得エラー", synonyms: [], simpleSynonyms: [], etymology: "", culturalBackground: "", trivia: "", images: [] }; } };

const handleSubmitText = async () => { const extracted = extractWords(text); setWords(extracted); setCurrentIndex(0); setShowDetails(false); setLoading(true); const newMap = {}; for (const w of extracted) { newMap[w] = await fetchWordData(w); } setWordDataMap(newMap); setLoading(false); };

const currentWord = words[currentIndex]; const wordData = wordDataMap[currentWord] || {};

const handleResponse = (known) => { if (known) { setKnownWords(prev => [...new Set([...prev, currentWord])]); nextWord(); } else { setShowDetails(true); } };

const nextWord = () => { setShowDetails(false); setCurrentIndex(prev => prev + 1); };

const resetProgress = () => { setKnownWords([]); localStorage.removeItem("knownWords"); setWords([]); setCurrentIndex(0); setShowDetails(false); setText(""); setWordDataMap({}); };

const progress = words.length ? Math.round(((currentIndex + 1) / words.length) * 100) : 0;

return ( <div className="container"> <h2 className="title">英文を入力してください</h2> <textarea className="inputBox" placeholder="ここに英文を貼ってください" value={text} onChange={e => setText(e.target.value)} /> <div className="buttonRow"> <button onClick={handleSubmitText}>単語抽出して学習開始</button> <button onClick={resetProgress}>進捗をリセット</button> </div>

{loading && <p>データ取得中...</p>}

  {words.length > 0 && currentIndex < words.length && !knownWords.includes(currentWord) && (
    <div className="card">
      <p>進捗: {progress}%</p>
      <h3>{currentWord}</h3>
      {!showDetails ? (
        <div className="buttonRow">
          <button onClick={() => handleResponse(true)}>Yes</button>
          <button onClick={() => handleResponse(false)}>No</button>
        </div>
      ) : (
        <div>
          <p><strong>意味:</strong> {wordData.meaning}</p>
          <p><strong>類語:</strong> {wordData.synonyms?.join(", ")}</p>
          <p><strong>簡単な言い換え:</strong> {wordData.simpleSynonyms?.join(", ")}</p>
          <p><strong>語源:</strong> {wordData.etymology}</p>
          <p><strong>文化的背景:</strong> {wordData.culturalBackground}</p>
          <p><strong>雑学:</strong> {wordData.trivia}</p>
          <div className="imageRow">
            {wordData.images?.map((img, i) => (
              <img key={i} src={img} alt="img" className="image" />
            ))}
          </div>
          <button onClick={nextWord} className="nextButton">次の単語へ</button>
        </div>
      )}
    </div>
  )}

  {currentIndex >= words.length && (
    <p style={{ marginTop: 30 }}>すべての単語を学習しました！</p>
  )}
</div>

); }

