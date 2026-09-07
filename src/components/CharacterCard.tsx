import { useState } from 'react';
import { pinyin } from 'pinyin-pro';
import cnchar from 'cnchar';
import 'cnchar-radical';
import { radicalDict } from '../utils/radicals';
import StrokeViewer from './StrokeViewer';
import { Play, X } from 'lucide-react';

interface CharacterCardProps {
  character: string;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character }) => {
  const [showRadicalAnim, setShowRadicalAnim] = useState(false);

  // Get pinyin with tone marks
  const charPinyin = pinyin(character, { toneType: 'symbol', type: 'string' });
  
  // Minimal static dictionary for common characters (for demonstration)
  // In a real app, you would query an API or load a comprehensive dictionary JSON
  const mockDictionary: Record<string, string> = {
    '我': 'Tôi, ta',
    '爱': 'Yêu, thích',
    '你': 'Bạn, cậu',
    '中': 'Trung, ở giữa',
    '国': 'Quốc gia, nước',
    '学': 'Học',
    '习': 'Tập, luyện',
    '汉': 'Hán',
    '字': 'Chữ',
    '好': 'Tốt, đẹp, hay',
    '人': 'Người',
  };

  const meaning = mockDictionary[character] || '';

  let radicalChar = '';
  let radicalMeaning = '';
  try {
    const radResult = cnchar.radical(character);
    if (Array.isArray(radResult) && radResult.length > 0) {
      radicalChar = radResult[0].radical || '';
    } else if (typeof radResult === 'string') {
      radicalChar = radResult;
    }
  } catch (e) {
    // ignore
  }

  if (radicalChar) {
    radicalMeaning = radicalDict[radicalChar] || '';
  }

  return (
    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center">
      <div className="mb-2 text-center flex flex-col items-center justify-end w-full min-h-[3rem]">
        <span className="text-lg font-medium text-blue-600 leading-tight">{charPinyin}</span>
        {meaning && <span className="text-xs text-gray-500 line-clamp-1 truncate w-full mt-1" title={meaning}>{meaning}</span>}
        {radicalChar && (
          <button 
            onClick={() => setShowRadicalAnim(true)}
            className="text-[10px] text-blue-600 bg-blue-50 hover:bg-blue-100 rounded px-1.5 py-0.5 mt-1 transition-colors border border-blue-100 flex items-center gap-1 cursor-pointer max-w-full"
            title={`Xem nét viết Bộ ${radicalChar}`}
          >
            <span className="truncate">Bộ {radicalChar}{radicalMeaning ? `: ${radicalMeaning}` : ''}</span>
            <Play size={10} className="shrink-0" />
          </button>
        )}
      </div>
      
      <StrokeViewer character={character} />

      {/* Radical Animation Modal */}
      {showRadicalAnim && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity"
          onClick={() => setShowRadicalAnim(false)}
        >
          <div 
            className="bg-white p-6 rounded-2xl max-w-[280px] w-full flex flex-col items-center relative shadow-2xl" 
            onClick={e => e.stopPropagation()}
          >
            <button 
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-1 transition-colors" 
              onClick={() => setShowRadicalAnim(false)}
            >
              <X size={18} />
            </button>
            
            <h3 className="text-xl font-bold mb-1 text-blue-600">Bộ {radicalChar}</h3>
            <p className="text-xs text-gray-500 mb-6 text-center">{radicalMeaning}</p>
            
            <StrokeViewer character={radicalChar} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterCard;
