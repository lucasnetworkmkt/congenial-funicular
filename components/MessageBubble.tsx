import React from 'react';
import { Message, Role } from '../types';
import { User, Bot, FileImage } from 'lucide-react';
// We will use a simple whitespace pre-wrap for markdown simulation to avoid external huge deps in this specific output format,
// but in a real app, 'react-markdown' is recommended.
// For this visual level, we'll implement basic styling.

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  // Simple formatter for code blocks and newlines if we aren't using a markdown library
  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm
          ${isUser ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}
        `}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Bubble Content */}
        <div className={`
          flex flex-col space-y-2
          ${isUser ? 'items-end' : 'items-start'}
        `}>
          
          <div className={`
            px-5 py-3 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed
            ${isUser 
              ? 'bg-indigo-600 text-white rounded-tr-sm' 
              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'}
          `}>
             {/* Attachment View */}
            {message.attachment && (
              <div className="mb-3">
                <div className="relative rounded-lg overflow-hidden border border-white/20 inline-block">
                  <img 
                    src={`data:${message.attachment.mimeType};base64,${message.attachment.data}`} 
                    alt="attachment" 
                    className="max-h-48 max-w-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 bg-black/50 p-1 rounded text-white">
                    <FileImage size={12} />
                  </div>
                </div>
              </div>
            )}
            
            <div className="whitespace-pre-wrap font-normal">
               {message.text}
               {message.isStreaming && (
                 <span className="inline-block w-2 h-4 ml-1 align-middle bg-current animate-pulse"/>
               )}
            </div>
          </div>
          
          <span className="text-xs text-gray-400 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

      </div>
    </div>
  );
};

export default MessageBubble;