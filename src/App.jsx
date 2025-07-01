import React, { useState, useEffect } from "react";

export default function App() { const [text, setText] = useState(""); const [words, setWords] = useState([]); const [currentIndex, setCurrentIndex] = useState(0); const [knownWords, setKnownWords] = useState(() => { const saved = localStorage.getItem("knownWords"); return saved ? JSON.parse(saved) : []; }); const [wordDataMap, setWordDataMap] = useState({}); const [showDetails, setShowDetails] = useState(false); const [loading, setLoading] = useState(false);

const extractWords = (text) => { const stopwords = new Set([ "the", "and", "was", "for", "are", "but", "not", "you", "all", "any", "can", "had", "her", "his", "how", "man", "our", "out", "say", "she", "too", "use", "a", "an", "by", "do", "if", "in", "into", "is", "it", "no", "of", "on", "or", "such", "that", "their", "then", "there", "these", "they", "this", "to", "with", "would", "as", "at", "be", "have", "from", "including", "what", "due", "see" ]); return [...new Set( text.toLowerCase().match(/\b[a-z]{3,}\b/g)?.filter(w => !stopwords.has(w)) || [] )]; };

const fetchWordData = async (word) => { try { const res = await fetch(/api/word-info?word=${encodeURIComponent(word)}); return await res.json(); } catch (err) { console.error("API error for word:", word, err); return { word, meaning: ${word} の意味（取得失敗）, synonyms: [], simpleSynonyms: [], etymology: "", culturalBackground: "", trivia: "", images: [] }; } };

const handleSubmitText = async () => { const extracted = extractWords(text); setWords(extracted); setCurrentIndex(0); setShowDetails(false); setLoading(true);

const newMap = {};
const wordDataArray = await Promise.all(
  extracted.map(async (word) => {
    const data = await fetchWordData(word);
    return { word, data };
  })
);
wordDataArray.forEach(({ word, data }) => {
  newMap[word] = data;
});

setWordDataMap(newMap);
setLoading(false);

};

const currentWord = words[currentIndex]; const wordData = wordDataMap[currentWord];

const handleResponse = (known) => { if (known) { const updated = [...new Set([...knownWords, currentWord])]; setKnownWords(updated); nextWord(); } else { setShowDetails(true); } };

const nextWord = () => { setShowDetails(false); setCurrentIndex((prev) => prev + 1); };

const resetProgress = () => { setKnownWords([]); localStorage.removeItem("knownWords"); setWords([]); setCurrentIndex(0); setShowDetails(false); setText(""); };

const progress = words.length ? Math.round(((currentIndex + 1) / words.length) * 100) : 0;

return ( <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}> <h2 style={{ fontSize: 20 }}>英文を入力してください</h2> <textarea placeholder="ここに英文を貼ってください" value={text} onChange={(e) => setText(e.target.value)} style={{ width: "100%", height: 100, fontSize: 16 }} /> <div style={{ marginTop: 10 }}> <button onClick={handleSubmitText}>単語抽出して学習開始</button> <button onClick={resetProgress} style={{ marginLeft: 10 }}>進捗をリセット</button> </div>

{loading && <p>データ取得中...</p>}

  {words.length > 0 && currentIndex < words.length && !knownWords.includes(currentWord) && (
    <div style={{ marginTop: 20 }}>
      <p>進捗: {progress}%</p>
      <h3 style={{ fontSize: 24 }}>{currentWord}</h3>
      {!showDetails ? (
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => handleResponse(true)}>Yes</button>
          <button onClick={() => handleResponse(false)}>No</button>
        </div>
      ) : wordData ? (
        <div style={{ marginTop: 10, fontSize: 16 }}>
          <p><strong>意味:</strong> {wordData.meaning}</p>
          <p><strong>類語:</strong> {wordData.synonyms.join(", ")}</p>
          <p><strong>簡単な言い換え:</strong> {wordData.simpleSynonyms.join(", ")}</p>
          <p><strong>語源:</strong> {wordData.etymology}</p>
          <p><strong>文化的背景:</strong> {wordData.culturalBackground}</p>
          <p><strong>雑学:</strong> {wordData.trivia}</p>
          <div style={{ display: "flex", gap: 10, overflowX: "scroll" }}>
            {wordData.images.map((img, i) => (
              <img key={i} src={img} alt={`img-${i}`} style={{ height: 100 }} />
            ))}
          </div>
          <button onClick={nextWord} style={{ marginTop: 10 }}>次の単語へ</button>
        </div>
      ) : <p>この単語の情報は見つかりませんでした。</p>}
    </div>
  )}

  {currentIndex >= words.length && (
    <p style={{ marginTop: 30, fontSize: 18 }}>すべての単語を学習しました！</p>
  )}
</div>

); }

