
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Types
import type { User, UserStatus, UserRole, VehicleType } from '../types';

// Services
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Utils
import { stripFirestore } from '../utils';

// Icons
import { 
  ArrowRight, User as UserIcon, Phone, Mail, 
  Shield, CreditCard, Save, Loader2, Zap, 
  Trash2, AlertTriangle, CheckCircle2, Lock,
  ArrowDown, ArrowUp, ChevronDown,
  Layout, Settings, Car, Bike, Info
} from 'lucide-react';

const AdminEditUser: React.FC<{ user: User }> = ({ user: currentUser }) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Scrolling States
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState<'UP' | 'DOWN'>('DOWN');

  // Section Refs for Quick Nav
  const profileSection = useRef<HTMLDivElement>(null);
  const authSection = useRef<HTMLDivElement>(null);
  const vehicleSection = useRef<HTMLDivElement>(null);
  const walletSection = useRef<HTMLDivElement>(null);
  const statusSection = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        const snap = await getDoc(doc(db, "users", userId));
        if (snap.exists()) {
          const data = stripFirestore(snap.data()) as User;
          setTargetUser(data);
          setFormData(data);
        }
      } catch (e) {
        alert('خطأ في تحميل بيانات المستخدم');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowScrollBtn(scrollTop + clientHeight < scrollHeight - 150 ? 'DOWN' : 'UP');
  };

  const scrollToPosition = (pos: 'TOP' | 'BOTTOM') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: pos === 'TOP' ? 0 : scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || isSaving) return;
    setIsSaving(true);
    try {
      const updates: any = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        role: formData.role,
        status: formData.status,
      };

      // تحديث الباسورد فقط إذا تم إدخال قيمة جديدة
      if (formData.password && formData.password.trim() !== "") {
        updates.password = formData.password;
      }

      // تحديث نوع المركبة للكباتن
      if (formData.role === 'DRIVER') {
        updates.vehicleType = formData.vehicleType || 'TOKTOK';
      }
      
      if (formData.wallet) {
        updates.wallet = {
          ...targetUser?.wallet,
          balance: Number(formData.wallet.balance || 0)
        };
      }
      
      await updateDoc(doc(db, "users", userId), stripFirestore(updates));
      alert('تم حفظ كافة التعديلات الشاملة بنجاح');
      navigate('/admin/users');
    } catch (e) {
      alert('فشل حفظ التعديلات، يرجى التحقق من الاتصال');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center py-20 bg-slate-50">
      <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
    </div>
  );

  if (!targetUser) return (
    <div className="p-20 text-center text-slate-400 font-black">المستخدم غير موجود</div>
  );

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto no-scrollbar scroll-smooth relative bg-[#f8fafc]"
    >
      {/* Floating Scroll Button */}
      <button 
        onClick={() => scrollToPosition(showScrollBtn === 'DOWN' ? 'BOTTOM' : 'TOP')}
        className="fixed bottom-10 left-10 z-[1000] bg-slate-900 text-white p-5 rounded-full shadow-2xl animate-in fade-in active:scale-90 transition-all group border-4 border-white"
      >
        {showScrollBtn === 'DOWN' ? <ArrowDown className="h-6 w-6 animate-bounce" /> : <ArrowUp className="h-6 w-6" />}
      </button>

      <div className="max-w-4xl mx-auto p-6 md:p-12 animate-in slide-in-from-bottom duration-500 text-right pb-40" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div className="flex items-center gap-5 w-full md:w-auto">
             <div className="bg-slate-900 p-4 rounded-3xl text-emerald-400 shadow-xl">
                <Shield className="h-8 w-8" />
             </div>
             <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">التعديل الشامل للعضو</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">تعديل كامل: {targetUser.name}</p>
             </div>
          </div>
          <button onClick={() => navigate('/admin/users')} className="w-full md:w-auto p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-emerald-600 flex items-center justify-center gap-2">
            <span className="font-black text-xs">رجوع للقائمة</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Nav Bar */}
        <div className="bg-white/90 p-3 rounded-[2rem] shadow-sm border border-slate-100 flex gap-2 mb-10 sticky top-4 z-[500] backdrop-blur-xl overflow-x-auto no-scrollbar">
           {[
             { label: 'البيانات الشخصية', ref: profileSection },
             { label: 'الأمان والدخول', ref: authSection },
             { label: 'المركبة', ref: vehicleSection, hidden: formData.role !== 'DRIVER' },
             { label: 'المحفظة', ref: walletSection },
             { label: 'الحالة والصلاحية', ref: statusSection }
           ].filter(item => !item.hidden).map((link, i) => (
             <button key={i} onClick={() => scrollToSection(link.ref)} className="px-6 py-3 rounded-xl bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all whitespace-nowrap text-[10px] font-black border border-transparent hover:border-emerald-100">
                {link.label}
             </button>
           ))}
        </div>

        <form onSubmit={handleUpdate} className="space-y-8">
           {/* 1. البيانات الشخصية */}
           <div ref={profileSection} className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8 animate-reveal">
              <h4 className="text-xl font-black text-slate-800 flex items-center gap-3">
                 <UserIcon className="text-emerald-500 h-5 w-5" /> المعلومات الشخصية
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 px-4 block">الاسم الرباعي</label>
                    <input 
                      value={formData.name || ''} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      className="w-full bg-slate-50 rounded-2xl p-5 font-black text-sm outline-none border-2 border-transparent focus:border-emerald-500 transition-all shadow-inner" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 px-4 block">رقم الهاتف</label>
                    <input 
                      value={formData.phone || ''} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      className="w-full bg-slate-50 rounded-2xl p-5 font-black text-sm outline-none text-left border-2 border-transparent focus:border-emerald-500 transition-all shadow-inner" dir="ltr" 
                    />
                 </div>
              </div>
           </div>

           {/* 2. بيانات الدخول */}
           <div ref={authSection} className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8 animate-reveal">
              <h4 className="text-xl font-black text-slate-800 flex items-center gap-3">
                 <Lock className="text-indigo-500 h-5 w-5" /> بيانات الدخول والحماية
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 px-4 block">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 h-4 w-4" />
                      <input 
                        value={formData.email || ''} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        className="w-full bg-slate-50 rounded-2xl py-5 pr-14 pl-6 font-black text-sm outline-none border-2 border-transparent focus:border-emerald-500 transition-all shadow-inner" dir="ltr"
                      />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 px-4 block">تعيين كلمة مرور جديدة</label>
                    <div className="relative">
                      <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 h-4 w-4" />
                      <input 
                        type="text"
                        placeholder="اتركه فارغاً لعدم التغيير"
                        value={formData.password || ''} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        className="w-full bg-slate-50 rounded-2xl py-5 pr-14 pl-6 font-black text-sm outline-none border-2 border-transparent focus:border-rose-500 transition-all shadow-inner" dir="ltr"
                      />
                    </div>
                    <p className="text-[8px] font-bold text-rose-400 px-4 mt-1">تنبيه: سيتم تسجيل الدخول بالباسورد الجديد فوراً.</p>
                 </div>
              </div>
           </div>

           {/* 3. بيانات المركبة */}
           {formData.role === 'DRIVER' && (
              <div ref={vehicleSection} className="bg-slate-900 p-8 md:p-10 rounded-[3.5rem] shadow-xl space-y-8 animate-reveal text-white">
                 <h4 className="text-xl font-black flex items-center gap-3">
                    <Car className="text-emerald-400 h-5 w-5" /> تفاصيل المركبة
                 </h4>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 px-4 uppercase tracking-widest">نوع المركبة المعتمد للكابتن</label>
                    <div className="grid grid-cols-3 gap-4">
                       {[
                         { id: 'TOKTOK', label: 'توك توك', icon: <Zap className="h-5 w-5" /> },
                         { id: 'MOTORCYCLE', label: 'موتوسيكل', icon: <Bike className="h-5 w-5" /> },
                         { id: 'CAR', label: 'سيارة', icon: <Car className="h-5 w-5" /> }
                       ].map(v => (
                          <button 
                             key={v.id}
                             type="button"
                             onClick={() => setFormData({...formData, vehicleType: v.id as VehicleType})}
                             className={`py-6 rounded-3xl font-black text-[10px] border-4 transition-all flex flex-col items-center gap-2 ${formData.vehicleType === v.id ? 'bg-emerald-500 border-white text-white shadow-xl scale-105' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
                          >
                             {v.icon}
                             {v.label}
                          </button>
                       ))}
                    </div>
                 </div>
              </div>
           )}

           {/* 4. المحفظة */}
           <div ref={walletSection} className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8 animate-reveal">
              <h4 className="text-xl font-black text-slate-800 flex items-center gap-3">
                 <CreditCard className="text-emerald-500 h-5 w-5" /> إدارة الرصيد
              </h4>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 px-4 block">تعديل رصيد المحفظة الحالي (ج.م)</label>
                 <div className="relative">
                    <input 
                      type="number" 
                      value={formData.wallet?.balance || 0} 
                      onChange={e => setFormData({...formData, wallet: { ...targetUser?.wallet, balance: Number(e.target.value), totalEarnings: targetUser?.wallet.totalEarnings || 0, withdrawn: targetUser?.wallet.withdrawn || 0 }})} 
                      className="w-full bg-slate-50 rounded-3xl p-8 text-5xl font-black outline-none border-2 border-transparent focus:border-emerald-500 transition-all text-center shadow-inner" 
                    />
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                       <CreditCard className="h-10 w-10" />
                    </div>
                 </div>
              </div>
           </div>

           {/* 5. الرتبة والحالة */}
           <div ref={statusSection} className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8 animate-reveal">
              <h4 className="text-xl font-black text-slate-800 flex items-center gap-3">
                 <Settings className="text-slate-400 h-5 w-5" /> الصلاحيات وحالة التفعيل
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 px-4 block">رتبة العضو</label>
                    <div className="relative">
                      <select 
                         value={formData.role || ''} 
                         onChange={e => setFormData({...formData, role: e.target.value as UserRole})} 
                         className="w-full bg-slate-50 rounded-2xl p-5 font-black text-sm outline-none appearance-none border-2 border-transparent focus:border-emerald-500 shadow-inner"
                      >
                         <option value="CUSTOMER">عميل (Customer)</option>
                         <option value="DRIVER">كابتن (Driver)</option>
                         <option value="OPERATOR">مشغل (Operator)</option>
                         <option value="ADMIN">مدير (Admin)</option>
                      </select>
                      <ChevronDown className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 px-4 block">حالة الحساب (Activation)</label>
                    <div className="relative">
                      <select 
                         value={formData.status || ''} 
                         onChange={e => setFormData({...formData, status: e.target.value as UserStatus})} 
                         className="w-full bg-slate-50 rounded-2xl p-5 font-black text-sm outline-none appearance-none border-2 border-transparent focus:border-emerald-500 shadow-inner"
                      >
                         <option value="APPROVED">مفعل (نشط الآن)</option>
                         <option value="PENDING_APPROVAL">معلق (بانتظار مراجعة)</option>
                         <option value="SUSPENDED">محظور (موقوف مؤقتاً)</option>
                      </select>
                      <ChevronDown className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    </div>
                 </div>
              </div>
           </div>

           {/* زر الحفظ النهائي */}
           <div className="pt-8">
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-emerald-600 text-white py-8 rounded-[2.5rem] font-black text-2xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 hover:bg-emerald-700 hover:shadow-emerald-200"
              >
                {isSaving ? <Loader2 className="h-8 w-8 animate-spin" /> : <><Save className="h-8 w-8" /> حفظ التعديلات الشاملة</>}
              </button>
           </div>
        </form>

        <div className="mt-12 bg-amber-50 p-8 rounded-[2.5rem] border-2 border-dashed border-amber-200 flex items-start gap-5">
           <div className="bg-amber-500 p-3 rounded-2xl text-white shadow-lg shrink-0"><AlertTriangle className="h-6 w-6" /></div>
           <div className="text-right">
              <h5 className="font-black text-amber-800 mb-1">تنبيه أمان للمسؤول</h5>
              <p className="text-[11px] font-bold text-amber-700 leading-relaxed">تغيير البريد الإلكتروني أو الهاتف قد يؤثر على تجربة دخول العضو. يرجى التأكد من صحة البيانات وتزويد العضو بالباسورد الجديد إذا قمت بتغييره.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEditUser;
