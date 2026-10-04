import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send } from 'lucide-react';

export function Chat({ socket, roomId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleChatReceived = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('chat_received', handleChatReceived);

    return () => {
      socket.off('chat_received', handleChatReceived);
    };
  }, [socket]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    socket.emit('send_chat', {
      roomId,
      message: inputMessage.trim()
    });

    setInputMessage('');
  };

  return (
    <div className="bg-[#131b2e] border border-gray-800 rounded-2xl p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-gray-800 mb-3 text-white font-semibold text-sm">
        <MessageSquare className="w-4 h-4 text-red-500" />
        <span>Room Chat</span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[140px] max-h-[220px]">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-xs text-center py-6">
            Say hi to everyone watching! 👋
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.userId === currentUser?.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col text-xs ${
                  isSelf ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className={`font-semibold text-[11px] ${
                      msg.role === 'Host'
                        ? 'text-amber-400'
                        : msg.role === 'Moderator'
                        ? 'text-emerald-400'
                        : 'text-gray-300'
                    }`}
                  >
                    {msg.username}
                  </span>
                  <span className="text-[9px] text-gray-500">{msg.timestamp}</span>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-xl max-w-[85%] break-words ${
                    isSelf
                      ? 'bg-red-600 text-white rounded-tr-none'
                      : 'bg-[#0f172a] text-gray-200 border border-gray-800 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
        <input
          type="text"
          placeholder="Send a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 bg-[#0b0f19] border border-gray-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-all"
        />
        <button
          type="submit"
          className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-xl transition-colors active:scale-95 shadow-md shadow-red-600/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
