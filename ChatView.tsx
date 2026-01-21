
import React, { useState, useEffect, useRef } from 'react';
import type { User, Order } from '../types';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, addDoc, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { Send, ChevronRight, Image as ImageIcon, Smile, Loader2 } from 'lucide-react';
import { stripFirestore } from '../utils';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
}

const ChatView: React.FC<{ user: User, order: Order, onBack: () => void }> = ({ user, order, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, "messages"), where("orderId", "==", order.id), limit(100));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) })) as Message[];
      setMessages(docs.sort((a, b) => a.createdAt - b.createdAt));
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
  }, [order.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage.trim();
    setNewMessage('');
    try {
      await addDoc(collection(db, "messages"), {
        orderId: order.id, senderId: user.id, text, createdAt: Date.now()
      });
      const recipientId = user.id === order.customerId ? order.driverId : order.customerId;
      if (recipientId) {
        await addDoc(collection(db, "notifications"), {
          userId: recipientId, title: `رسالة من ${user.name}`, body: text, type: 'INFO', createdAt: Date.now(), read: false
        });
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-950 z-[2000] flex flex-col animate-in slide-in-from-left duration-300 transition-colors">
      <div className="bg-slate-900 text-white p-6 pt-12 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center font-black text-xl">
            {user.role === 'DRIVER' ? order.customerPhone.slice(-2) : (order.driverName?.[0] || 'ك')}
          </div>
          <div><h3 className="font-black text-sm">{user.role === 'DRIVER' ? 'العميل' : `الكابتن ${order.driverName || ''}`}</h3><p className="text-[10px] font-bold text-emerald-400 uppercase">مشوار نشط • المنوفية</p></div>
        </div>
        <button onClick={onBack} className="p-3 hover:bg-white/10 rounded-2xl transition-colors"><ChevronRight className="h-6 w-6" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50">
        {loading ? <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-slate-900" /></div> : 
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] p-4 rounded-[1.8rem] text-sm font-bold shadow-sm ${msg.senderId === user.id ? 'bg-slate-900 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'}`}>{msg.text}</div>
            </div>
          ))
        }
        <div ref={scrollRef} />
      </div>
      <div className="p-6 bg-white border-t border-slate-100 pb-10">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="اكتب رسالتك..." className="flex-1 bg-slate-50 border border-slate-100 rounded-[2rem] py-4 px-6 font-bold text-sm outline-none focus:border-emerald-500" />
          <button type="submit" className="bg-emerald-600 text-white p-4 rounded-full shadow-lg active:scale-90 transition-all"><Send className="h-6 w-6" /></button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
