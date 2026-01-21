
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Types
import type { Ad, User } from '../types';

// Utils
import { stripFirestore, compressImage } from '../utils';

// Services
import { db } from '../services/firebase';
import { 
  collection, query, doc, onSnapshot, 
  setDoc, deleteDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Icons
import { 
  ArrowRight, Megaphone, Plus, X, Trash2, 
  Camera, Loader2, Save, CheckCircle2, 
  PlusCircle, Eye, MousePointer2, Image as ImageIcon, MessageCircle, Edit3, Type
} from 'lucide-react';

const AdminAdsManager: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [ads, setAds] = useState<Ad[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const initialAdState: Partial<Ad> = {
    title: '', 
    description: '', 
    imageUrl: '', 
    type: 'special_offer', 
    isActive: true, 
    displayOrder: 0, 
    whatsappNumber: '',
    ctaText: 'استفد من العرض الآن'
  };

  const [adData, setAdData] = useState<Partial<Ad>>(initialAdState);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return onSnapshot(collection(db, "ads"), (snap) => {
      setAds(snap.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) })) as Ad[]);
    });
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string);
      setAdData(prev => ({ ...prev, imageUrl: compressed }));
    };
    reader.readAsDataURL(file);
  };

  const startEdit = (ad: Ad) => {
    setAdData(stripFirestore(ad));
    setEditingId(ad.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setAdData(initialAdState);
  };

  const saveAd = async () => {
    if (!adData.title || !adData.imageUrl) {
      alert('يرجى ملء العنوان وصورة الإعلان');
      return;
    }
    setLoading(true);
    try {
      const id = editingId || `ad_${Date.now()}`;
      const finalData = { 
        ...adData, 
        id, 
        createdAt: adData.createdAt || Date.now(), 
        views: adData.views || 0, 
        clicks: adData.clicks || 0,
        whatsappNumber: adData.whatsappNumber?.replace(/\s/g, '') || '',
        ctaText: adData.ctaText || 'استفد من العرض الآن'
      };
      
      // التطهير قبل الإرسال لمنع Circular references
      await setDoc(doc(db, "ads", id), stripFirestore(finalData));
      
      cancelForm();
      alert(editingId ? 'تم تحديث الإعلان بنجاح' : 'تم نشر الإعلان بنجاح');
    } catch (e) { 
      console.error(e);
      alert('خطأ في العملية: تأكد من صغر حجم الصورة المرفوعة'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10 animate-in slide-in-from-bottom duration-500 text-right pb-32" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-5">
           <div className="bg-amber-500 p-4 rounded-3xl text-white shadow-xl">
              <Megaphone className="h-8 w-8" />
           </div>
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">إدارة الإعلانات</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">إضافة وتعديل السلايدر العلوي والعروض الخاصة</p>
           </div>
        </div>
        <button onClick={() => navigate('/')} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-amber-600 flex items-center gap-2">
          <span className="font-black text-xs">رجوع</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      {!isAdding ? (
        <button onClick={() => setIsAdding(true)} className="w-full bg-slate-900 text-white p-8 rounded-[3rem] font-black text-xl flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all">
           <PlusCircle className="h-8 w-8 text-amber-400" /> إضافة إعلان جديد الآن
        </button>
      ) : (
        <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl space-y-10 animate-in zoom-in border-4 border-amber-50">
           <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-800">{editingId ? 'تعديل الإعلان الحالي' : 'تصميم إعلان جديد'}</h3>
              <button onClick={cancelForm} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-rose-500 transition-colors"><X /></button>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                 <div onClick={() => fileRef.current?.click()} className="w-full aspect-[21/9] bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-amber-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group">
                    {adData.imageUrl ? (
                       <>
                         <img src={adData.imageUrl} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-black text-sm">تغيير الصورة</div>
                       </>
                    ) : (
                       <>
                         <Camera className="h-12 w-12 text-amber-200 mb-2" />
                         <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest text-center px-6">قياس مثالي 21:9 (عرض السلايدر)</p>
                       </>
                    )}
                    <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                 </div>

                 <div className="space-y-4">
                    <div className="relative group">
                       <Type className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 h-5 w-5 group-focus-within:text-amber-500" />
                       <input value={adData.title} onChange={e => setAdData({...adData, title: e.target.value})} placeholder="عنوان الإعلان الرئيسي" className="w-full bg-slate-50 rounded-2xl py-5 pr-14 pl-6 font-black text-sm outline-none border-2 border-transparent focus:border-amber-500" />
                    </div>
                    <textarea value={adData.description} onChange={e => setAdData({...adData, description: e.target.value})} placeholder="وصف العرض بالتفصيل..." className="w-full bg-slate-50 rounded-2xl p-6 font-bold text-sm outline-none border-2 border-transparent focus:border-amber-500 min-h-[150px]" />
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 block">نص زر التحرك</label>
                       <input value={adData.ctaText} onChange={e => setAdData({...adData, ctaText: e.target.value})} className="w-full bg-slate-50 rounded-xl p-4 font-black text-xs outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 block">رقم واتساب الطلب</label>
                       <input value={adData.whatsappNumber} onChange={e => setAdData({...adData, whatsappNumber: e.target.value})} placeholder="2010..." className="w-full bg-slate-50 rounded-xl p-4 font-black text-xs outline-none text-left" dir="ltr" />
                    </div>
                 </div>

                 <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 space-y-4">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest text-center">الإحصائيات الحالية</p>
                    <div className="flex justify-around">
                       <div className="text-center"><Eye className="h-6 w-6 text-amber-500 mx-auto mb-1" /><p className="text-xl font-black text-slate-900">{adData.views || 0}</p><span className="text-[8px] font-bold text-slate-400">مشاهدة</span></div>
                       <div className="text-center"><MousePointer2 className="h-6 w-6 text-emerald-500 mx-auto mb-1" /><p className="text-xl font-black text-slate-900">{adData.clicks || 0}</p><span className="text-[8px] font-bold text-slate-400">نقرة</span></div>
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <button onClick={cancelForm} className="flex-1 bg-slate-100 text-slate-500 py-6 rounded-3xl font-black text-lg active:scale-95 transition-all">إلغاء</button>
                    <button onClick={saveAd} disabled={loading} className="flex-[2] bg-amber-500 text-white py-6 rounded-3xl font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4">
                        {loading ? <Loader2 className="animate-spin" /> : <><Save /> {editingId ? 'حفظ التعديلات' : 'نشر الإعلان الآن'}</>}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {ads.map(ad => (
           <div key={ad.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden group hover:border-amber-500 transition-all flex flex-col">
              <div className="relative aspect-[21/9] overflow-hidden">
                 <img src={ad.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                 {!ad.isActive && <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center text-white font-black text-xs uppercase tracking-widest">غير نشط</div>}
              </div>
              <div className="p-8 space-y-6 flex-1 flex flex-col">
                 <div className="text-right flex-1">
                    <h4 className="font-black text-xl text-slate-900 mb-2">{ad.title}</h4>
                    <p className="text-xs font-bold text-slate-400 line-clamp-2 leading-relaxed">{ad.description}</p>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => startEdit(ad)} className="flex-1 bg-slate-50 text-slate-600 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-amber-50 hover:text-amber-600 transition-all"><Edit3 className="h-4 w-4" /> تعديل</button>
                    <button onClick={async () => { if(confirm('حذف الإعلان؟')) await deleteDoc(doc(db, "ads", ad.id)); }} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="h-4 w-4" /></button>
                 </div>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};

export default AdminAdsManager;
