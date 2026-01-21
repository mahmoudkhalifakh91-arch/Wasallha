
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Types
import type { Restaurant, MenuItem, User, District, Village } from '../types';
import { MENOFIA_DATA } from '../config/constants';

// Utils
import { stripFirestore, compressImage } from '../utils';

// Services
import { db } from '../services/firebase';
import { 
  collection, query, doc, onSnapshot, 
  setDoc, deleteDoc, updateDoc, orderBy, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Icons
import { 
  ArrowRight, Store, Plus, X, Trash2, Edit3, 
  Camera, FileText, Loader2, Save, Utensils,
  PlusCircle, Building2, Search, MapPin, ChevronDown,
  ArrowDown, ArrowUp
} from 'lucide-react';

const AdminRestaurantManager: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Scrolling Logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState<'UP' | 'DOWN'>('DOWN');

  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);

  const initialRestState = { 
    name: '', category: 'مشويات', photoURL: '', menuImageURL: '', address: ''
  };

  const [restData, setRestData] = useState(initialRestState);
  const [newItem, setNewItem] = useState({ name: '', price: 0, photoURL: '' });
  const [activeRestId, setActiveRestId] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const menuImgRef = useRef<HTMLInputElement>(null);
  const itemFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return onSnapshot(query(collection(db, "restaurants"), orderBy("name", "asc")), (snap) => {
      setRestaurants(snap.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) })) as Restaurant[]);
    });
  }, []);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'PHOTO' | 'MENU' | 'ITEM') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const originalBase64 = reader.result as string;
      const compressed = await compressImage(originalBase64);
      
      if (target === 'PHOTO') setRestData(prev => ({ ...prev, photoURL: compressed }));
      if (target === 'MENU') setRestData(prev => ({ ...prev, menuImageURL: compressed }));
      if (target === 'ITEM') setNewItem(prev => ({ ...prev, photoURL: compressed }));
    };
    reader.readAsDataURL(file);
  };

  const startEdit = (rest: Restaurant) => {
    setEditingId(rest.id);
    setRestData({
      name: rest.name, category: rest.category, photoURL: rest.photoURL || '',
      menuImageURL: rest.menuImageURL || '', address: rest.address
    });
    setIsAdding(true);
    scrollToPosition('TOP');
  };

  const saveRestaurant = async () => {
    if (!restData.name || !selectedVillage) return alert('يرجى إكمال البيانات');
    setLoading(true);
    try {
      const id = editingId || `rest_${Date.now()}`;
      const existingRest = restaurants.find(r => r.id === id);
      const cleanData = stripFirestore({
        ...restData, id, address: selectedVillage.name, menu: existingRest?.menu || [],
        isOpen: existingRest?.isOpen ?? true, lat: selectedVillage.center.lat, lng: selectedVillage.center.lng
      });
      await setDoc(doc(db, "restaurants", id), cleanData);
      setIsAdding(false); setEditingId(null); setRestData(initialRestState);
      alert('تم الحفظ');
    } catch (e) { alert('خطأ'); } finally { setLoading(false); }
  };

  const addMenuItem = async (rid: string) => {
    if (!newItem.name || newItem.price <= 0) return;
    const rest = restaurants.find(r => r.id === rid);
    if (!rest) return;
    try {
      const menu = [...(rest.menu || []), { ...newItem, id: `item_${Date.now()}` }];
      await updateDoc(doc(db, "restaurants", rid), { menu: stripFirestore(menu) });
      setNewItem({ name: '', price: 0, photoURL: '' });
    } catch (e) { alert('خطأ'); }
  };

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto no-scrollbar scroll-smooth relative bg-[#f8fafc]"
    >
      <button onClick={() => scrollToPosition(showScrollBtn === 'DOWN' ? 'BOTTOM' : 'TOP')} className="fixed bottom-10 left-10 z-[1000] bg-slate-900 text-white p-5 rounded-full shadow-2xl active:scale-90 transition-all border-4 border-white group">
        {showScrollBtn === 'DOWN' ? <ArrowDown className="h-6 w-6 animate-bounce" /> : <ArrowUp className="h-6 w-6" />}
      </button>

      <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10 text-right pb-40" dir="rtl">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-5">
             <div className="bg-emerald-600 p-4 rounded-3xl text-white shadow-xl"><Store className="h-8 w-8" /></div>
             <div><h2 className="text-3xl font-black text-slate-900 tracking-tighter">إدارة المطاعم</h2><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">تعديل الوجبات والقوائم</p></div>
          </div>
          <button onClick={() => navigate('/')} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-emerald-600 flex items-center gap-2 transition-all"><span className="font-black text-xs">رجوع</span><ArrowRight className="h-5 w-5" /></button>
        </div>

        <div className="bg-white p-6 rounded-[3rem] shadow-sm border border-slate-50 flex flex-col md:flex-row-reverse gap-4 justify-between items-center sticky top-0 z-[100] backdrop-blur-xl bg-white/90">
           <div className="relative flex-1 w-full max-w-md"><Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 h-5 w-5" /><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="بحث..." className="w-full bg-slate-50 rounded-[1.8rem] py-4 pr-14 pl-6 font-black text-xs outline-none" /></div>
           {!isAdding && <button onClick={() => setIsAdding(true)} className="bg-slate-900 text-white px-10 py-4 rounded-[1.8rem] font-black text-xs flex items-center gap-3 active:scale-95 transition-all"><PlusCircle className="h-4 w-4" /> إضافة مطعم</button>}
        </div>

        {isAdding && (
          <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl space-y-10 animate-in zoom-in border-4 border-emerald-50">
             <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800">{editingId ? 'تعديل مطعم' : 'مطعم جديد'}</h3>
                <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-rose-500 transition-colors"><X /></button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input value={restData.name} onChange={e => setRestData({...restData, name: e.target.value})} placeholder="اسم المطعم" className="w-full bg-slate-50 p-6 rounded-2xl font-black text-sm outline-none" />
                <input value={restData.category} onChange={e => setRestData({...restData, category: e.target.value})} placeholder="التصنيف" className="w-full bg-slate-50 p-6 rounded-2xl font-black text-sm outline-none" />
                <select onChange={e => setSelectedDistrict(MENOFIA_DATA.find(d => d.id === e.target.value) || null)} className="w-full bg-slate-50 p-6 rounded-2xl font-black text-sm outline-none"><option value="">اختر المركز</option>{MENOFIA_DATA.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                <select disabled={!selectedDistrict} onChange={e => setSelectedVillage(selectedDistrict?.villages.find(v => v.id === e.target.value) || null)} className="w-full bg-slate-50 p-6 rounded-2xl font-black text-sm outline-none disabled:opacity-50"><option value="">اختر القرية</option>{selectedDistrict?.villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
             </div>
             <button onClick={saveRestaurant} disabled={loading} className="w-full bg-emerald-600 text-white py-7 rounded-[2rem] font-black text-lg active:scale-95 transition-all flex items-center justify-center gap-4">{loading ? <Loader2 className="animate-spin" /> : <><Save /> حفظ</>}</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {restaurants.filter(r => r.name.includes(searchTerm)).map(rest => (
             <div key={rest.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl flex flex-col gap-8 group hover:border-emerald-500 transition-all">
                <div className="flex justify-between items-start flex-row-reverse">
                   <div className="flex items-center gap-5 flex-row-reverse text-right">
                      <div className="w-20 h-20 bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl shrink-0">{rest.photoURL ? <img src={rest.photoURL} className="w-full h-full object-cover" /> : <Building2 className="p-5 text-emerald-400" />}</div>
                      <div className="min-w-0"><h4 className="font-black text-2xl text-slate-950 truncate leading-tight">{rest.name}</h4><p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{rest.category}</p></div>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => startEdit(rest)} className="bg-slate-50 text-slate-400 p-4 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"><Edit3 className="h-5 w-5" /></button>
                      <button onClick={async () => { if(confirm('حذف؟')) await deleteDoc(doc(db, "restaurants", rest.id)); }} className="bg-rose-50 text-rose-500 p-4 rounded-2xl active:scale-90 transition-all shadow-sm"><Trash2 className="h-5 w-5" /></button>
                   </div>
                </div>
                <div className="space-y-6">
                   <div className="grid gap-3 max-h-64 overflow-y-auto no-scrollbar">
                      {rest.menu?.map(item => (
                        <div key={item.id} className="bg-slate-50 p-4 rounded-[2rem] flex justify-between items-center flex-row-reverse">
                           <div className="flex items-center gap-4 flex-row-reverse"><p className="font-black text-sm text-slate-800">{item.name}</p><p className="text-[10px] font-bold text-emerald-600">{item.price} ج.م</p></div>
                           <button onClick={async () => { const menu = rest.menu.filter(i => i.id !== item.id); await updateDoc(doc(db, "restaurants", rest.id), { menu: stripFirestore(menu) }); }} className="p-2 text-rose-300 hover:text-rose-500 transition-colors"><X className="h-4 w-4" /></button>
                        </div>
                      ))}
                   </div>
                   <div className="bg-slate-950 p-8 rounded-[2.5rem] space-y-4">
                      <input value={activeRestId === rest.id ? newItem.name : ''} onChange={e => { setActiveRestId(rest.id); setNewItem({...newItem, name: e.target.value}); }} placeholder="اسم الوجبة" className="w-full bg-white/5 p-4 rounded-xl text-xs font-bold text-white outline-none text-right border border-white/10" />
                      <div className="flex gap-2"><input type="number" value={activeRestId === rest.id ? (newItem.price || '') : ''} onChange={e => { setActiveRestId(rest.id); setNewItem({...newItem, price: Number(e.target.value)}); }} placeholder="السعر" className="flex-1 bg-white/5 p-4 rounded-xl text-xs font-bold text-white outline-none text-right border border-white/10" /><button onClick={() => addMenuItem(rest.id)} className="bg-emerald-600 text-white px-8 rounded-xl font-black text-xs">إضافة</button></div>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default AdminRestaurantManager;
