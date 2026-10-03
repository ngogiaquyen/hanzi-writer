import { useEffect, useState, useRef, useMemo } from 'react';
import { AlignLeft, X, BookOpen, Volume2, Play, Square } from 'lucide-react';
import StrokeViewer from './StrokeViewer';

interface Token {
  word: string;
  pinyin: string;
  meaning: string;
  isPunctuation: boolean;
}

interface VocabItem {
  id?: number;
  chinese?: string;
  term?: string;
  pinyin: string;
  vietnamese?: string;
  meaning?: string;
  notes?: string;
  vocabulary_breakdown?: { word: string; pinyin: string; meaning: string }[];
  checked?: boolean;
}

type ParagraphData = Token[][];
type VocabData = VocabItem[];

interface ParagraphReaderProps {
  fileUrl: string;
  onClose: () => void;
}

const ParagraphReader: React.FC<ParagraphReaderProps> = ({ fileUrl, onClose }) => {
  const [data, setData] = useState<ParagraphData | VocabData | null>(null);
  const [dataType, setDataType] = useState<'paragraph' | 'vocab' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Tooltip state for paragraph mode
  const [activeToken, setActiveToken] = useState<{ token: Token, rect: DOMRect } | null>(null);

  // Speak state for vocab mode
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const listToPlayRef = useRef<VocabData>([]);

  const storageKey = `vocab-checked-${fileUrl}`;
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      setCheckedItems(stored ? JSON.parse(stored) : {});
    } catch {
      setCheckedItems({});
    }
  }, [storageKey]);

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError('');
      setData(null);
      setDataType(null);
      setActiveToken(null);
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to load data');
        const jsonData = await response.json();

        if (Array.isArray(jsonData) && jsonData.length > 0) {
          if (Array.isArray(jsonData[0])) {
            setDataType('paragraph');
          } else {
            setDataType('vocab');
          }
        } else if (Array.isArray(jsonData) && jsonData.length === 0) {
          setError('Dữ liệu trống.');
        }
        setData(jsonData);
      } catch (err) {
        setError('Không tải được dữ liệu.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fileUrl]);

  // Click outside tooltip for paragraph
  useEffect(() => {
    if (dataType !== 'paragraph') return;
    const handleClickOutside = () => setActiveToken(null);
    if (activeToken) {
      setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeToken, dataType]);

  const handleTokenClick = (e: React.MouseEvent, token: Token) => {
    e.stopPropagation();
    if (token.isPunctuation) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setActiveToken({ token, rect });
  };

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    
    // Lưu reference để tránh Chrome garbage collection bug
    (window as any)._currentUtterance = utterance;
    
    window.speechSynthesis.speak(utterance);
  };

  const sortedVocabData = useMemo(() => {
    const vocabData = dataType === 'vocab' && data ? (data as VocabData) : [];
    return [...vocabData].sort((a, b) => {
      const idA = a.chinese || a.term || '';
      const idB = b.chinese || b.term || '';
      const isCheckedA = !!checkedItems[idA];
      const isCheckedB = !!checkedItems[idB];
      if (isCheckedA === isCheckedB) return 0;
      return isCheckedA ? 1 : -1;
    });
  }, [data, dataType, checkedItems]);

  useEffect(() => {
    listToPlayRef.current = sortedVocabData;
  }, [sortedVocabData]);

  useEffect(() => {
    if (!isAutoPlaying || !('speechSynthesis' in window)) {
      window.speechSynthesis?.cancel();
      return;
    }
    
    let isCancelled = false;
    let currentIndex = 0;

    const playNext = () => {
      if (isCancelled) return;
      const list = listToPlayRef.current;
      
      // Skip checked items if they are at the bottom, or just play them all? Let's play all.
      // Or maybe stop if it's checked? We'll play all.
      if (currentIndex >= list.length) {
        setIsAutoPlaying(false);
        return;
      }
      
      const item = list[currentIndex];
      const text = item.chinese || item.term || '';
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
      
      // Lưu reference để tránh Chrome garbage collection bug
      (window as any)._currentUtterance = utterance;
      
      utterance.onend = () => {
        if (!isCancelled) {
          currentIndex++;
          setTimeout(playNext, 1200); // 1.2s pause between sentences
        }
      };
      utterance.onerror = () => {
        if (!isCancelled) setIsAutoPlaying(false);
      };
      window.speechSynthesis.speak(utterance);
    };

    window.speechSynthesis.cancel();
    playNext();

    return () => {
      isCancelled = true;
      window.speechSynthesis?.cancel();
    };
  }, [isAutoPlaying]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4 relative">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 z-10 sticky top-0">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
          {dataType === 'vocab' ? <BookOpen size={20} className="text-indigo-600" /> : <AlignLeft size={20} className="text-indigo-600" />}
          {dataType === 'vocab' ? 'Nguyễn Đức Thuận 阮德顺' : 'Đọc đoạn văn'}
        </h2>
        
        <div className="flex items-center gap-2">
          {dataType === 'vocab' && (
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-sm font-medium ${isAutoPlaying ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
              title={isAutoPlaying ? "Dừng tự động đọc" : "Tự động đọc"}
            >
              {isAutoPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              <span className="hidden sm:inline">{isAutoPlaying ? "Dừng" : "Tự đọc"}</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-700 transition-colors"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div
        className="p-6 bg-slate-50 min-h-[300px]"
        onScroll={() => setActiveToken(null)}
      >
        {isLoading && <p className="text-center text-gray-500 mt-10">Đang tải dữ liệu...</p>}
        {error && <p className="text-center text-red-500 mt-10">{error}</p>}

        {dataType === 'paragraph' && data && (
          <div className="space-y-6 text-xl leading-loose text-gray-800">
            {(data as ParagraphData).map((para, i) => (
              <p key={i} className="indent-8 text-justify">
                {para.map((token, j) => {
                  if (token.isPunctuation) {
                    return <span key={j}>{token.word}</span>;
                  }
                  return (
                    <span
                      key={j}
                      onClick={(e) => handleTokenClick(e, token)}
                      className="cursor-pointer hover:bg-indigo-100 hover:text-indigo-700 transition-colors rounded-sm mx-[1px]"
                    >
                      {token.word}
                    </span>
                  );
                })}
              </p>
            ))}
          </div>
        )}

        {dataType === 'vocab' && data && (
            <div className="flex flex-col">
              {sortedVocabData.map((item, idx) => {
                const cn = item.chinese || item.term || '';
                const vn = item.vietnamese || item.meaning || '';
                const isChecked = !!checkedItems[cn];

                return (
                  <div
                    key={item.id || cn || idx}
                    className={`w-full text-left p-5 rounded-xl shadow-sm mb-4 flex flex-col gap-3 group transition-all duration-300 bg-white ${isChecked ? 'border-2 border-emerald-400 ring-2 ring-emerald-50' : 'border border-gray-200/60'}`}
                  >
                    <div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">{cn}</span>
                            <button
                              onClick={() => handleSpeak(cn)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                              title="Phát âm"
                            >
                              <Volume2 size={18} />
                            </button>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCheck(cn)}
                            className="w-5 h-5 cursor-pointer accent-emerald-500 rounded"
                          />
                        </div>
                        <span className="text-sm font-medium text-indigo-600">{item.pinyin}</span>
                      </div>
                      <p className="text-base text-emerald-700 font-medium mt-1.5">{vn}</p>
                    </div>

                  {item.notes && (
                    <div className="text-sm text-gray-700 bg-amber-50/50 p-3 rounded-lg border border-amber-100/50 w-full mt-1">
                      <span className="font-semibold text-amber-600 mr-2">Ghi chú:</span>
                      {item.notes}
                    </div>
                  )}

                  {item.vocabulary_breakdown && item.vocabulary_breakdown.length > 0 && (
                    <div className="w-full pt-3 border-t border-gray-100 mt-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Từ vựng cấu thành</p>
                      <div className="flex flex-col gap-2">
                        {item.vocabulary_breakdown.map((vb, vidx) => (
                          <div key={vidx} className="bg-slate-50/80 p-2.5 rounded-lg flex flex-col gap-1 border border-slate-100/80">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-gray-700 text-sm">{vb.word}</span>
                              <span className="text-indigo-400 font-medium text-xs">[{vb.pinyin}]</span>
                            </div>
                            <span className="text-gray-600 text-xs leading-snug">{vb.meaning}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
        )}
      </div>

      {/* Tooltip for paragraph mode */}
      {dataType === 'paragraph' && activeToken && (() => {
        const isNearTop = activeToken.rect.top < 220;
        return (
          <div
            className={`fixed z-[60] bg-white border border-gray-200 shadow-xl rounded-xl p-4 pointer-events-none transform -translate-x-1/2 min-w-[160px] max-w-[320px] ${
              isNearTop ? 'translate-y-3' : '-translate-y-[calc(100%+12px)]'
            }`}
            style={{
              top: isNearTop ? activeToken.rect.bottom : activeToken.rect.top,
              left: activeToken.rect.left + (activeToken.rect.width / 2)
            }}
          >
            <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-gray-200 transform rotate-45 ${
              isNearTop ? 'top-0 -translate-y-1/2 border-t border-l' : 'bottom-0 translate-y-1/2 border-b border-r'
            }`}></div>
            <div className="relative z-10 text-center">
              <p className="font-bold text-xl text-indigo-700">{activeToken.token.pinyin}</p>
              <p className="text-sm font-medium text-gray-700 mt-1 mb-2 border-t border-gray-100 pt-2">{activeToken.token.meaning}</p>
              
              {(activeToken.token.word.match(/[\u4e00-\u9fa5]/g) || []).length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mt-3 border-t border-gray-100 pt-3">
                  {(activeToken.token.word.match(/[\u4e00-\u9fa5]/g) || []).map((char, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="w-[70px] h-[70px] bg-slate-50 rounded-lg border border-slate-100 shadow-sm flex justify-center items-center overflow-hidden">
                         <div className="transform scale-[0.75] -mb-3">
                           <StrokeViewer character={char} />
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}


    </div>
  );
};

export default ParagraphReader;
