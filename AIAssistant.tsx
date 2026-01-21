
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Send, X, Loader2 } from 'lucide-react';

const AIAssistant: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'يا أهلاً بيك! أنا مساعدك الذكي في تطبيق "وصـــلــهــا"، خبير محافظة المنوفية بالكامل. أقدر أساعدك في معرفة أقرب المناطق، أسعار المشاوير، أو حتى أرشحلك أحسن أماكن في المنوفية. تحب تبدأ بإيه؟' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: 'ai-assistant' }, '');
      const handlePop = () => onClose();
      window.addEventListener('popstate', handlePop);
      return () => {
        window.removeEventListener('popstate', handlePop);
        if (window.history.state?.modal === 'ai-assistant') window.history.back();
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: "أنت 'وصـــلــهــا'، المساعد الذكي لتطبيق 'وصـــلــهــا'. أنت خبير بخدمات التوصيل وجغرافيا محافظة المنوفية بالكامل بمراكزها العشرة (شبين، أشمون، منوف، الباجور، قويسنا، بركة السبع، تلا، السادات، الشهداء). تحدث بلهجة مصرية منوفية ودودة، مختصرة، واحترافية.",
        },
      });

      const aiText = result.text || 'معلش يا بطل، الشبكة في المنوفية مريحة شوية، جرب تسأل تاني.';
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: 'الظاهر الإنترنت واقع، جرب كمان دقيقة.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg h-[80vh] sm:h-[650px] rounded-t-[3.5rem] sm:rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg"><Sparkles className="h-6 w-6" /></div>
            <div className="text-right">
              <h3 className="font-black text-sm">مساعد وصـــلــهــا الذكي</h3>
              <p className="text-[10px] text-emerald-400 font-bold animate-pulse">متصل الآن • المنوفية</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-slate-50/50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] p-5 rounded-[2.2rem] text-sm font-bold shadow-sm ${m.role === 'user' ? 'bg-slate-900 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {isTyping && <div className="flex justify-end p-2"><Loader2 className="h-6 w-6 text-emerald-500 animate-spin" /></div>}
          <div ref={scrollRef} />
        </div>
        <div className="p-6 bg-white border-t border-slate-100">
          <div className="flex gap-3 relative">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="اسأل أي سؤال عن المنوفية..." className="flex-1 bg-slate-50 rounded-[1.8rem] py-5 pr-6 pl-16 font-bold text-sm outline-none focus:border-emerald-500 text-right shadow-inner" dir="rtl" />
            <button onClick={handleSend} disabled={isTyping} className="absolute left-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-4 rounded-2xl shadow-xl active:scale-90 transition-all disabled:opacity-50"><Send className="h-5 w-5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
