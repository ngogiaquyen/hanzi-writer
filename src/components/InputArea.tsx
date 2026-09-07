import { useState, useEffect } from 'react';

interface InputAreaProps {
  initialText?: string;
  onAnalyze: (text: string) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ initialText = '', onAnalyze }) => {
  const [text, setText] = useState(initialText);

  // Keep internal state in sync if initialText changes from parent
  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAnalyze(text.trim());
    }
  };

  return (
    <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
      <form onSubmit={handleSubmit} className="flex flex-row gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập chữ Hán hoặc câu văn..."
          className="flex-grow min-w-0 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-base"
        />
        <button
          type="submit"
          className="shrink-0 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm shadow-blue-500/20"
        >
          Phân tích
        </button>
      </form>
    </div>
  );
};

export default InputArea;
