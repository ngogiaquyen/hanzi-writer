import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Search, X } from 'lucide-react';

export interface CharacterEntry {
  hanzi: string;
  pinyin: string;
  sinoViet: string;
  meaningVi: string;
  strokeCount: number;
  traditional: string | null;
  hskLevel?: number;
  mnemonic: string;
  strokeHint: string;
  radicals: string[];
  monolithic: boolean;
}

interface CharacterDictionarySidebarProps {
  onSelectCharacter: (character: CharacterEntry) => void;
}

const CharacterDictionarySidebar: React.FC<CharacterDictionarySidebarProps> = ({ onSelectCharacter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [characters, setCharacters] = useState<CharacterEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || characters.length) return;

    const loadCharacters = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch('/characters/characters.json');
        if (!response.ok) throw new Error('Không thể tải dữ liệu');
        setCharacters((await response.json()) as CharacterEntry[]);
      } catch {
        setError('Không tải được danh sách chữ Hán.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCharacters();
  }, [characters.length, isOpen]);

  const filteredCharacters = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return characters;

    return characters.filter((item) =>
      [item.hanzi, item.pinyin, item.sinoViet, item.meaningVi].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [characters, query]);

  const handleSelect = (character: CharacterEntry) => {
    onSelectCharacter(character);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed left-0 top-[calc(50%+238px)] z-40 flex w-[12px] -translate-y-1/2 items-center justify-center rounded-r-md bg-violet-500 py-6 text-white opacity-90 shadow-md transition-colors hover:bg-violet-600 hover:opacity-100"
        title="Mở danh sách chữ Hán"
        aria-label="Mở danh sách chữ Hán"
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
        className={`fixed left-0 top-0 z-50 flex h-full w-[88vw] max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Danh sách chữ Hán"
      >
        <div className="border-b border-gray-100 p-4">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="flex shrink-0 items-center gap-2 text-lg font-bold text-gray-800">
              <BookOpen size={20} className="text-violet-600" />
              Chữ Hán
            </h2>
            <div className="relative min-w-0 flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm chữ..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                aria-label="Tìm chữ Hán"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full bg-gray-100 p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
              title="Đóng"
              aria-label="Đóng danh sách chữ Hán"
            >
              <X size={18} />
            </button>
          </div>
          {!isLoading && !error && <p className="mt-2 text-xs text-gray-500">{filteredCharacters.length} chữ</p>}
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-3">
          {isLoading && <p className="py-10 text-center text-sm text-gray-500">Đang tải danh sách...</p>}
          {error && <p className="py-10 text-center text-sm text-red-500">{error}</p>}
          {!isLoading && !error && filteredCharacters.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-500">Không tìm thấy chữ phù hợp.</p>
          )}
          {!isLoading && !error && filteredCharacters.length > 0 && (
            <div className="space-y-2">
              {filteredCharacters.map((item, index) => (
                <button
                  key={item.hanzi}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="grid w-full grid-cols-[2rem_2.75rem_1fr_auto] items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-2 text-left shadow-sm transition-colors hover:border-violet-300 hover:bg-violet-50"
                >
                  <span className="text-center text-xs text-gray-400">{index + 1}</span>
                  <span className="w-11 shrink-0 text-center text-2xl font-bold text-violet-700">{item.hanzi}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-800">{item.pinyin}</span>
                    <span className="block truncate text-xs text-emerald-700">{item.meaningVi || item.sinoViet || 'Chưa có nghĩa'}</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-gray-400">{item.strokeCount} nét</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default CharacterDictionarySidebar;
