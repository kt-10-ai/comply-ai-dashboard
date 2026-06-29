import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import api from '../api/axios';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your Comply.AI assistant. Ask me anything about NBFC regulations!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const historyToSent = newMessages.slice(1, -1);
      
      const res = await api.post('/api/chat', {
        message: userMessage,
        history: historyToSent
      });
      
      setMessages([...newMessages, { role: 'assistant', content: res.data.reply }]);
    } catch (error) {
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: error.response?.data?.detail || "Sorry, I'm having trouble connecting right now." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-accent text-white rounded-full shadow-lg hover:scale-105 transition-transform z-50 ${isOpen ? 'hidden' : 'block'}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-border overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-navy p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} />
              <h3 className="font-bold">Comply.AI Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-slate-300">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-accent text-white rounded-tr-sm' 
                    : 'bg-white text-text border border-border shadow-sm rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-border p-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: "75ms"}} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: "150ms"}} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-border flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about compliance..."
              className="flex-1 px-3 py-2 bg-slate-100 border border-transparent rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="p-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
