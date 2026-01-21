
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Types
import type { User, UserRole, UserStatus } from '../types';

// Utils
import { stripFirestore } from '../utils';

// Services
import { db } from '../services/firebase';
import { 
  collection, query, onSnapshot, orderBy, doc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Icons
import { 
  ArrowRight, Search, Users, Shield, 
  Bike, User as UserIcon, Trash2, Edit3, 
  Filter, ChevronLeft, CheckCircle2, XCircle, 
  AlertTriangle, Loader2, ArrowDown, ArrowUp
} from 'lucide-react';

const AdminUsersList: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  
  // Scrolling Logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState<'UP' | 'DOWN'>('DOWN');

  useEffect(() => {
    return onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) })) as User[]);
      setLoading(false);
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

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.phone?.includes(searchTerm);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) return (
    <div className="h-full flex items-center justify-center py-40">
      <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
    </div>
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
        className="fixed bottom-10 left-10 z-[1000] bg-slate-900 text-white p-5 rounded-full shadow-2xl animate-in fade-in zoom-in active:scale-90 transition-all border-4 border-white"
      >
        {showScrollBtn === 'DOWN' ? <ArrowDown className="h-6 w-6 animate-bounce" /> : <ArrowUp className="h-6 w-6" />}
      </button>

      <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-6 md:space-y-8 animate-in fade-in duration-700 text-right pb-40" dir="rtl">
        <div className="flex flex-col md:flex-row-reverse justify-between items-center gap-6 mb-4">
          <div className="flex items-center gap-4 md:gap-5 w-full md:w-auto">
             <div className="bg-indigo-600 p-3 md:p-4 rounded-[1.5rem] md:rounded-3xl text-white shadow-xl">
                <Users className="h-6 w-6 md:h-8 md:w-8" />
             </div>
             <div className="text-right">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">دليل الأعضاء</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">إدارة {users.length} مستخدم</p>
             </div>
          </div>
          <button onClick={() => navigate('/')} className="w-full md:w-auto p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-indigo-600 flex items-center justify-center md:justify-start gap-2 transition-all">
            <span className="font-black text-xs">رجوع للرئيسية</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] md:rounded-[3rem] shadow-sm border border-slate-50 flex flex-col lg:flex-row-reverse gap-4 justify-between items-center sticky top-0 z-[100] backdrop-blur-xl bg-white/90">
           <div className="relative flex-1 w-full max-w-xl group">
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 h-5 w-5 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder="ابحث بالاسم أو رقم الموبايل..." 
                className="w-full bg-slate-50 rounded-[2rem] py-5 pr-14 pl-8 font-black text-sm outline-none focus:bg-white transition-all shadow-inner border-2 border-transparent focus:border-indigo-100" 
              />
           </div>
           <div className="flex gap-2 overflow-x-auto no-scrollbar w-full lg:w-auto pb-2 lg:pb-0">
              {['ALL', 'CUSTOMER', 'DRIVER', 'OPERATOR', 'ADMIN'].map(role => (
                <button 
                  key={role} 
                  onClick={() => setRoleFilter(role as any)} 
                  className={`px-6 py-4 rounded-2xl font-black text-[10px] whitespace-nowrap transition-all flex-1 md:flex-none ${roleFilter === role ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-indigo-600'}`}
                >
                  {role === 'ALL' ? 'الكل' : role}
                </button>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map(u => (
            <div key={u.id} className="bg-white p-6 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm flex flex-col gap-6 group hover:border-indigo-500 transition-all">
               <div className="flex items-center gap-4 md:gap-5 flex-row-reverse text-right">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-100 rounded-2xl md:rounded-3xl flex items-center justify-center font-black text-slate-300 text-xl md:text-2xl overflow-hidden shadow-inner shrink-0 group-hover:bg-slate-950 group-hover:text-indigo-400 transition-all">
                    {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : (u.name || 'ع')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                     <h4 className="font-black text-slate-900 text-base md:text-lg truncate leading-tight">{u.name}</h4>
                     <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{u.phone}</p>
                  </div>
               </div>
               <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl flex-row-reverse">
                  <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${u.role === 'DRIVER' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>{u.role}</span>
                  <p className="text-xs md:text-sm font-black text-slate-900">{(u.wallet?.balance || 0).toFixed(1)} <span className="text-[9px] opacity-40">ج.م</span></p>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => navigate(`/admin/edit-user/${u.id}`)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                     <Edit3 className="h-3.5 w-3.5" /> تعديل شامل
                  </button>
                  <button onClick={async () => { if(confirm('حذف نهائي؟')) await deleteDoc(doc(db, "users", u.id)); }} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all active:scale-90 shadow-sm">
                     <Trash2 className="h-4 w-4" />
                  </button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminUsersList;
