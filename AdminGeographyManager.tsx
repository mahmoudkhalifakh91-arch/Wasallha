
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Types
import type { User, District, Village } from '../types';
import { MENOFIA_DATA as INITIAL_DATA } from '../config/constants';

// Services
import { db } from '../services/firebase';
import { 
  collection, doc, onSnapshot, setDoc, 
  updateDoc, arrayUnion, arrayRemove, getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Utils
import { stripFirestore } from '../utils';

// Icons
import { 
  ArrowRight, MapPin, Plus, X, Trash2, 
  Loader2, Save, Map as MapIcon, Building2,
  Zap, PlusCircle, Globe, ChevronDown, Check, Edit2, Navigation
} from 'lucide-react';

const AdminGeographyManager: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistId, setSelectedDistId] = useState<string | null>(null);
  const [newVillName, setNewVillName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for editing village coordinates
  const [editingVillageId, setEditingVillageId] = useState<string | null>(null);
  const [editLat, setEditLat] = useState<string>('');
  const [editLng, setEditLng] = useState<string>('');
  const [isUpdatingCoords, setIsUpdatingCoords] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "geo_config"), async (snap) => {
      if (snap.empty) {
        for (const dist of INITIAL_DATA) {
          await setDoc(doc(db, "geo_config", dist.id), dist);
        }
      } else {
        setDistricts(snap.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) })) as District[]);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const handleAddVillage = async () => {
    if (!selectedDistId || !newVillName.trim()) return;
    setIsSubmitting(true);
    try {
      const newVill: Village = {
        id: `v_${Date.now()}`,
        name: newVillName.trim(),
        center: { lat: 30.556, lng: 31.008 } 
      };
      await updateDoc(doc(db, "geo_config", selectedDistId), {
        villages: arrayUnion(newVill)
      });
      setNewVillName('');
      alert('تم إضافة القرية بنجاح لمخطط المنوفية');
    } catch (e) {
      alert('خطأ في الإضافة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveVillage = async (distId: string, village: Village) => {
    if (!confirm(`هل أنت متأكد من حذف قرية "${village.name}"؟`)) return;
    try {
      await updateDoc(doc(db, "geo_config", distId), {
        villages: arrayRemove(village)
      });
    } catch (e) { alert('خطأ في الحذف'); }
  };

  const startEditingCoords = (v: Village) => {
    setEditingVillageId(v.id);
    setEditLat(v.center.lat.toString());
    setEditLng(v.center.lng.toString());
  };

  const handleUpdateCoords = async (distId: string, village: Village) => {
    const newLat = parseFloat(editLat);
    const newLng = parseFloat(editLng);

    if (isNaN(newLat) || isNaN(newLng)) {
      alert('يرجى إدخال أرقام صحيحة للإحداثيات');
      return;
    }

    setIsUpdatingCoords(true);
    try {
      const distRef = doc(db, "geo_config", distId);
      const district = districts.find(d => d.id === distId);
      if (!district) return;

      const updatedVillages = district.villages.map(v => {
        if (v.id === village.id) {
          return { ...v, center: { lat: newLat, lng: newLng } };
        }
        return v;
      });

      await updateDoc(distRef, { villages: updatedVillages });
      setEditingVillageId(null);
      alert('تم تحديث إحداثيات القرية بنجاح');
    } catch (e) {
      alert('خطأ في تحديث الإحداثيات');
    } finally {
      setIsUpdatingCoords(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10 animate-in slide-in-from-bottom duration-500 text-right pb-32" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-5">
           <div className="bg-rose-500 p-4 rounded-3xl text-white shadow-xl">
              <MapIcon className="h-8 w-8" />
           </div>
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">إدارة النطاق الجغرافي</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">توسيع تغطية وصـــلــهــا وتعديل المواقع</p>
           </div>
        </div>
        <button onClick={() => navigate('/')} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-rose-500 flex items-center gap-2">
          <span className="font-black text-xs">رجوع</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      {/* Add Village Form */}
      <div className="bg-slate-950 p-10 rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden space-y-8">
         <div className="absolute top-0 left-0 w-64 h-full bg-rose-500/5 blur-3xl"></div>
         <div className="relative z-10">
            <h3 className="text-2xl font-black mb-2 flex items-center gap-3"><PlusCircle className="text-rose-400" /> إضافة قرية جديدة لمخطط المحافظة</h3>
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-10">سيتم تفعيل القرية فوراً لجميع العملاء والكباتن</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 block">اختر المركز الإداري</label>
                  <select 
                    value={selectedDistId || ''} 
                    onChange={e => setSelectedDistId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 font-black text-sm outline-none text-right appearance-none focus:border-rose-500"
                  >
                     <option value="" className="text-slate-900">اختر المركز...</option>
                     {districts.map(d => <option key={d.id} value={d.id} className="text-slate-900">{d.name}</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 block">اسم القرية / المنطقة</label>
                  <input 
                    value={newVillName}
                    onChange={e => setNewVillName(e.target.value)}
                    placeholder="مثال: عزبة فرج الله"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 font-black text-sm outline-none text-right focus:border-rose-500"
                  />
               </div>
               <button 
                 onClick={handleAddVillage}
                 disabled={isSubmitting || !selectedDistId || !newVillName}
                 className="bg-rose-500 hover:bg-rose-600 text-white py-5 rounded-2xl font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-20"
               >
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save className="h-5 w-5" /> تأكيد الإضافة للمنظومة</>}
               </button>
            </div>
         </div>
      </div>

      {/* Districts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {loading ? (
           <div className="col-span-full py-20 flex justify-center"><Loader2 className="h-12 w-12 animate-spin text-rose-500" /></div>
         ) : districts.map(dist => (
           <div key={dist.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl flex flex-col gap-6 group hover:border-rose-500 transition-all">
              <div className="flex items-center justify-between flex-row-reverse">
                 <div className="flex items-center gap-4 flex-row-reverse text-right">
                    <div className="bg-slate-50 p-4 rounded-2xl text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-sm">
                       <Building2 className="h-6 w-6" />
                    </div>
                    <h4 className="font-black text-xl text-slate-900">مركز {dist.name}</h4>
                 </div>
                 <span className="bg-rose-50 text-rose-600 px-4 py-1 rounded-full text-[10px] font-black">{dist.villages.length} قرية</span>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-96 no-scrollbar border-r-4 border-slate-50 pr-4">
                 {dist.villages.map(v => (
                   <div key={v.id} className={`p-4 rounded-2xl transition-all border ${editingVillageId === v.id ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-transparent hover:border-rose-100'}`}>
                      {editingVillageId === v.id ? (
                        <div className="space-y-4 animate-in zoom-in duration-300">
                           <div className="flex justify-between items-center mb-2">
                              <span className="font-black text-xs text-rose-600">تعديل إحداثيات: {v.name}</span>
                              <button onClick={() => setEditingVillageId(null)} className="p-1 text-slate-400 hover:text-rose-500"><X className="h-4 w-4" /></button>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                 <label className="text-[8px] font-bold text-slate-400 mr-2">Latitude</label>
                                 <input 
                                   value={editLat} 
                                   onChange={e => setEditLat(e.target.value)}
                                   className="w-full bg-white p-2.5 rounded-xl text-[10px] font-black outline-none border border-rose-100 focus:border-rose-500" 
                                 />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[8px] font-bold text-slate-400 mr-2">Longitude</label>
                                 <input 
                                   value={editLng} 
                                   onChange={e => setEditLng(e.target.value)}
                                   className="w-full bg-white p-2.5 rounded-xl text-[10px] font-black outline-none border border-rose-100 focus:border-rose-500" 
                                 />
                              </div>
                           </div>
                           <button 
                             onClick={() => handleUpdateCoords(dist.id, v)}
                             disabled={isUpdatingCoords}
                             className="w-full bg-rose-600 text-white py-2 rounded-xl font-black text-[10px] shadow-lg flex items-center justify-center gap-2"
                           >
                              {isUpdatingCoords ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3" /> حفظ الإحداثيات</>}
                           </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between flex-row-reverse group/item">
                           <div className="flex items-center gap-3 flex-row-reverse text-right">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-300"></div>
                              <div>
                                 <p className="text-xs font-black text-slate-800">{v.name}</p>
                                 <div className="flex items-center gap-2 mt-1 opacity-40">
                                    <Navigation className="h-2.5 w-2.5" />
                                    <span className="text-[8px] font-bold">{v.center.lat.toFixed(4)}, {v.center.lng.toFixed(4)}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-all">
                              <button 
                                onClick={() => startEditingCoords(v)}
                                className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                              >
                                 <Edit2 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleRemoveVillage(dist.id, v)}
                                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                              >
                                 <Trash2 className="h-4 w-4" />
                              </button>
                           </div>
                        </div>
                      )}
                   </div>
                 ))}
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};

export default AdminGeographyManager;
