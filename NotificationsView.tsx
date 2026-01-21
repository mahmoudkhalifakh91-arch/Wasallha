
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { stripFirestore } from '../utils';
import { Bell, Info, CheckCircle, AlertCircle, ChevronRight, Loader2, Volume2, Sparkles } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  createdAt: number;
  read: boolean;
}

const NotificationsView: React.FC<{ user: User, onBack: () => void }> = ({ user, onBack }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "notifications"), where("userId", "in", [user.id, "ALL", user.role]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) })) as NotificationItem[];
      setNotifications(docs.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user.id, user.role]);

  const markAllAsRead = async () => {
    const batch = writeBatch(db);
    notifications.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, "notifications", n.id), { read: true });
    });
    await batch.commit();
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'SUCCESS': return <CheckCircle className="h-6 w-6" />;
      case 'WARNING': return <AlertCircle className="h-6 w-6" />;
      case 'ALERT': return <Bell className="h-6 w-6 animate-swing" />;
      default: return <Info className="h-6 w-6" />;
    }
  };

  const getStyle = (type: string, read: boolean) => {
    if (read) return 'bg-white opacity-60 border-transparent shadow-none';
    switch(type) {
      case 'SUCCESS': return 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-md';
      case 'WARNING': return 'bg-amber-50 border-amber-100 text-amber-600 shadow-md';
      case 'ALERT': return 'bg-rose-50 border-rose-100 text-rose-600 shadow-md';
      default: return 'bg-indigo-50 border-indigo-100 text-indigo-600 shadow-md';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-32 p-6 animate-in fade-in duration-500 h-full overflow-y-auto no-scrollbar">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">مركز التنبيهات</h2>
        <div className="flex items-center gap-3">
          {notifications.some(n => !n.read) && (
            <button onClick={markAllAsRead} className="text-[10px] font-black text-[#2D9469] uppercase tracking-widest px-2">قراءة الكل</button>
          )}
          <button onClick={onBack} className="p-3.5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm active:scale-90 transition-all"><ChevronRight /></button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
           <div className="py-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-emerald-500" /></div>
        ) : notifications.length === 0 ? (
           <div className="py-32 text-center text-slate-300 font-bold border-4 border-dashed border-slate-100 rounded-[4rem]">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
              لا توجد تنبيهات جديدة في أشمون حالياً
           </div>
        ) : notifications.map(n => (
          <div key={n.id} className={`p-7 rounded-[2.8rem] border-2 transition-all flex gap-6 items-start relative overflow-hidden ${getStyle(n.type, n.read)}`}>
            {!n.read && <div className="absolute top-4 left-4 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>}
            <div className={`p-4 rounded-2xl ${n.read ? 'bg-slate-100 text-slate-400' : 'bg-white shadow-sm'}`}>
               {getIcon(n.type)}
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-black text-sm text-slate-800 leading-tight">{n.title}</h4>
              <p className="text-xs font-bold text-slate-500 leading-relaxed opacity-80">{n.body}</p>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest pt-2">{new Date(n.createdAt).toLocaleTimeString('ar-EG')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsView;
