import { useEffect, useState } from 'react';
import { AlignLeft, X, BookOpen, Volume2 } from 'lucide-react';
import StrokeViewer from './StrokeViewer';

interface Token {
  word: string;
  pinyin: string;
  meaning: string;
  isPunctuation: boolean;
}

interface VocabItem {
  id: number;
  chinese: string;
  pinyin: string;
  vietnamese: string;
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

  // Dialog state for vocab mode
  const [selectedVocab, setSelectedVocab] = useState<VocabItem | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError('');
      setData(null);
      setDataType(null);
      setActiveToken(null);
      setSelectedVocab(null);
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
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4 relative">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 z-10 sticky top-0">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
          {dataType === 'vocab' ? <BookOpen size={20} className="text-indigo-600" /> : <AlignLeft size={20} className="text-indigo-600" />}
          {dataType === 'vocab' ? 'Nguyễn Đức Thuận 阮德顺' : 'Đọc đoạn văn'}
        </h2>
        <button
          onClick={onClose}
          className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-700 transition-colors"
          title="Đóng"
        >
          <X size={18} />
        </button>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(data as VocabData).map((item) => (
              <button
                key={item.id || item.chinese}
                onClick={() => {
                  setSelectedVocab(item);
                  setIsSpeaking(false);
                  window.speechSynthesis?.cancel();
                }}
                className="bg-white border border-gray-200 rounded-lg p-3 text-center shadow-sm hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md transition-all flex flex-col justify-center cursor-pointer"
              >
                <p className="text-3xl font-bold text-gray-800 mb-2">{item.chinese}</p>
                <p className="text-sm font-semibold text-indigo-600 mb-1">{item.pinyin}</p>
                <p className="text-xs text-gray-600 truncate px-1 w-full" title={item.vietnamese}>{item.vietnamese}</p>
              </button>
            ))}
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

      {/* Dialog for Vocab Mode */}
      {selectedVocab && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedVocab(null)}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl relative z-10 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Chi tiết từ vựng</h3>
              <button
                onClick={() => setSelectedVocab(null)}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <h4 className="text-3xl font-bold text-indigo-700">{selectedVocab.chinese}</h4>
                <button
                  type="button"
                  onClick={() => handleSpeak(selectedVocab.chinese)}
                  className={`rounded-full p-2 transition-colors ${isSpeaking ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
                  title={isSpeaking ? 'Dừng phát âm' : 'Phát âm'}
                >
                  <Volume2 size={20} />
                </button>
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-lg">
                  <span className="text-gray-500 mr-2 w-16 inline-block">Pinyin:</span>
                  <span className="font-semibold text-gray-800">{selectedVocab.pinyin}</span>
                </p>
                <p className="text-lg">
                  <span className="text-gray-500 mr-2 w-16 inline-block">Nghĩa:</span>
                  <span className="text-emerald-700 font-medium">{selectedVocab.vietnamese}</span>
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-600 mb-4">Cách viết (Từng chữ)</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  {(selectedVocab.chinese.match(/[\u4e00-\u9fa5]/g) || []).map((char, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="w-[104px] bg-slate-50 rounded-lg pt-2 border border-slate-100 shadow-sm">
                        <StrokeViewer character={char} />
                      </div>
                      <span className="mt-2 text-sm text-gray-500 font-medium">{char}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParagraphReader;
