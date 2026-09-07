import { useState, useEffect } from 'react';
import { pinyin } from 'pinyin-pro';
import InputArea from './components/InputArea';
import CharacterCard from './components/CharacterCard';
import { BookOpen } from 'lucide-react';
import RadicalSidebar from './components/RadicalSidebar';

function App() {
  const [rawText, setRawText] = useState(() => localStorage.getItem('hanzi_raw_text') || '我爱学习汉字');
  const [characters, setCharacters] = useState<string[]>([]);
  const [fullPinyin, setFullPinyin] = useState('');
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (rawText) {
      handleAnalyze(rawText);
    }
  }, []);

  const handleAnalyze = async (text: string) => {
    setRawText(text);
    localStorage.setItem('hanzi_raw_text', text);

    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    setCharacters(chineseChars);

    // Get Pinyin for full text
    setFullPinyin(pinyin(text, { type: 'string', toneType: 'symbol' }));

    // Fetch Vietnamese translation from MyMemory API
    try {
      setIsTranslating(true);
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=zh-CN|vi`);
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        setTranslation(data.responseData.translatedText);
      } else {
        setTranslation("Không thể dịch.");
      }
    } catch (e) {
      setTranslation("Lỗi kết nối dịch thuật.");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <RadicalSidebar />
      {/* Main Content */}
      <main className="px-2 mt-4 mx-auto max-w-4xl">
        <InputArea initialText={rawText} onAnalyze={handleAnalyze} />

        {/* Translation Banner */}
        {rawText && (
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-4 text-left">
            <p className="text-lg font-medium text-blue-600 leading-tight mb-1">{fullPinyin || '...'}</p>
            <p className="text-sm text-gray-700">
              {isTranslating ? 'Đang dịch...' : (translation || 'Không có bản dịch')}
            </p>
          </div>
        )}

        {characters.length > 0 ? (
          <div>
            <hr className="my-4 border-t-2 border-gray-100" />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {characters.map((char, index) => (
                <CharacterCard key={`${char}-${index}`} character={char} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-gray-400 mb-4 flex justify-center">
              <BookOpen size={48} className="opacity-50" />
            </div>
            <h3 className="text-xl font-medium text-gray-600">Không tìm thấy chữ Hán nào</h3>
            <p className="text-gray-500 mt-2">Vui lòng nhập văn bản tiếng Trung vào ô tìm kiếm ở trên.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
