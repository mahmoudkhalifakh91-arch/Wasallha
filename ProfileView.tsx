import React, { useState, useRef, useEffect } from 'react';

// Types
import type { User, Order } from '../types';
import { OrderStatus } from '../types';
import { MENOFIA_DATA } from '../config/constants';

// Services
import { auth, db } from '../services/firebase';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Icons
import { 
  User as UserIcon, Smartphone, Edit3, Camera, Loader2, ChevronRight, 
  Bike, Car, Star, ShieldCheck, Zap, Wallet as WalletIcon, ArrowRight,
  Building2, MapPin, LogOut, AlertTriangle, X
} from 'lucide-react';

const ProfileView: React.FC<{ user: User, onUpdate: (u: User) => void, onBack: () => void, onOpenWallet?: () => void }> = ({ user, onUpdate, onBack, onOpenWallet }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateProfile = async () => {
    if (!name.trim() || phone.length < 11) {
      alert("يرجى التأكد من الاسم ورقم الهاتف");
      return;
    }
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.id), { name, phone });
      onUpdate({ ...user, name, phone });
      setIsEditing(false);
    } catch (e) { 
      alert('خطأ في التحديث'); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return alert('يرجى اختيار ملف صورة صحيح');
    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = async () => {
      const base64Image = reader.result as string;
      try {
        await updateDoc(doc(db, "users", user.id), { photoURL: base64Image });
        onUpdate({ ...user, photoURL: base64Image });
      } catch (err) {
        alert('فشل في حفظ الصورة');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    try {
      setShowLogoutConfirm(false);
      await signOut(auth);
      // إعادة تحميل الصفحة بالكامل لضمان الخروج الآمن وتجنب أخطاء المسارات
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      window.location.reload();
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-32 space-y-8 p-6 animate-in slide-in-from-bottom duration-500 overflow-y-auto h-full no-scrollbar relative">
      
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[1200] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 text-center space-y-6 shadow-2xl animate-in zoom-in border border-slate-100">
              <div className="bg-rose-50 w-24 h-24 rounded-[3rem] flex items-center justify-center mx-auto text-rose-500 shadow-inner">
                <LogOut className="h-12 w-12 rotate-180" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-3xl font-black text-slate-900 tracking-tighter">تأكيد الخروج</h3>
                 <p className="text-sm font-bold text-slate-400">هل تريد حقاً تسجيل الخروج من حسابك في وصلها؟</p>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                 <button onClick={handleLogout} className="w-full bg-rose-500 text-white py-6 rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-all">خروج</button>
                 <button onClick={() => setShowLogoutConfirm(false)} className="w-full bg-slate-50 text-slate-400 py-5 rounded-[2rem] font-black active:scale-95 transition-all">تراجع</button>
              </div>
           </div>
        </div>
      )}

      <div className="flex items-center justify-between px-2">
        <div className="text-right">
           <h2 className="text-3xl font-black text-slate-900 tracking-tighter">حسابي الشخصي</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">إدارة بياناتك في وصلها</p>
        </div>
        <button onClick={onBack} className="p-3.5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm active:scale-90 transition-all"><ChevronRight /></button>
      </div>

      <div className="bg-[#2D9469] rounded-[4rem] p-12 text-white text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        
        <div className="relative inline-block group">
          <div className="w-40 h-40 bg-white/20 backdrop-blur-xl rounded-[3.5rem] mx-auto flex items-center justify-center mb-8 overflow-hidden border-8 border-white/10 shadow-2xl relative transition-transform hover:scale-105 duration-500">
            {isUploading ? (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                <Loader2 className="h-10 w-10 animate-spin text-white" />
              </div>
            ) : null}
            
            {user.photoURL ? (
              <img src={user.photoURL} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <UserIcon className="h-20 w-20 text-white/50" />
            )}
          </div>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-6 -right-2 bg-white text-[#2D9469] p-4 rounded-3xl shadow-xl active:scale-75 transition-all border-4 border-[#2D9469] hover:rotate-12"
          >
            <Camera className="h-6 w-6" />
          </button>
          
          <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
        </div>

        <h3 className="text-3xl font-black tracking-tight">{user.name}</h3>
        <div className="flex items-center justify-center gap-3 mt-3">
          {user.status === 'APPROVED' && (
            <div className="flex items-center gap-2 bg-emerald-400/20 text-emerald-100 px-4 py-1.5 rounded-full text-[9px] font-black border border-emerald-400/20 backdrop-blur-md">
               <ShieldCheck className="h-4 w-4" /> حساب موثق في المنوفية
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {onOpenWallet && (
           <div className="px-2">
              <button onClick={onOpenWallet} className="w-full bg-slate-950 text-white p-10 rounded-[3.5rem] flex justify-between items-center shadow-xl group active:scale-95 transition-all">
                 <div className="flex items-center gap-6 text-right">
                    <div className="bg-emerald-500 p-5 rounded-[2.5rem] group-hover:scale-110 transition-transform shadow-xl">
                       <WalletIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">رصيدي الحالي</p>
                       <p className="text-4xl font-black">{(user.wallet?.balance || 0).toFixed(2)} <span className="text-sm opacity-40 font-bold">ج.م</span></p>
                    </div>
                 </div>
                 <ArrowRight className="h-8 w-8 text-slate-700" />
              </button>
           </div>
        )}

        <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-8 mx-2">
           <div className="flex justify-between items-center">
              <h4 className="font-black text-slate-800 text-lg flex items-center gap-3"><Edit3 className="h-5 w-5 text-[#2D9469]" /> البيانات الأساسية</h4>
              <button 
                onClick={() => isEditing ? handleUpdateProfile() : setIsEditing(true)} 
                disabled={isSaving}
                className={`font-black text-xs uppercase tracking-widest px-8 py-3 rounded-[1.2rem] transition-all ${isEditing ? 'bg-emerald-50 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-400 hover:text-[#2D9469]'}`}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? 'حفظ' : 'تعديل'}
              </button>
           </div>
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 block">الاسم</label>
                 <input value={name} onChange={e => setName(e.target.value)} disabled={!isEditing} className={`w-full bg-slate-50 rounded-3xl p-6 font-black text-sm outline-none transition-all ${isEditing ? 'bg-white border-2 border-emerald-100 ring-4 ring-emerald-500/5' : 'border-none shadow-inner'}`} />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 block">رقم الموبايل</label>
                 <input value={phone} onChange={e => setPhone(e.target.value)} disabled={!isEditing} maxLength={11} className={`w-full bg-slate-50 rounded-3xl p-6 font-black text-sm outline-none transition-all text-left ${isEditing ? 'bg-white border-2 border-emerald-100 ring-4 ring-emerald-500/5' : 'border-none shadow-inner'}`} dir="ltr" />
              </div>
           </div>
        </div>

        <div className="px-2 pt-4">
           <button 
             onClick={() => setShowLogoutConfirm(true)}
             className="w-full bg-rose-50 text-rose-600 p-8 rounded-[3.5rem] flex items-center justify-between shadow-sm border-2 border-rose-100 hover:bg-rose-100 hover:border-rose-300 active:scale-[0.98] transition-all group overflow-hidden relative"
           >
              <div className="flex items-center gap-6 relative z-10">
                 <div className="bg-white p-5 rounded-[2.2rem] shadow-sm group-hover:scale-110 transition-transform group-hover:bg-rose-500 group-hover:text-white">
                   <LogOut className="h-8 w-8 rotate-180" />
                 </div>
                 <div className="text-right">
                    <p className="font-black text-xl tracking-tight">تسجيل الخروج</p>
                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mt-0.5">نراكم قريباً في وصلها</p>
                 </div>
              </div>
              <ChevronRight className="h-6 w-6 text-rose-200 rotate-180 relative z-10" />
              <div className="absolute top-0 left-0 w-32 h-full bg-rose-500/5 blur-3xl group-hover:bg-rose-500/10 transition-all"></div>
           </button>
        </div>
      </div>
      
      <div className="p-10 text-center opacity-30 grayscale pointer-events-none space-y-4">
         <img src="https://img.icons8.com/fluency-systems-filled/512/000000/bicycle.png" className="h-12 w-12 mx-auto" />
         <p className="text-[9px] font-black uppercase tracking-[0.5em]">كل الحقوق محفوظة لشركة وصلها المنوفية ©M.R Mahmoud Khalifa</p>
      </div>
    </div>
  );
};

export default ProfileView;