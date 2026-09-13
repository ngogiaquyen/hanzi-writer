import { useEffect, useMemo, useState } from 'react';
import { Check, Lightbulb, RotateCcw, Sparkles, X } from 'lucide-react';
import cnchar from 'cnchar';
import 'cnchar-radical';
import { radicalDict } from '../utils/radicals';
import { translateChineseToVietnamese } from '../utils/translation';

interface HskWord {
  id: number;
  hanzi: string;
  pinyin: string;
  translations: string[];
}

type PracticeMode = 'recall' | 'choice';
type HskLevel = 1 | 2 | 3 | 4 | 5 | 6;

const levels: HskLevel[] = [1, 2, 3, 4, 5, 6];

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

const getRadicalHints = (word: string) =>
  Array.from(word).map((character) => {
    let radical = '';
    try {
      const result = cnchar.radical(character);
      if (Array.isArray(result) && result.length > 0) {
        radical = result[0].radical || '';
      } else if (typeof result === 'string') {
        radical = result;
      }
    } catch {
      // Some characters may not have radical data.
    }

    return { character, radical, meaning: radicalDict[radical] || '' };
  });

const HskPractice: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<PracticeMode>('choice');
  const [level, setLevel] = useState<HskLevel>(1);
  const [words, setWords] = useState<HskWord[]>([]);
  const [currentWord, setCurrentWord] = useState<HskWord | null>(null);
  const [options, setOptions] = useState<HskWord[]>([]);
  const [answer, setAnswer] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [meaning, setMeaning] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    const loadWords = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`/hsk-vocab-json/hsk-level-${level}.json`);
        if (!response.ok) throw new Error('Không thể tải dữ liệu');
        const loadedWords = (await response.json()) as HskWord[];
        setWords(loadedWords);
      } catch {
        setWords([]);
        setError('Không tải được từ vựng HSK. Bạn thử lại nhé.');
      } finally {
        setIsLoading(false);
      }
    };

    loadWords();
  }, [level]);

  const nextQuestion = (availableWords = words) => {
    if (!availableWords.length) return;

    const nextWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    setCurrentWord(nextWord);
    setOptions(shuffle([nextWord, ...shuffle(availableWords.filter((word) => word.id !== nextWord.id)).slice(0, 3)]));
    setAnswer('');
    setSelectedAnswer('');
    setIsChecked(false);
    setShowHint(false);
  };

  useEffect(() => {
    nextQuestion(words);
    setScore({ correct: 0, total: 0 });
  }, [words]);

  useEffect(() => {
    if (!currentWord) return;

    const sourceMeaning = currentWord.translations[0] || '';
    setMeaning(sourceMeaning);
    const translateMeaning = async () => {
      try {
        const translatedText = await translateChineseToVietnamese(currentWord.hanzi);
        if (translatedText) {
          setMeaning(translatedText);
        }
      } catch {
        // Keep the source meaning when the translation service is unavailable.
      }
    };

    translateMeaning();
  }, [currentWord]);

  const isCorrect = useMemo(() => {
    if (!currentWord) return false;
    return mode === 'choice' ? selectedAnswer === currentWord.hanzi : answer.trim() === currentWord.hanzi;
  }, [answer, currentWord, mode, selectedAnswer]);

  const handleCheck = () => {
    if (!currentWord || isChecked) return;
    if (mode === 'choice' && !selectedAnswer) return;
    if (mode === 'recall' && !answer.trim()) return;

    setIsChecked(true);
    setScore((current) => ({
      correct: current.correct + (isCorrect ? 1 : 0),
      total: current.total + 1,
    }));
  };

  const handleModeChange = (nextMode: PracticeMode) => {
    setMode(nextMode);
    setAnswer('');
    setSelectedAnswer('');
    setIsChecked(false);
  };

  const checkLabel = isChecked ? (isCorrect ? 'Chính xác!' : 'Chưa đúng') : 'Kiểm tra';

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed top-[calc(50%+102px)] left-0 z-40 flex w-[12px] -translate-y-1/2 items-center justify-center rounded-r-md bg-green-500 py-6 text-white opacity-90 shadow-md transition-colors hover:bg-green-600 hover:opacity-100"
        title="Mở luyện nhớ mặt chữ"
        aria-label="Mở luyện nhớ mặt chữ"
      >
        <div className="h-4 w-[2px] rounded-full bg-white/70" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[92vw] max-w-2xl transform flex-col overflow-y-auto bg-slate-50 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Luyện nhớ mặt chữ HSK"
      >
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <Sparkles size={19} className="text-green-600" />
            Luyện nhớ mặt chữ
          </h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full bg-gray-100 p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
            title="Đóng"
            aria-label="Đóng luyện nhớ mặt chữ"
          >
            <X size={18} />
          </button>
        </div>

        <section className="mx-2 mb-4 overflow-hidden rounded-xl border border-amber-100 bg-white shadow-sm sm:mx-4">
      <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-amber-800">Luyện từ vựng HSK</p>
          <div className="text-right text-xs text-gray-500">
            Điểm: <span className="font-bold text-amber-700">{score.correct}/{score.total}</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <div className="flex rounded-lg bg-white/80 p-1">
            <button
              type="button"
              onClick={() => handleModeChange('choice')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${mode === 'choice' ? 'bg-amber-500 text-white' : 'text-amber-800 hover:bg-amber-100'}`}
            >
              Chọn đáp án
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('recall')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${mode === 'recall' ? 'bg-amber-500 text-white' : 'text-amber-800 hover:bg-amber-100'}`}
            >
              Nhìn nghĩa, nhớ chữ
            </button>
          </div>
          <div className="flex rounded-lg bg-white/80 p-1">
            {levels.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLevel(item)}
                className={`min-w-8 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${level === item ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">
        {isLoading && <p className="py-8 text-center text-sm text-gray-500">Đang tải từ vựng...</p>}
        {error && <p className="py-8 text-center text-sm text-red-500">{error}</p>}
        {!isLoading && !error && currentWord && (
          <>
            <div className="text-center">
              <div className="mx-auto max-w-md space-y-2 text-left">
                <div className="grid grid-cols-[8rem_1fr] items-baseline gap-2">
                  <p className="text-xs font-semibold tracking-wide text-gray-500">Nghĩa tiếng Việt:</p>
                  <p className="text-lg font-semibold text-gray-800">{meaning || 'Đang dịch...'}</p>
                </div>
                <div className="grid grid-cols-[8rem_1fr] items-baseline gap-2">
                  <p className="text-xs font-semibold tracking-wide text-gray-500">Nghĩa tiếng Anh:</p>
                  <p className="text-sm text-emerald-700">{currentWord.translations[0] || 'Chưa có nghĩa'}</p>
                </div>
                <div className="grid grid-cols-[8rem_1fr] items-baseline gap-2">
                  <p className="text-xs font-semibold tracking-wide text-gray-500">Pinyin:</p>
                  <p className="text-sm text-blue-600">{currentWord.pinyin}</p>
                </div>
              </div>
              <div className="mx-auto mt-3 w-full max-w-md text-left">
                <button
                  type="button"
                  onClick={() => setShowHint((current) => !current)}
                  className="flex w-fit justify-start gap-1.5 rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100"
                >
                  <Lightbulb size={14} />
                  {showHint ? 'Ẩn gợi ý bộ thủ' : 'Gợi ý bộ thủ'}
                </button>
              </div>
              {showHint && (
                <div className="mx-auto mt-3 grid w-full max-w-md grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-1.5">
                  {getRadicalHints(currentWord.hanzi).map(({ character, radical, meaning }) => (
                    <div key={`${character}-${radical}`} className="rounded-md bg-gray-50 px-2 py-1.5 text-center text-xs text-gray-600">
                      <div>
                        <span className="font-bold text-gray-800">{character}</span>
                        <span className="mx-1 text-gray-400">→</span>
                        <span className="font-semibold text-blue-600">{radical || '-'}</span>
                      </div>
                      <span className="mt-0.5 block truncate">{meaning || 'Chưa có dữ liệu'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {mode === 'recall' ? (
              <div className="mx-auto mt-5 max-w-sm">
                <input
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleCheck()}
                  placeholder="Nhập chữ Hán..."
                  disabled={isChecked}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-center text-lg focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:bg-gray-100"
                  aria-label="Nhập chữ Hán cần nhớ"
                />
              </div>
            ) : (
              <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-2">
                {options.map((option) => {
                  const isSelected = selectedAnswer === option.hanzi;
                  const isOptionCorrect = isChecked && option.hanzi === currentWord.hanzi;
                  const isOptionWrong = isChecked && isSelected && !isCorrect;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => !isChecked && setSelectedAnswer(option.hanzi)}
                      className={`rounded-lg border px-3 py-3 text-center text-2xl font-bold transition-colors ${
                        isOptionCorrect ? 'border-green-300 bg-green-50 text-green-700' : isOptionWrong ? 'border-red-300 bg-red-50 text-red-700' : isSelected ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-gray-200 bg-white text-gray-800 hover:border-amber-300 hover:bg-amber-50'
                      }`}
                    >
                      {option.hanzi}
                    </button>
                  );
                })}
              </div>
            )}

            {isChecked && (
              <p className={`mt-4 text-center text-sm font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {isCorrect ? <Check size={16} className="mr-1 inline" /> : <X size={16} className="mr-1 inline" />}
                {isCorrect ? 'Tốt lắm!' : `Đáp án đúng: ${currentWord.hanzi}`}
              </p>
            )}

            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                onClick={handleCheck}
                disabled={isChecked || (mode === 'choice' ? !selectedAnswer : !answer.trim())}
                className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {checkLabel}
              </button>
              {isChecked && (
                <button
                  type="button"
                  onClick={() => nextQuestion()}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <RotateCcw size={15} /> Từ tiếp theo
                </button>
              )}
            </div>
          </>
        )}
      </div>
        </section>
      </aside>
    </>
  );
};

export default HskPractice;