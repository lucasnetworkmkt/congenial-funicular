import React, { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string, file: File | null) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!text.trim() && !file) || isLoading) return;
    onSend(text, file);
    setText('');
    setFile(null);
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const adjustHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      {/* File Preview */}
      {file && (
        <div className="mb-2 flex items-center gap-2 bg-gray-100 p-2 rounded-lg w-fit border border-gray-200 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-indigo-100 p-1.5 rounded text-indigo-600">
            <ImageIcon size={18} />
          </div>
          <span className="text-sm text-gray-700 max-w-[200px] truncate">{file.name}</span>
          <button 
            onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className={`
        relative flex items-end gap-2 bg-white rounded-3xl border shadow-lg p-2 transition-all duration-300
        ${isLoading ? 'border-gray-200 opacity-80' : 'border-gray-300 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400'}
      `}>
        {/* Attachment Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-full transition-all disabled:cursor-not-allowed"
          title="Attach Image"
        >
          <Paperclip size={20} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange}
        />

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={adjustHeight}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          rows={1}
          disabled={isLoading}
          className="flex-1 max-h-[150px] py-3 bg-transparent border-none focus:ring-0 resize-none text-gray-800 placeholder:text-gray-400 leading-relaxed"
          style={{ minHeight: '44px' }}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={(!text.trim() && !file) || isLoading}
          className={`
            p-3 rounded-full flex-shrink-0 transition-all duration-200
            ${(!text.trim() && !file) || isLoading 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'}
          `}
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </div>
      <div className="text-center mt-2">
        <p className="text-xs text-gray-400">Gemini pode cometer erros. Verifique informações importantes.</p>
      </div>
    </div>
  );
};

export default ChatInput;