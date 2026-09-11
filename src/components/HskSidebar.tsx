import { useEffect, useMemo, useRef, useState } from 'react';
import { BookMarked, Check, Copy, Search, X } from 'lucide-react';

interface HskWord {
  id: number;
  hanzi: string;
  pinyin: string;
  translations: string[];
}

interface HskSidebarProps {
  onSelectWord: (word: string) => void;
}

const levels = [1, 2, 3, 4, 5, 6] as const;
type HskLevel = (typeof levels)[number];

interface VietnameseMeaningProps {
  english: string;
}

const VietnameseMeaning: React.FC<VietnameseMeaningProps> = ({ english }) => {
  const [meaning, setMeaning] = useState('');
  const [shouldTranslate, setShouldTranslate] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cachedMeaning = localStorage.getItem(`hanzi_translation_${english}`);
    if (cachedMeaning) {
      setMeaning(cachedMeaning);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldTranslate(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px' },
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [english]);

  useEffect(() => {
    if (!shouldTranslate || meaning) return;

    const translateMeaning = async () => {
      try {
        const response = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(english)}&langpair=en|vi`,
        );
        const data = await response.json();
        const translatedText = data?.responseData?.translatedText?.trim();
        if (translatedText) {
          setMeaning(translatedText);
          localStorage.setItem(`hanzi_translation_${english}`, translatedText);
        }
      } catch {
        // Keep the Vietnamese column empty if the translation service is unavailable.
      }
    };

    translateMeaning();
  }, [english, meaning, shouldTranslate]);

  return (
    <span ref={containerRef} className="text-xs text-emerald-700 truncate" title={meaning}>
      {meaning || 'Đang dịch...'}
    </span>
  );
};

const HskSidebar: React.FC<HskSidebarProps> = ({ onSelectWord }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeLevel, setActiveLevel] = useState<HskLevel>(1);
  const [query, setQuery] = useState('');
  const [copiedWordId, setCopiedWordId] = useState<number | null>(null);
  const [wordsByLevel, setWordsByLevel] = useState<Partial<Record<HskLevel, HskWord[]>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || wordsByLevel[activeLevel]) return;

    const loadWords = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`/hsk-vocab-json/hsk-level-${activeLevel}.json`);
        if (!response.ok) throw new Error('Không thể tải dữ liệu');
        const words = (await response.json()) as HskWord[];
        setWordsByLevel((current) => ({ ...current, [activeLevel]: words }));
      } catch {
        setError('Không tải được danh sách từ. Bạn thử lại nhé.');
      } finally {
        setIsLoading(false);
      }
    };

    loadWords();
  }, [activeLevel, isOpen, wordsByLevel]);

  const filteredWords = useMemo(() => {
    const words = wordsByLevel[activeLevel] || [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return words;

    return words.filter((word) =>
      [word.hanzi, word.pinyin, ...word.translations].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [activeLevel, query, wordsByLevel]);

  const handleSelectWord = (word: string) => {
    onSelectWord(word);
    setIsOpen(false);
  };

  const handleCopyWord = async (event: React.MouseEvent, word: HskWord) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(word.hanzi);
      setCopiedWordId(word.id);
      window.setTimeout(() => setCopiedWordId(null), 1200);
    } catch {
      // Clipboard access can be unavailable outside a secure browser context.
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-[calc(50%+34px)] left-0 -translate-y-1/2 bg-amber-500 text-white py-6 w-[12px] flex items-center justify-center rounded-r-md shadow-md hover:bg-amber-600 transition-colors z-40 opacity-70 hover:opacity-100"
        title="Mở từ vựng HSK"
        aria-label="Mở từ vựng HSK"
      >
        <div className="w-[2px] h-4 bg-white/70 rounded-full" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-[88vw] max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Từ vựng HSK"
      >
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <BookMarked size={20} className="text-amber-600" />
              Từ vựng HSK
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
              title="Đóng"
              aria-label="Đóng từ vựng HSK"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm chữ, pinyin hoặc nghĩa..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              aria-label="Tìm từ vựng HSK"
            />
          </div>
        </div>

        <div className="flex gap-1 p-2 bg-amber-50 border-b border-amber-100">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
                activeLevel === level
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-800 hover:bg-amber-100'
              }`}
            >
              HSK {level}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 bg-slate-50">
          <span>HSK {activeLevel}</span>
          {!isLoading && wordsByLevel[activeLevel] && <span>{filteredWords.length} từ</span>}
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 px-3 pb-4">
          {isLoading && <p className="py-10 text-center text-sm text-gray-500">Đang tải từ vựng...</p>}
          {error && <p className="py-10 text-center text-sm text-red-500">{error}</p>}
          {!isLoading && !error && filteredWords.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-500">Không tìm thấy từ phù hợp.</p>
          )}
          {!isLoading && !error && filteredWords.length > 0 && (
            <div className="space-y-2">
              {filteredWords.map((word) => (
                <button
                  key={`${activeLevel}-${word.id}`}
                  onClick={() => handleSelectWord(word.hanzi)}
                  className="relative w-full text-left bg-white border border-gray-200 rounded-lg px-3 py-2.5 pb-6 hover:border-amber-400 hover:shadow-sm transition-all"
                  title={`Luyện viết ${word.hanzi}`}
                >
                  <span className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={(event) => handleCopyWord(event, word)}
                      className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                      title={`Sao chép ${word.hanzi}`}
                      aria-label={`Sao chép ${word.hanzi}`}
                    >
                      {copiedWordId === word.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-gray-800">{word.hanzi}</span>
                    <span className="text-sm text-amber-700">{word.pinyin}</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5 mt-0.5 text-xs">
                    <span className="min-w-0 truncate text-gray-500" title={word.translations[0]}>
                      {word.translations[0] || 'Chưa có nghĩa'}
                    </span>
                    <span className="shrink-0 text-gray-300">-</span>
                    <VietnameseMeaning english={word.translations[0] || ''} />
                  </div>
                  <span className="absolute right-3 bottom-2 text-[10px] font-medium text-gray-400">
                    #{(wordsByLevel[activeLevel] || []).findIndex((item) => item.id === word.id) + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default HskSidebar;