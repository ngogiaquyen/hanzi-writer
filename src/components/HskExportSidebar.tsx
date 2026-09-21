import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, Moon, Sun, X } from 'lucide-react';
import * as XLSX from 'xlsx';

interface HskWord {
  id: number;
  hanzi: string;
  pinyin: string;
  translations: string[];
  vietnamese?: string;
}

const levels = [1, 2, 3, 4, 5, 6] as const;

type HskLevel = (typeof levels)[number];

const DARK_MODE_STORAGE_KEY = 'hanzi-dark-mode';

const HskExportSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem(DARK_MODE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [exportingLevel, setExportingLevel] = useState<HskLevel | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    try {
      localStorage.setItem(DARK_MODE_STORAGE_KEY, String(isDarkMode));
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }
  }, [isDarkMode]);

  const getTimestamp = () => {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  };

  const handleExport = async (level: HskLevel) => {
    setExportingLevel(level);
    setError('');

    try {
      const response = await fetch(`/hsk-vocab-json/hsk-level-${level}.json`);
      if (!response.ok) throw new Error('Không thể tải dữ liệu');

      const words = (await response.json()) as HskWord[];
      const rows = words.map((word) => ({
        ID: word.id,
        'Chữ Hán': word.hanzi,
        Pinyin: word.pinyin,
        'Nghĩa tiếng Việt': word.vietnamese || 'Chưa có bản dịch',
      }));
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, `HSK ${level}`);
      XLSX.writeFile(workbook, `hsk-level-${level}-vocab-${getTimestamp()}.xlsx`);
    } catch {
      setError(`Không thể xuất HSK ${level}.`);
    } finally {
      setExportingLevel(null);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed left-0 top-[calc(50%+170px)] z-40 flex w-[12px] -translate-y-1/2 items-center justify-center rounded-r-md bg-sky-500 py-6 text-white opacity-90 shadow-md transition-colors hover:bg-sky-600 hover:opacity-100"
        title="Xuất từ vựng HSK"
        aria-label="Xuất từ vựng HSK"
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
        className={`fixed left-0 top-0 z-50 flex h-full w-[82vw] max-w-xs transform flex-col bg-slate-50 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Xuất từ vựng HSK"
      >
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <FileSpreadsheet size={19} className="text-sky-600" />
            Xuất từ vựng
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsDarkMode((current) => !current)}
              className="rounded-full bg-gray-100 p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
              title={isDarkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              aria-label={isDarkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            >
              {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full bg-gray-100 p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
              title="Đóng"
              aria-label="Đóng xuất từ vựng"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-2 p-4">
          {levels.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => handleExport(level)}
              disabled={exportingLevel !== null}
              className="flex w-full items-center justify-between rounded-lg border border-sky-100 bg-white px-3 py-2.5 text-left text-sm font-semibold text-sky-700 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 disabled:cursor-wait disabled:opacity-60"
            >
              <span>Xuất HSK {level}</span>
              <Download size={16} />
            </button>
          ))}
          {exportingLevel && <p className="text-center text-xs text-gray-500">Đang tạo file HSK {exportingLevel}...</p>}
          {error && <p className="text-center text-xs text-red-500">{error}</p>}
        </div>
      </aside>
    </>
  );
};

export default HskExportSidebar;
