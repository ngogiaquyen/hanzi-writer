import { useState, useEffect, useRef } from 'react';
import { pinyin } from 'pinyin-pro';
import InputArea from './components/InputArea';
import CharacterCard from './components/CharacterCard';
import { BookOpen, Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [dictionary, setDictionary] = useState<Record<string, CharacterEntry>>({});
  const [dictionaryList, setDictionaryList] = useState<CharacterEntry[]>([]);

  // Touch swipe state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  useEffect(() => {
    // Load dictionary globally to allow resolving characters quickly
    fetch('/characters/characters.json')
      .then(res => res.json())
      .then((data: CharacterEntry[]) => {
        const dict: Record<string, CharacterEntry> = {};
        data.forEach(entry => dict[entry.hanzi] = entry);
        setDictionary(dict);
        setDictionaryList(data);
      })
      .catch(console.error);

    if (rawText) {
      handleAnalyze(rawText);
    }
  }, []);

  const handleAnalyze = async (text: string, fromSelection: boolean = false) => {
    if (!fromSelection) {
      setSelectedCharacter(null);
    }
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

  const createDummyEntry = (char: string): CharacterEntry => ({
    hanzi: char,
    pinyin: pinyin(char, { toneType: 'symbol', type: 'string' }),
    sinoViet: '',
    meaningVi: 'Đang tải hoặc chưa có',
    strokeCount: 0,
    traditional: null,
    radicals: [],
    monolithic: false,
    mnemonic: '',
    strokeHint: ''
  });

  const handleSelectCharacter = (entry: CharacterEntry) => {
    setSelectedCharacter(entry);
    setIsSpeakingSelectedCharacter(false);
    window.speechSynthesis?.cancel();
    void handleAnalyze(entry.hanzi, true);
  };

  const handleSelectFromGrid = (char: string) => {
    const entry = dictionary[char] || createDummyEntry(char);
    setSelectedCharacter(entry);
    setIsSpeakingSelectedCharacter(false);
    window.speechSynthesis?.cancel();
  };

  const getSwipeContext = () => {
    if (characters.length > 1) {
      return characters;
    }
    if (dictionaryList.length > 0) {
      return dictionaryList.map(e => e.hanzi);
    }
    return characters;
  };

  const handlePrevCharacter = () => {
    if (!selectedCharacter) return;
    const context = getSwipeContext();
    if (context.length <= 1) return;

    const currentIndex = context.indexOf(selectedCharacter.hanzi);
    if (currentIndex > 0) {
      handleSelectFromGrid(context[currentIndex - 1]);
    } else if (currentIndex === 0) {
      handleSelectFromGrid(context[context.length - 1]);
    } else {
      handleSelectFromGrid(context[0]);
    }
  };

  const handleNextCharacter = () => {
    if (!selectedCharacter) return;
    const context = getSwipeContext();
    if (context.length <= 1) return;

    const currentIndex = context.indexOf(selectedCharacter.hanzi);
    if (currentIndex >= 0 && currentIndex < context.length - 1) {
      handleSelectFromGrid(context[currentIndex + 1]);
    } else {
      handleSelectFromGrid(context[0]);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNextCharacter();
    } else if (isRightSwipe) {
      handlePrevCharacter();
    }
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
          <section 
            className="mb-4 rounded-xl border border-violet-100 bg-white p-4 text-left shadow-sm relative overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Swipe Indicators */}
            {(characters.length > 1 || dictionaryList.length > 1) && (
              <>
                <button 
                  onClick={handlePrevCharacter}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1 rounded-r-md shadow-sm border border-l-0 border-gray-100 text-gray-400 hover:text-violet-600 transition-colors z-10"
                  aria-label="Chữ trước"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={handleNextCharacter}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1 rounded-l-md shadow-sm border border-r-0 border-gray-100 text-gray-400 hover:text-violet-600 transition-colors z-10"
                  aria-label="Chữ tiếp theo"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            <div className="flex items-start gap-4 border-b border-gray-100 pb-3 pl-6 pr-6">
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
            <div className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2 px-2">
              <p><strong className="text-gray-500">Số nét:</strong> {selectedCharacter.strokeCount}</p>
              <p><strong className="text-gray-500">Phồn thể:</strong> {selectedCharacter.traditional || 'Giản thể'}</p>
              <p><strong className="text-gray-500">HSK:</strong> {selectedCharacter.hskLevel ? `HSK ${selectedCharacter.hskLevel}` : 'Chưa phân loại'}</p>
              <p><strong className="text-gray-500">Bộ thủ:</strong> {selectedCharacter.radicals?.join('、') || 'Chưa có'}</p>
              <p><strong className="text-gray-500">Đơn thể:</strong> {selectedCharacter.monolithic ? 'Có' : 'Không'}</p>
            </div>
            <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 text-sm text-gray-700 px-2">
              <p><strong className="text-gray-500">Mẹo nhớ:</strong> {selectedCharacter.mnemonic || 'Chưa có'}</p>
              <p><strong className="text-gray-500">Hướng dẫn nét:</strong> {selectedCharacter.strokeHint || 'Chưa có'}</p>
            </div>
            {characters.length > 1 && (
               <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                 {characters.map((char, idx) => (
                   <div key={idx} className={`h-1.5 rounded-full transition-all ${selectedCharacter.hanzi === char ? 'w-4 bg-violet-500' : 'w-1.5 bg-gray-200'}`} />
                 ))}
               </div>
            )}
          </section>
        )}

        {characters.length > 1 || (characters.length === 1 && selectedCharacter?.hanzi !== characters[0]) ? (
          <div>
            <hr className="my-4 border-t-2 border-gray-100" />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {characters.map((char, index) => (
                <CharacterCard 
                  key={`${char}-${index}`} 
                  character={char} 
                  isSelected={selectedCharacter?.hanzi === char}
                  onClick={() => handleSelectFromGrid(char)}
                />
              ))}
            </div>
          </div>
        ) : characters.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-gray-400 mb-4 flex justify-center">
              <BookOpen size={48} className="opacity-50" />
            </div>
            <h3 className="text-xl font-medium text-gray-600">Không tìm thấy chữ Hán nào</h3>
            <p className="text-gray-500 mt-2">Vui lòng nhập văn bản tiếng Trung vào ô tìm kiếm ở trên.</p>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default App;
