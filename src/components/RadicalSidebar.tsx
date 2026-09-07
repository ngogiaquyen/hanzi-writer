import { useState } from 'react';
import { X, Book } from 'lucide-react';
import { radicalDict } from '../utils/radicals';

const RadicalSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-1/2 left-0 -translate-y-1/2 bg-blue-500 text-white py-6 w-[12px] flex items-center justify-center rounded-r-md shadow-md hover:bg-blue-600 transition-colors z-40 opacity-70 hover:opacity-100"
        title="Xem 214 Bộ Thủ"
      >
        {/* Tiny indicator icon */}
        <div className="w-[2px] h-4 bg-white/60 rounded-full" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <div 
        className={`fixed top-0 left-0 h-full w-[85vw] max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Book size={20} className="text-blue-600" />
            214 Bộ Thủ Khang Hy
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 bg-slate-50">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(radicalDict).map(([char, meaning], index) => (
              <div key={`${char}-${index}`} className="bg-white p-2.5 rounded-lg border border-gray-200 flex flex-col items-center justify-center shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
                <span className="text-2xl font-bold text-blue-600 mb-1">{char}</span>
                <span className="text-[11px] text-gray-600 text-center leading-tight">{meaning}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default RadicalSidebar;
