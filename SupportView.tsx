
import React, { useState } from 'react';
import type { User } from '../types';
import { db } from '../services/firebase';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { MessageSquare, ChevronRight, Star, Send, Loader2, Heart, ExternalLink, Bot, Sparkles } from 'lucide-react';

const SupportView: React.FC<{ user: User, onBack: () => void }> = ({ user, onBack }) => {
  const [rating, setRating] = useState(5);
  const [opinion, setOpinion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opinion.trim()) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "feedback"), {
        userId: user.id, userName: user.name, userPhone: user.phone, rating, opinion, createdAt: Date.now()
      });
      setSubmitted(true);
      setOpinion('');
    } catch (e) { alert('خطأ في الإرسال'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-32 p-6 animate-in slide-in-from-right duration-500 h-full overflow-y-auto no-scrollbar">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">صوتك مسموع</h2>
        <button onClick={onBack} className="p-3.5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm active:scale-90 transition-all"><ChevronRight /></button>
      </div>

      <div className="bg-[#2D9469] rounded-[4rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-right">
           <div className="bg-white/20 p-8 rounded-[3rem] backdrop-blur-xl border border-white/20 shadow-inner">
              <MessageSquare className="h-10 w-10 text-white" />
           </div>
           <div className="flex-1 space-y-3">
              <h3 className="text-2xl font-black tracking-tight leading-tight">تواصل مباشر مع الإدارة</h3>
              <p className="text-xs font-bold text-emerald-50 opacity-80 leading-relaxed">فريقنا متاح لمساعدتك وحل أي مشكلة تواجهك فوراً.</p>
              <button onClick={() => window.open('https://wa.me/201065019364')} className="mt-4 bg-white text-[#2D9469] px-10 py-5 rounded-[2.2rem] font-black text-sm shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                 <ExternalLink className="h-5 w-5" /> واتساب الدعم الفني
              </button>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[4rem] p-10 border border-slate-50 shadow-sm space-y-10">
        <div className="text-center space-y-3">
           <div className="bg-amber-50 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto text-amber-500">
              <Sparkles className="h-10 w-10" />
           </div>
           <h4 className="text-xl font-black text-slate-800 tracking-tight">رأيك يهمنا لنطور "وصـــلــهــا"</h4>
           <p className="text-xs font-bold text-slate-400 leading-relaxed">كل تعليق ترسله يصل مباشرة للمسؤولين لنتمكن من خدمتكم بشكل أفضل.</p>
        </div>

        {submitted ? (
          <div className="bg-emerald-50 p-12 rounded-[3.5rem] border-2 border-emerald-100 text-center animate-in zoom-in">
             <Heart className="h-16 w-16 text-emerald-500 mx-auto mb-6 fill-emerald-500" />
             <h4 className="font-black text-emerald-700 text-xl mb-3">شكراً لرسالتك الصادقة!</h4>
             <p className="text-xs font-bold text-emerald-600 leading-relaxed">تم استلام رأيك بنجاح، وسيكون الدافع لنا للتطوير الدائم.</p>
             <button onClick={() => setSubmitted(false)} className="mt-8 text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline">إرسال تعليق آخر</button>
          </div>
        ) : (
          <form onSubmit={handleSubmitFeedback} className="space-y-10">
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 block text-center">تقييمك لتجربة التطبيق</label>
               <div className="flex justify-center gap-4 bg-slate-50 p-8 rounded-[3rem]">
                  {[1,2,3,4,5].map(s => (
                    <button type="button" key={s} onClick={() => setRating(s)} className={`transition-all ${rating >= s ? 'scale-125' : 'opacity-20 grayscale'}`}>
                       <Star className={`h-10 w-10 ${rating >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
               </div>
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 block">اكتب ملاحظاتك أو اقتراحاتك</label>
               <textarea 
                 value={opinion} 
                 onChange={e => setOpinion(e.target.value)} 
                 placeholder="هل لديك فكرة تطوير؟ أو مشكلة واجهتك؟ اكتبها هنا بكل صراحة..." 
                 className="w-full bg-slate-50 border-none rounded-[3rem] p-10 font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/5 min-h-[180px] transition-all" 
               />
            </div>

            <button type="submit" disabled={isSubmitting || !opinion.trim()} className="w-full bg-slate-950 text-white py-8 rounded-[3rem] font-black text-lg shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-30">
              {isSubmitting ? <Loader2 className="animate-spin h-8 w-8 mx-auto" /> : <><Send className="h-6 w-6 text-emerald-400" /> إرسال رسالتك الآن</>}
            </button>
          </form>
        )}
      </div>

      <div className="text-center opacity-30 pointer-events-none pb-10">
         <img src="https://img.icons8.com/fluency-systems-filled/512/000000/bicycle.png" className="h-20 w-20 mx-auto mb-4" />
         <p className="text-[10px] font-black uppercase tracking-[0.6em]">وصـــلــهــا</p>
      </div>
    </div>
  );
};

export default SupportView;
