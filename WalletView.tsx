
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { stripFirestore } from '../utils';
import { 
  Wallet, TrendingUp, ArrowDownRight, ArrowUpLeft, 
  PlusCircle, ChevronRight, Loader2, Receipt, Send, 
  Banknote, History, Copy, ExternalLink, Smartphone
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  createdAt: number;
}

const WalletView: React.FC<{ user: User, onBack: () => void }> = ({ user, onBack }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cashNumber = "01065019364"; // رقم الإدارة المعتمد

  useEffect(() => {
    const q = query(collection(db, "transactions"), where("userId", "==", user.id));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) })) as Transaction[];
      setTransactions(docs.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    });
  }, [user.id]);

  const handleAction = async (action: 'TOPUP' | 'WITHDRAW') => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return alert('يرجى إدخال مبلغ صحيح');
    
    if (action === 'WITHDRAW' && numAmount > (user.wallet?.balance || 0)) {
      return alert('المبلغ المطلوب أكبر من رصيدك الحالي');
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "payment_requests"), {
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        type: action,
        amount: numAmount,
        status: 'PENDING',
        createdAt: Date.now()
      });
      
      const whatsappMsg = action === 'TOPUP' 
        ? `طلب شحن محفظة وصلها: ${numAmount} ج.م\nالاسم: ${user.name}` 
        : `طلب سحب أرباح من وصلها: ${numAmount} ج.م\nالاسم: ${user.name}`;
      
      window.open(`https://wa.me/${cashNumber}?text=${encodeURIComponent(whatsappMsg)}`, '_blank');
      
      setShowTopUp(false);
      setShowWithdraw(false);
      setAmount('');
      alert('تم إرسال طلبك بنجاح، سيتم تنفيذه بعد المراجعة.');
    } catch (e) {
      alert('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-32 p-6 animate-in slide-in-from-bottom duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">محفظتي</h2>
        <button onClick={onBack} className="p-3.5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm active:scale-90 transition-all">
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div className="bg-slate-950 rounded-[4rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px]"></div>
        <div className="relative z-10">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-4">إجمالي رصيدك المتوفر في وصلها</p>
          <h3 className="text-7xl font-black tracking-tighter">{(user.wallet?.balance || 0).toFixed(1)} <span className="text-sm opacity-40 font-bold">ج.م</span></h3>
          
          <div className="grid grid-cols-2 gap-4 mt-12">
            <button onClick={() => setShowTopUp(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-3xl font-black text-xs flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-900/20">
              <PlusCircle className="h-5 w-5" /> شحن الرصيد
            </button>
            <button onClick={() => setShowWithdraw(true)} className="bg-white/10 hover:bg-white/20 text-white py-5 rounded-3xl font-black text-xs flex items-center justify-center gap-3 transition-all">
              <Banknote className="h-5 w-5" /> سحب أرباح
            </button>
          </div>
        </div>
      </div>

      {/* مودال العمليات (شحن / سحب) */}
      {(showTopUp || showWithdraw) && (
        <div className="bg-white p-10 rounded-[3.5rem] border-4 border-slate-50 shadow-xl space-y-8 animate-in zoom-in duration-300">
          <div className="flex items-center gap-5">
             <div className={`p-5 rounded-[2rem] ${showTopUp ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {showTopUp ? <PlusCircle className="h-8 w-8" /> : <Banknote className="h-8 w-8" />}
             </div>
             <div>
                <h4 className="text-xl font-black text-slate-800">{showTopUp ? 'شحن المحفظة' : 'سحب أرباح'}</h4>
                <p className="text-xs font-bold text-slate-400">عبر فودافون كاش أو المقر الرئيسي</p>
             </div>
          </div>
          
          <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 block">المبلغ المطلوب (ج.م)</label>
             <input 
               type="number" 
               value={amount} 
               onChange={e => setAmount(e.target.value)} 
               placeholder="0.00" 
               className="w-full bg-slate-50 border-none rounded-3xl p-8 text-4xl font-black outline-none focus:ring-4 focus:ring-emerald-500/5 text-center" 
             />
          </div>

          {showTopUp && (
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex justify-between items-center group">
               <div className="text-right">
                  <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">رقم التحويل</p>
                  <span className="text-xl font-black tracking-widest text-slate-800">{cashNumber}</span>
               </div>
               <button onClick={() => { navigator.clipboard.writeText(cashNumber); alert('تم نسخ الرقم'); }} className="p-4 bg-white rounded-2xl shadow-sm text-slate-400 group-active:scale-90 transition-all">
                  <Copy className="h-5 w-5" />
               </button>
            </div>
          )}

          <div className="flex gap-4">
            <button onClick={() => { setShowTopUp(false); setShowWithdraw(false); setAmount(''); }} className="flex-1 py-6 rounded-3xl font-black text-sm text-slate-400">إلغاء</button>
            <button 
              disabled={isSubmitting} 
              onClick={() => handleAction(showTopUp ? 'TOPUP' : 'WITHDRAW')} 
              className={`flex-[2] py-6 rounded-3xl font-black text-sm text-white shadow-xl active:scale-95 transition-all ${showTopUp ? 'bg-emerald-600' : 'bg-slate-950'}`}
            >
              {isSubmitting ? <Loader2 className="animate-spin mx-auto h-6 w-6" /> : 'تأكيد العملية'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[4rem] p-10 border border-slate-50 shadow-sm space-y-8">
        <div className="flex justify-between items-center mb-2 px-2">
           <h4 className="font-black text-slate-800 text-lg flex items-center gap-3">
              <History className="h-5 w-5 text-[#2D9469]" /> كشف العمليات
           </h4>
           <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">تحديث لحظي</span>
        </div>

        <div className="space-y-4">
          {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-emerald-500" /></div>
          ) : transactions.length === 0 ? (
             <div className="py-24 text-center text-slate-300 font-bold border-4 border-dashed border-slate-50 rounded-[4rem]">
                لا توجد عمليات مسجلة حتى الآن
             </div>
          ) : transactions.map(t => (
            <div key={t.id} className="flex justify-between items-center p-6 bg-slate-50/50 rounded-[2.5rem] border border-transparent hover:border-emerald-100 transition-all group">
               <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-2xl shadow-sm transition-all group-hover:scale-110 ${t.type === 'CREDIT' ? 'bg-emerald-500 text-white' : 'bg-rose-50 text-rose-500'}`}>
                     {t.type === 'CREDIT' ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpLeft className="h-5 w-5" />}
                  </div>
                  <div className="text-right">
                     <p className="font-black text-slate-800 text-sm leading-tight mb-1">{t.description}</p>
                     <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(t.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })} • {new Date(t.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
               </div>
               <div className="text-left">
                  <p className={`text-xl font-black ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {t.type === 'CREDIT' ? '+' : '-'}{t.amount.toFixed(1)}
                  </p>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletView;
