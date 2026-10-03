import { useState } from 'react';
import { AlignLeft, X, FileText } from 'lucide-react';

interface ParagraphSidebarProps {
  onSelectFile: (fileUrl: string) => void;
}

const vocabFiles = [
  { name: 'Đoạn văn 1', url: '/vocab/pharagraph1.json' },
  { name: 'Công xưởng 1', url: '/vocab/congchang1.json' },
  { name: 'Từ vựng HSK 1', url: '/vocab/hsk1-vocab.json' },
  { name: 'Đoạn văn HSK 1', url: '/vocab/hsk1-paragraph.json' },
  { name: 'Từ vựng HSK 2', url: '/vocab/hsk2-vocab.json' },
  { name: 'Đoạn văn HSK 2', url: '/vocab/hsk2-paragraph.json' },
  { name: 'Giao tiếp 178', url: '/vocab/conversational178.json' },
];

const ParagraphSidebar: React.FC<ParagraphSidebarProps> = ({ onSelectFile }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (url: string) => {
    onSelectFile(url);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-[calc(50%+306px)] left-0 -translate-y-1/2 bg-indigo-500 text-white py-6 w-[12px] flex items-center justify-center rounded-r-md shadow-md hover:bg-indigo-600 transition-colors z-40 opacity-70 hover:opacity-100"
        title="Luyện đọc đoạn văn"
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
        className={`fixed top-0 left-0 h-full w-[88vw] max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <AlignLeft size={20} className="text-indigo-600" />
            Luyện đọc đoạn văn
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-white space-y-1">
          {vocabFiles.map((file, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(file.url)}
              className="w-full flex items-start gap-2 py-2 px-2 text-left rounded-md text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              <FileText className="text-indigo-400 shrink-0 mt-0.5" size={18} />
              <span className="text-sm leading-relaxed">{file.name}</span>
            </button>
          ))}
          <p className="text-xs text-gray-400 mt-6 pt-4 border-t border-gray-100 text-center">Các bài học mới sẽ được thêm vào đây trong tương lai</p>
        </div>
      </aside>
    </>
  );
};

export default ParagraphSidebar;
