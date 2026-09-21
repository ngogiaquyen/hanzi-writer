import { useState, useEffect } from 'react';
import { pinyin } from 'pinyin-pro';
import InputArea from './components/InputArea';
import CharacterCard from './components/CharacterCard';
import { BookOpen, Volume2 } from 'lucide-react';
import RadicalSidebar from './components/RadicalSidebar';
import HskSidebar from './components/HskSidebar';
import HskPractice from './components/HskPractice';
import HskExportSidebar from './components/HskExportSidebar';
import CharacterDictionarySidebar from './components/CharacterDictionarySidebar';
import type { CharacterEntry } from './components/CharacterDictionarySidebar';
import StrokeViewer from './components/StrokeViewer';
import { translateChineseToVietnamese } from './utils/translation';

function App() {
  const [rawText, setRawText] = useState('我爱学习汉字');
  const [characters, setCharacters] = useState<string[]>([]);
  const [fullPinyin, setFullPinyin] = useState('');
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterEntry | null>(null);
  const [isSpeakingSelectedCharacter, setIsSpeakingSelectedCharacter] = useState(false);

  useEffect(() => {
    if (rawText) {
      handleAnalyze(rawText);
    }
  }, []);

  const handleAnalyze = async (text: string) => {
    setRawText(text);

    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    setCharacters(chineseChars);

    // Get Pinyin for full text
    setFullPinyin(pinyin(text, { type: 'string', toneType: 'symbol' }));

    try {
      setIsTranslating(true);
      const translatedText = await translateChineseToVietnamese(text);
      setTranslation(translatedText || 'Không có bản dịch');
    } catch {
      setTranslation('Không thể kết nối dịch thuật');
    } finally {
      setIsTranslating(false);
    }

  };

  const handleSelectCharacter = (entry: CharacterEntry) => {
    setSelectedCharacter(entry);
    setIsSpeakingSelectedCharacter(false);
    window.speechSynthesis?.cancel();
    void handleAnalyze(entry.hanzi);
  };

  const handleSpeakSelectedCharacter = () => {
    if (!('speechSynthesis' in window) || !selectedCharacter) return;

    window.speechSynthesis.cancel();
    if (isSpeakingSelectedCharacter) {
      setIsSpeakingSelectedCharacter(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(selectedCharacter.hanzi);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    utterance.onend = () => setIsSpeakingSelectedCharacter(false);
    utterance.onerror = () => setIsSpeakingSelectedCharacter(false);
    setIsSpeakingSelectedCharacter(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <RadicalSidebar />
      <HskSidebar onSelectWord={handleAnalyze} />
      <HskExportSidebar />
      <CharacterDictionarySidebar onSelectCharacter={handleSelectCharacter} />
      {/* Main Content */}
      <main className="px-2 mt-4 mx-auto max-w-4xl">
        <InputArea initialText={rawText} onAnalyze={handleAnalyze} />
        <HskPractice />

        {/* Translation Banner */}
        {rawText && (
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-4 text-left">
            <p className="text-lg font-medium text-blue-600 leading-tight mb-1">{fullPinyin || '...'}</p>
            <p className="text-sm text-gray-700">
              {isTranslating ? 'Đang dịch...' : (translation || 'Không có bản dịch')}
            </p>
          </div>
        )}

        {selectedCharacter && (
          <section className="mb-4 rounded-xl border border-violet-100 bg-white p-4 text-left shadow-sm">
            <div className="flex items-start gap-4 border-b border-gray-100 pb-3">
              <div className="w-[104px] shrink-0 rounded-lg bg-violet-50 pt-2">
                <StrokeViewer character={selectedCharacter.hanzi} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-gray-800">{selectedCharacter.pinyin}</p>
                  <button
                    type="button"
                    onClick={handleSpeakSelectedCharacter}
                    className={`rounded-full p-1.5 transition-colors ${isSpeakingSelectedCharacter ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500 hover:bg-violet-50 hover:text-violet-600'}`}
                    title={isSpeakingSelectedCharacter ? 'Dừng phát âm' : 'Phát âm tiếng Trung'}
                    aria-label={isSpeakingSelectedCharacter ? `Dừng phát âm ${selectedCharacter.hanzi}` : `Phát âm ${selectedCharacter.hanzi}`}
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
                <p className="text-sm text-violet-600">{selectedCharacter.sinoViet}</p>
                <p className="mt-1 text-sm text-emerald-700">{selectedCharacter.meaningVi || 'Chưa có nghĩa'}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
              <p><strong className="text-gray-500">Số nét:</strong> {selectedCharacter.strokeCount}</p>
              <p><strong className="text-gray-500">Phồn thể:</strong> {selectedCharacter.traditional || 'Giản thể'}</p>
              <p><strong className="text-gray-500">HSK:</strong> {selectedCharacter.hskLevel ? `HSK ${selectedCharacter.hskLevel}` : 'Chưa phân loại'}</p>
              <p><strong className="text-gray-500">Bộ thủ:</strong> {selectedCharacter.radicals.join('、') || 'Chưa có'}</p>
              <p><strong className="text-gray-500">Đơn thể:</strong> {selectedCharacter.monolithic ? 'Có' : 'Không'}</p>
            </div>
            <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 text-sm text-gray-700">
              <p><strong className="text-gray-500">Mẹo nhớ:</strong> {selectedCharacter.mnemonic || 'Chưa có'}</p>
              <p><strong className="text-gray-500">Hướng dẫn nét:</strong> {selectedCharacter.strokeHint || 'Chưa có'}</p>
            </div>
          </section>
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
