import { useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';

interface StrokeViewerProps {
  character: string;
}

const StrokeViewer: React.FC<StrokeViewerProps> = ({ character }) => {
  const writerRef = useRef<HanziWriter | null>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const loopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLoop = () => {
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
  };

  const animateCharacter = (writerInstance: HanziWriter | null) => {
    if (!writerInstance) return;

    writerInstance.animateCharacter({
      onComplete: () => {
        // Ensure we only loop if this is still the active writer
        if (writerRef.current === writerInstance) {
          loopTimeoutRef.current = setTimeout(() => animateCharacter(writerInstance), 800);
        }
      },
    });
  };

  useEffect(() => {
    if (targetRef.current && character) {
      // Clean up previous writer if any
      if (writerRef.current) {
        writerRef.current.cancelQuiz();
      }
      clearLoop();
      
      // Clear the target div before creating a new writer to prevent duplicates
      targetRef.current.innerHTML = '';
      
      const newWriter = HanziWriter.create(targetRef.current, character, {
        width: 90,
        height: 90,
        padding: 4,
        showOutline: true,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 50,
        radicalColor: '#337ab7',
        highlightColor: '#e5900d',
      });
      
      writerRef.current = newWriter;
      
      // Start animation immediately (HanziWriter queues it if data isn't loaded yet)
      animateCharacter(newWriter);
    }
    
    return () => {
      if (writerRef.current) {
        writerRef.current.cancelQuiz();
      }
      clearLoop();
    };
  }, [character]);

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
    </div>
  );
};

export default StrokeViewer;
