
import React, { useState, useRef, useEffect } from 'react';

// Types
import type { User, VehicleType, UserRole } from '../types';

// Utils
import { stripFirestore } from '../utils';

// Services
import { auth, db } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Icons
import { 
  Bike, Mail, Lock, User as UserIcon, 
  Smartphone, ShieldCheck, Eye, EyeOff,
  ChevronLeft, Car, Globe, Trophy, 
  Loader2, ArrowRight, MessageCircle, Zap, MapPin, Building
} from 'lucide-react';

const APP_LOGO_ICON = "https://img.icons8.com/fluency-systems-filled/512/FFFFFF/bicycle.png";

const Onboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const slides = [
    { title: "أهلاً بك في المنوفية", body: "وصـــلــهــا هو تطبيق التوصيل الأول والوحيد المخصص لخدمة كافة مراكز وقرى محافظة المنوفية.", icon: <Globe className="h-16 w-16 md:h-20 md:w-20 text-emerald-400" />, color: "from-[#2D9469] to-[#1e6346]" },
    { title: "كباتن ثقة وأمان", body: "كل رحلاتك مراقبة ومؤمنة، كباتننا هم جيرانك وأهلك من قلب مراكزنا العشرة.", icon: <ShieldCheck className="h-16 w-16 md:h-20 md:w-20 text-emerald-400" />, color: "from-slate-900 to-slate-800" },
    { title: "وفر وقتك وفلوسك", body: "أفضل تسعيرة في أقاليم مصر، مع نظام نقاط ومكافآت لكل مشوار بتمشي معانا فيه.", icon: <Trophy className="h-16 w-16 md:h-20 md:w-20 text-amber-400" />, color: "from-indigo-900 to-indigo-800" }
  ];

  return (
    <div className={`fixed inset-0 z-[5000] flex flex-col transition-all duration-1000 bg-gradient-to-br ${slides[step].color}`}>
       <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 text-center text-white space-y-8 md:space-y-12">
          <div className="bg-white/10 p-10 md:p-16 rounded-[3rem] md:rounded-[4.5rem] backdrop-blur-3xl animate-in zoom-in duration-700 shadow-2xl border border-white/20">
             {slides[step].icon}
          </div>
          <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom duration-1000 max-w-sm">
             <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-tight">{slides[step].title}</h2>
             <p className="text-white/70 font-bold leading-relaxed text-sm md:text-md">{slides[step].body}</p>
          </div>
       </div>
       <div className="p-8 md:p-12 pb-16 md:pb-20 space-y-8 md:space-y-12 bg-gradient-to-t from-black/20 to-transparent">
          <div className="flex justify-center gap-2 md:gap-3">
             {slides.map((_, i) => (
               <div key={i} className={`h-2 rounded-full transition-all duration-500 ${i === step ? 'w-12 md:w-16 bg-white' : 'w-2 bg-white/20'}`}></div>
             ))}
          </div>
          <div className="flex gap-3 md:gap-4">
             {step > 0 && (
               <button onClick={() => setStep(step - 1)} className="p-5 md:p-7 bg-white/10 text-white rounded-2xl md:rounded-[2.5rem] backdrop-blur-md active:scale-90 transition-all">
                 <ArrowRight className="h-5 w-5" />
               </button>
             )}
             <button onClick={() => step < slides.length - 1 ? setStep(step + 1) : onComplete()} className="flex-1 bg-white text-slate-900 py-5 md:py-7 rounded-[2rem] md:rounded-[3rem] font-black text-lg md:text-xl flex items-center justify-center gap-3 md:gap-4 shadow-xl active:scale-95 transition-all">
                {step === slides.length - 1 ? 'ابدأ الآن' : 'استمر'}
                <ChevronLeft className="h-5 w-5" />
             </button>
          </div>
       </div>
    </div>
  );
};

const Login: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [step, setStep] = useState<'INPUT' | 'OTP'>('INPUT');
  const [role, setRole] = useState<'CUSTOMER' | 'DRIVER'>('CUSTOMER');
  const [vehicleType, setVehicleType] = useState<VehicleType>('TOKTOK');
  
  // Sign Up States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [center, setCenter] = useState('');
  const [village, setVillage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // OTP State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const centers = ["شبين الكوم", "منوف", "أشمون", "الباجور", "قويسنا", "بركة السبع", "تلا", "السادات", "الشهداء"];

  const handleForgotPassword = () => {
    const adminWhatsApp = "201065019364";
    const message = "أهلاً إدارة وصلها، نسيت كلمة المرور الخاصة بحسابي وأحتاج للمساعدة في استعادتها.";
    window.open(`https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const validateSignUp = () => {
    if (name.trim().split(/\s+/).length < 4) {
      setErrorMsg("برجاء إدخال الاسم رباعي لضمان التوثيق");
      return false;
    }
    const phoneRegex = /^(010|011|012|015)[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      setErrorMsg("رقم الهاتف غير صحيح (010, 011, 012, 015)");
      return false;
    }
    if (!email.includes('@')) {
      setErrorMsg("البريد الإلكتروني غير صحيح");
      return false;
    }
    if (password.length < 8) {
      setErrorMsg("كلمة المرور يجب ألا تقل عن 8 رموز");
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMsg("كلمة المرور غير متطابقة");
      return false;
    }
    if (!center || !village) {
      setErrorMsg("يرجى اختيار المركز والقرية");
      return false;
    }
    return true;
  };

  const sendWhatsAppCodeRequest = () => {
    const adminWhatsApp = "201065019364";
    const message = `انا "${name}"\nرقم الهاتف: ${phone}\nالبريد الالكتروني: ${email}\nاريد كود التحقق لتطبيق وصلها`;
    window.open(`https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isRegistering && step === 'INPUT') {
      if (!validateSignUp()) return;
      setStep('OTP');
      return;
    }

    setLoading(true);
    try {
      if (isRegistering) {
        if (otp.join('').length < 6) {
          setErrorMsg("الكود غير مكتمل");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userData: User = {
          id: userCredential.user.uid, email, name, phone, role,
          status: role === 'DRIVER' ? 'PENDING_APPROVAL' : 'APPROVED',
          vehicleType: role === 'DRIVER' ? vehicleType : undefined,
          zoneId: center,
          wallet: { balance: 0, totalEarnings: 0, withdrawn: 0 }
        };
        await setDoc(doc(db, "users", userCredential.user.uid), userData);

        if (role === 'DRIVER') {
           window.open(`https://wa.me/201065019364?text=${encodeURIComponent(`أنا الكابتن ${name} أريد تفعيل حسابي`)}`, '_blank');
        }

        onLogin(userData);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        const userSnap = await getDoc(doc(db, "users", userCredential.user.uid));
        if (userSnap.exists()) onLogin(stripFirestore(userSnap.data()) as User);
      }
    } catch (err: any) { 
      setErrorMsg("خطأ في البيانات، يرجى المحاولة ثانية.");
    } finally { setLoading(false); }
  };

  if (showOnboarding) return <Onboarding onComplete={() => setShowOnboarding(false)} />;

  return (
    <div className="absolute inset-0 bg-[#f8fafc] z-[4000] overflow-y-auto no-scrollbar font-['Cairo']">
      <div className="min-h-full w-full flex flex-col items-center justify-start p-4 md:p-10 pb-24">
        
        <div className="w-full max-w-lg bg-white rounded-[3.5rem] md:rounded-[4.5rem] shadow-2xl border border-slate-50 overflow-hidden animate-in zoom-in duration-700">
          
          <div className="bg-[#2D9469] p-8 md:p-14 text-center relative shrink-0">
            <div className="bg-white/10 p-4 rounded-[2rem] backdrop-blur-xl border border-white/20 inline-block mb-4 shadow-2xl">
               <img src={APP_LOGO_ICON} alt="Logo" className="h-12 w-12 md:h-16 md:w-16 mx-auto" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter">وصـــلــهــا</h1>
            <p className="text-emerald-100/60 font-bold text-[9px] uppercase tracking-[0.4em] mt-2">محافظة المنوفية</p>
          </div>

          <div className="p-6 md:p-12">
            {errorMsg && <div className="mb-6 p-5 bg-rose-50 text-rose-600 rounded-3xl text-xs font-black border border-rose-100 animate-in shake duration-300 text-right">{errorMsg}</div>}
            
            <form onSubmit={handleAuth} className="space-y-5">
              {isRegistering ? (
                step === 'INPUT' ? (
                  <div className="space-y-5 animate-reveal">
                    <div className="flex bg-slate-100 p-1.5 rounded-[1.8rem]">
                      <button type="button" onClick={() => setRole('CUSTOMER')} className={`flex-1 py-3.5 rounded-2xl font-black text-[11px] transition-all ${role === 'CUSTOMER' ? 'bg-white text-[#2D9469] shadow-md' : 'text-slate-400'}`}>عميل</button>
                      <button type="button" onClick={() => setRole('DRIVER')} className={`flex-1 py-3.5 rounded-2xl font-black text-[11px] transition-all ${role === 'DRIVER' ? 'bg-white text-[#2D9469] shadow-md' : 'text-slate-400'}`}>كابتن</button>
                    </div>

                    <div className="relative">
                      <UserIcon className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 h-5 w-5" />
                      <input type="text" placeholder="الاسم الرباعي" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-slate-50 rounded-[1.5rem] py-5 pr-14 pl-6 font-bold outline-none text-sm border-2 border-transparent focus:border-[#2D9469] transition-all text-right" />
                    </div>

                    <div className="relative">
                      <Smartphone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 h-5 w-5" />
                      <input type="tel" placeholder="رقم الهاتف (010...)" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full bg-slate-50 rounded-[1.5rem] py-5 pr-14 pl-6 font-bold outline-none text-sm text-left border-2 border-transparent focus:border-[#2D9469] transition-all" dir="ltr" />
                    </div>

                    <div className="relative">
                      <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 h-5 w-5" />
                      <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-50 rounded-[1.5rem] py-5 pr-14 pl-6 font-bold outline-none text-sm text-left border-2 border-transparent focus:border-[#2D9469] transition-all" dir="ltr" />
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 h-5 w-5" />
                        <input type={showPassword ? "text" : "password"} placeholder="كلمة المرور" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-slate-50 rounded-[1.5rem] py-5 pr-14 pl-12 font-bold outline-none text-sm text-left border-2 border-transparent focus:border-[#2D9469] transition-all" dir="ltr" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 h-5 w-5" />
                        <input type={showConfirmPassword ? "text" : "password"} placeholder="تأكيد كلمة المرور" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full bg-slate-50 rounded-[1.5rem] py-5 pr-14 pl-12 font-bold outline-none text-sm text-left border-2 border-transparent focus:border-[#2D9469] transition-all" dir="ltr" />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">{showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative opacity-60">
                        <Globe className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                        <input type="text" value="المنوفية" disabled className="w-full bg-slate-100 rounded-2xl py-5 pr-12 font-black text-xs border-2 border-slate-200 cursor-not-allowed text-right" />
                      </div>
                      <div className="relative">
                        <Building className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 h-5 w-5" />
                        <select value={center} onChange={e => setCenter(e.target.value)} required className="w-full bg-slate-50 rounded-2xl py-5 pr-12 pl-4 font-black text-xs outline-none appearance-none border-2 border-transparent focus:border-[#2D9469] text-right">
                          <option value="">المركز</option>
                          {centers.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="relative">
                      <MapPin className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 h-5 w-5" />
                      <input type="text" placeholder="اسم القرية / المنطقة" value={village} onChange={e => setVillage(e.target.value)} required className="w-full bg-slate-50 rounded-[1.5rem] py-5 pr-14 pl-6 font-bold outline-none text-sm border-2 border-transparent focus:border-[#2D9469] transition-all text-right" />
                    </div>

                    {role === 'DRIVER' && (
                      <div className="space-y-3 p-4 bg-emerald-50 rounded-3xl border border-emerald-100">
                         <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block text-right">نوع المركبة المعتمد</label>
                         <div className="relative">
                          <Car className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-400 h-5 w-5" />
                          <select value={vehicleType} onChange={e => setVehicleType(e.target.value as VehicleType)} className="w-full bg-white rounded-2xl py-4 pr-14 pl-4 font-black text-sm outline-none appearance-none border-2 border-transparent focus:border-emerald-500 text-right">
                            <option value="TOKTOK">توك توك 🛺</option>
                            <option value="MOTORCYCLE">موتوسيكل 🏍️</option>
                            <option value="CAR">سيارة 🚗</option>
                          </select>
                         </div>
                      </div>
                    )}

                    <button type="submit" className="w-full bg-slate-950 text-white py-6 rounded-3xl font-black shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 mt-4">متابعة وإنشاء الحساب</button>
                  </div>
                ) : (
                  <div className="space-y-8 text-center animate-reveal">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black text-slate-900">تحقق من الهوية</h2>
                      <p className="text-xs font-bold text-slate-400">أدخل الكود المكون من 6 أرقام</p>
                    </div>
                    
                    <div className="flex justify-center gap-2" dir="ltr">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={el => { otpRefs.current[idx] = el; }}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOtpChange(idx, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(idx, e)}
                          className="w-11 h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-2xl font-black focus:border-[#2D9469] focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all shadow-sm"
                        />
                      ))}
                    </div>

                    <div className="space-y-4">
                      <button type="button" onClick={sendWhatsAppCodeRequest} className="text-[#2D9469] font-black text-xs hover:underline flex items-center justify-center gap-2 mx-auto bg-emerald-50 px-6 py-3 rounded-2xl">
                         <MessageCircle className="h-5 w-5" /> طلب الكود عبر واتساب
                      </button>
                      <button type="submit" disabled={loading} className="w-full bg-[#2D9469] text-white py-6 rounded-3xl font-black shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                         {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'تأكيد البيانات'}
                      </button>
                      <button type="button" onClick={() => setStep('INPUT')} className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors">تعديل البيانات السابقة</button>
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-6 animate-reveal">
                  <div className="relative">
                    <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 h-5 w-5" />
                    <input type="email" placeholder="البريد الإلكتروني" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="w-full bg-slate-50 rounded-[1.5rem] py-6 pr-14 pl-6 font-bold outline-none text-sm text-left border-2 border-transparent focus:border-[#2D9469] transition-all" dir="ltr" />
                  </div>
                  
                  <div className="relative">
                    <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 h-5 w-5" />
                    <input type={showPassword ? "text" : "password"} placeholder="كلمة المرور" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="w-full bg-slate-50 rounded-[1.5rem] py-6 pr-14 pl-12 font-bold outline-none text-sm text-left border-2 border-transparent focus:border-[#2D9469] transition-all" dir="ltr" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                  </div>

                  <div className="flex items-center justify-between px-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#2D9469] focus:ring-[#2D9469]" />
                      <span className="text-[11px] font-bold text-slate-400">تذكرني</span>
                    </label>
                    <button type="button" onClick={handleForgotPassword} className="text-[11px] font-black text-slate-400 hover:text-[#2D9469]">نسيت كلمة المرور؟</button>
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-[#2D9469] text-white py-7 rounded-[2.5rem] font-black text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                     {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : 'تسجيل دخول'}
                  </button>
                </div>
              )}

              <button type="button" onClick={() => { setIsRegistering(!isRegistering); setStep('INPUT'); setErrorMsg(null); }} className="w-full text-slate-400 font-black text-[11px] py-4 uppercase tracking-widest hover:text-[#2D9469] transition-all">
                {isRegistering ? 'لديك حساب بالفعل؟ سجل دخولك' : 'مستخدم جديد؟ انضم لأسرة وصلها'}
              </button>
            </form>
          </div>
        </div>
        
        <footer className="w-full text-center mt-10 py-6 text-[10px] opacity-40 font-black text-slate-500 uppercase tracking-widest">
           وصلها المنوفية • خدمة التوصيل الذكية
        </footer>
      </div>
    </div>
  );
};

export default Login;
