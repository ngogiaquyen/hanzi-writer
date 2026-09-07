import { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import { Play, PenTool, XCircle } from 'lucide-react';

interface StrokeViewerProps {
  character: string;
}

const StrokeViewer: React.FC<StrokeViewerProps> = ({ character }) => {
  const writerRef = useRef<HanziWriter | null>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const [isQuizzing, setIsQuizzing] = useState(false);

  useEffect(() => {
    if (targetRef.current && character) {
      // Clear the target div before creating a new writer to prevent duplicates
      targetRef.current.innerHTML = '';
      
      writerRef.current = HanziWriter.create(targetRef.current, character, {
        width: 90,
        height: 90,
        padding: 4,
        showOutline: true,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 50,
        radicalColor: '#337ab7',
        highlightColor: '#e5900d',
      });
    }
  }, [character]);

  const handleAnimate = () => {
    if (writerRef.current) {
      setIsQuizzing(false);
      writerRef.current.cancelQuiz();
      writerRef.current.animateCharacter();
    }
  };

  const handleQuiz = () => {
    if (writerRef.current) {
      setIsQuizzing(true);
      writerRef.current.quiz({
        onComplete: (summaryData) => {
          setIsQuizzing(false);
          // Optional: Add some success animation or feedback here
          console.log('Quiz completed!', summaryData);
        }
      });
    }
  };
  
  const handleCancelQuiz = () => {
    if (writerRef.current) {
      setIsQuizzing(false);
      writerRef.current.cancelQuiz();
      writerRef.current.showCharacter();
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Background grid representing typical Chinese writing paper (tian zi ge) */}
      <div className="relative border-2 border-dashed border-gray-300 rounded-sm mb-3 bg-white" style={{ width: 90, height: 90 }}>
        {/* Horizontal line */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gray-200 border-dashed border-t" />
        {/* Vertical line */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-gray-200 border-dashed border-l" />
        {/* Diagonal lines could be added but might clutter */}
        
        {/* The target for HanziWriter */}
        <div ref={targetRef} className="relative z-10 w-full h-full cursor-pointer" />
      </div>

      <div className="flex space-x-1 w-full justify-center">
        <button
          onClick={handleAnimate}
          className="flex flex-1 items-center justify-center px-1 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors shadow-sm text-xs font-medium"
          title="Chạy lại"
          disabled={isQuizzing}
        >
          <Play size={14} className="mr-1" />
          Replay
        </button>
        {isQuizzing ? (
          <button
            onClick={handleCancelQuiz}
            className="flex flex-1 items-center justify-center px-1 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors shadow-sm text-xs font-medium"
            title="Hủy"
          >
            <XCircle size={14} className="mr-1" />
            Hủy
          </button>
        ) : (
          <button
            onClick={handleQuiz}
            className="flex flex-1 items-center justify-center px-1 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors shadow-sm text-xs font-medium"
            title="Tập viết"
          >
            <PenTool size={14} className="mr-1" />
            Viết
          </button>
        )}
      </div>
    </div>
  );
};

export default StrokeViewer;
