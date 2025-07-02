import { useState } from "react";

const extractWords = (text) => {
  const stopwords = new Set([
    "the", "and", "was", "for", "are", "but", "not", "you", "all", "any", "can",
    "had", "her", "his", "how", "man", "our", "out", "say", "she", "too", "use",
    "a", "an", "by", "do", "if", "in", "into", "is", "it", "no", "of", "on", "or",
    "such", "that", "their", "then", "there", "these", "they", "this", "to",
    "with", "would", "as", "at", "be", "have", "from", "including", "what", "due",
    "see"
  ]);
  return [
    ...new Set(
      text
        .toLowerCase()
        .match(/\b[a-z]{3,}\b/g)
        ?.filter((w) => !stopwords.has(w)) || []
    )
  ];
};

const fetchWordData = async (word) => {
  try {
    const res = await fetch(`/api/word-info?word=${encodeURIComponent(word)}`);
    return await res.json();
  } catch (err) {
    console.error("API error for word:", word, err);
    return {
      word,
      meaning: `${word} の意味（取得失敗）`,
      synonyms: [],
      simpleSynonyms: [],
      etymology: "",
      culturalBackground: "",
      trivia: "",
      images: []
    };
  }
};

export default function App() {
  const [text, setText] = useState("");
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wordDataMap, setWordDataMap] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmitText = async () => {
    const extracted = extractWords(text);
    setWords(extracted);
    setCurrentIndex(0);
    setShowDetails(false);
    setLoading(true);
    const newMap = {};
    for (const w of extracted) {
      newMap[w] = await fetchWordData(w);
    }
    setWordDataMap(newMap);
    setLoading(false);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setShowDetails(false);
    setWordDataMap({});
    setWords([]);
  };

  const handleAnswer = (knew) => {
    if (!knew) setShowDetails(true);
    else setCurrentIndex((i) => i + 1);
  };

  const handleNext = () => setCurrentIndex((i) => i + 1);

  const word = words[currentIndex];
  const data = wordDataMap[word];
  const progress = Math.round((currentIndex / words.length) * 100);

  return (
    <div className="p-4 max-w-2xl mx-auto text-center">
      <h1 className="text-xl font-bold mb-2">英文を入力してください</h1>
      <textarea
        rows={4}
        className="w-full border rounded p-2 mb-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="space-x-2 mb-4">
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={handleSubmitText}
        >
          単語抽出して学習開始
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={handleReset}
        >
          進捗をリセット
        </button>
      </div>

      {loading && <p className="text-sm">データ取得中...</p>}

      {word && data && (
        <div className="bg-white p-4 rounded shadow text-left">
          <p className="text-sm text-gray-500">進捗: {progress}%</p>
          <h2 className="text-lg font-bold">{word}</h2>
          {!showDetails ? (
            <div className="space-x-2 mt-2">
              <button
                className="bg-blue-500 text-white px-4 py-1 rounded"
                onClick={() => handleAnswer(true)}
              >
                Yes
              </button>
              <button
                className="bg-gray-500 text-white px-4 py-1 rounded"
                onClick={() => handleAnswer(false)}
              >
                No
              </button>
            </div>
          ) : (
            <div className="mt-2 space-y-1">
              <p><strong>意味:</strong> {data.meaning}</p>
              <p><strong>類語:</strong> {data.synonyms.join(", ")}</p>
              <p><strong>簡単な言い換え:</strong> {data.simpleSynonyms.join(", ")}</p>
              <p><strong>語源:</strong> {data.etymology}</p>
              <p><strong>文化的背景:</strong> {data.culturalBackground}</p>
              <p><strong>雑学:</strong> {data.trivia}</p>
              {data.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {data.images.map((src, i) => (
                    <img key={i} src={src} className="w-full h-auto rounded" />
                  ))}
                </div>
              )}
              <button
                className="mt-2 bg-blue-500 text-white px-4 py-1 rounded"
                onClick={handleNext}
              >
                次の単語へ
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
