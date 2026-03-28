import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Plus, Minus, Download, BookOpen, Layers, RefreshCw, Edit2, Check, X, Trash2, PlusCircle, FilterX, ChevronDown, Cloud, AlertCircle, Upload, Table as TableIcon, Save, Eraser, RotateCcw, Lock, User, LogOut, Key, Settings } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, updateDoc, writeBatch, deleteDoc, getDocs, getDoc } from 'firebase/firestore';

// =====================================================================
// 선생님의 실제 Firebase 접속 키
// =====================================================================
const myFirebaseConfig = {
  apiKey: "AIzaSyCTyBcLl5eTugvkL8izjcsep8diGalITSI",
  authDomain: "school-books-d04cc.firebaseapp.com",
  projectId: "school-books-d04cc",
  storageBucket: "school-books-d04cc.firebasestorage.app",
  messagingSenderId: "315141079427",
  appId: "1:315141079427:web:e8214c0c0f63d0787fb6b6"
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : myFirebaseConfig;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'textbook-inventory-v3'; 

// --- 초기 시스템 샘플 데이터 ---
const initialSampleData = [
  { id: '1', grade: '1학년', curriculum: '2022 개정', subject: '과학 1', publisher: '비상', quantity: 6 },
  { id: '2', grade: '1학년', curriculum: '2015 개정', subject: '기술가정 1', publisher: '금성', quantity: 7 },
  { id: '3', grade: '1학년', curriculum: '2022 개정', subject: '도덕 1', publisher: '비상', quantity: 16 },
  { id: '4', grade: '1학년', curriculum: '2022 개정', subject: '사회 1', publisher: '비상', quantity: 12 },
  { id: '5', grade: '1학년', curriculum: '2022 개정', subject: '수학 1', publisher: '비상', quantity: 14 },
  { id: '6', grade: '1학년', curriculum: '2022 개정', subject: '영어 1', publisher: '동아', quantity: 17 },
  { id: '7', grade: '1학년', curriculum: '2022 개정', subject: '음악 1', publisher: '비상', quantity: 12 },
  { id: '8', grade: '1학년', curriculum: '2015 개정', subject: '음악 1', publisher: '금성', quantity: 3 },
  { id: '9', grade: '1학년', curriculum: '2015 개정', subject: '음악 2', publisher: '금성', quantity: 3 },
  { id: '10', grade: '1학년', curriculum: '2022 개정', subject: '체육 1', publisher: '미래엔', quantity: 24 },
  { id: '11', grade: '1학년', curriculum: '2022 개정', subject: '한문', publisher: '미래엔', quantity: 21 },
  { id: '12', grade: '1학년', curriculum: '2022 개정', subject: '국어 1-1', publisher: '비상', quantity: 16 },
  { id: '13', grade: '1학년', curriculum: '2022 개정', subject: '국어 1-2', publisher: '비상', quantity: 16 },
  { id: '14', grade: '2학년', curriculum: '2022 개정', subject: '과학 2', publisher: '비상', quantity: 15 },
  { id: '15', grade: '2학년', curriculum: '2022 개정', subject: '도덕 2', publisher: '비상', quantity: 15 },
  { id: '16', grade: '2학년', curriculum: '2015 개정', subject: '도덕 2', publisher: '지학사', quantity: 15 },
  { id: '17', grade: '2학년', curriculum: '2015 개정', subject: '과학 2', publisher: '동아', quantity: 11 },
  { id: '18', grade: '2학년', curriculum: '2015 개정', subject: '역사', publisher: '출판사', quantity: 0 },
];

// ----------------------------------------------------------------------
// 스마트 입력 컴포넌트들
// ----------------------------------------------------------------------
const SmartInput = ({ options, value, onChange, isCustom, setCustom, placeholder = "선택" }) => {
  const [localValue, setLocalValue] = useState(value || "");
  useEffect(() => { setLocalValue(value || ""); }, [value]);

  if (isCustom) {
    return (
      <div className="flex items-center gap-1 w-full bg-[#f2f4f6] rounded-xl px-2 border border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all shadow-sm">
        <input 
          className="w-full py-2 bg-transparent border-none focus:outline-none font-bold text-xs sm:text-sm text-[#191f28] text-center"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => onChange(localValue)}
          onKeyDown={(e) => { if (e.key === 'Enter') { onChange(localValue); e.currentTarget.blur(); } }}
          placeholder="직접 입력"
          autoFocus
        />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); setCustom(false); }} className="p-1 text-slate-400 hover:text-rose-500 transition-colors">
          <X className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <select 
        className="w-full p-2 pr-6 sm:pr-8 bg-[#f2f4f6] border border-transparent rounded-xl font-bold text-xs sm:text-sm text-[#4e5968] cursor-pointer appearance-none outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm text-center truncate"
        value={value || ""}
        onChange={(e) => {
          if (e.target.value === '__CUSTOM__') setCustom(true);
          else onChange(e.target.value);
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        <option value="__CUSTOM__" className="text-blue-600 font-bold">+ 직접 입력</option>
      </select>
      <ChevronDown className="w-3 h-3 sm:w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
};

const GridNumberInput = ({ value, onChange }) => {
  const [localVal, setLocalVal] = useState(value);
  useEffect(() => { setLocalVal(value); }, [value]);
  return (
    <input type="number" className="w-16 sm:w-20 mx-auto p-2 bg-[#f2f4f6] rounded-xl font-black text-sm text-[#191f28] text-center no-spinners outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={localVal} onChange={e => setLocalVal(e.target.value)} onBlur={() => onChange(parseInt(localVal, 10) || 0)} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()} />
  );
};

const GridTextInput = ({ value, onChange, placeholder }) => {
  const [localVal, setLocalVal] = useState(value || '');
  useEffect(() => { setLocalVal(value || ''); }, [value]);
  return (
    <input type="text" className="w-full p-2 bg-[#f2f4f6] rounded-xl font-bold text-xs sm:text-sm text-[#191f28] text-center outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={localVal} onChange={e => setLocalVal(e.target.value)} onBlur={() => onChange(localVal)} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()} placeholder={placeholder} />
  );
};

const QtyInput = ({ value, onChange }) => {
  const [localVal, setLocalVal] = useState(value);
  useEffect(() => { setLocalVal(value); }, [value]);
  return (
    <input type="number" className="w-8 sm:w-12 text-center bg-transparent font-black text-[18px] sm:text-[22px] text-[#191f28] no-spinners outline-none" value={localVal} onChange={e => setLocalVal(e.target.value)} onBlur={() => onChange(parseInt(localVal, 10) || 0)} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()} />
  );
};

// ----------------------------------------------------------------------
// 메인 앱 컴포넌트
// ----------------------------------------------------------------------
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // 로그인 폼 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 비밀번호 변경 모달 상태
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [modalType, setModalType] = useState(null); 
  
  const [isGridMode, setIsGridMode] = useState(false);
  const [gridRows, setGridRows] = useState([]);

  const fileInputRef = useRef(null);

  const [filters, setFilters] = useState({ grade: '전체', curriculum: '전체', publisher: '전체' });
  const [sortConfig, setSortConfig] = useState({ key: 'order', direction: 'asc' });

  // 1. 인증 상태 확인
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 로그인 처리
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert("로그인 실패: 이메일이나 비밀번호를 확인해주세요.\n(계정이 없다면 '새 계정 등록'을 눌러주세요)");
    }
  };

  // 회원가입 (계정 생성) 처리
  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) return alert("비밀번호는 6자리 이상이어야 합니다.");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("계정이 성공적으로 등록되었습니다!");
    } catch (error) {
      alert("등록 실패: 이미 사용중인 이메일이거나 형식이 잘못되었습니다.");
    }
  };

  // 비밀번호 변경 처리
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return alert("비밀번호는 6자리 이상이어야 합니다.");
    try {
      await updatePassword(auth.currentUser, newPassword);
      alert("비밀번호가 성공적으로 변경되었습니다.");
      setShowPwdModal(false);
      setNewPassword('');
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        alert("보안을 위해 기기에서 로그아웃 한 뒤 다시 로그인하여 변경해주세요.");
      } else {
        alert("비밀번호 변경 실패: " + error.message);
      }
    }
  };

  // 2. 실시간 데이터 구독 (로그인 된 경우만)
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    const checkAndInit = async () => {
      const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'textbooks');
      const snap = await getDocs(colRef);
      if (snap.empty) {
        const sampleDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'customSample');
        const sampleSnap = await getDoc(sampleDocRef);
        let dataToRestore = initialSampleData;
        
        if (sampleSnap.exists() && sampleSnap.data().data) {
          dataToRestore = sampleSnap.data().data;
        }

        const batch = writeBatch(db);
        dataToRestore.forEach((item, idx) => batch.set(doc(colRef, item.id || `sample_${idx}`), { ...item, order: idx }));
        await batch.commit();
      }
    };

    checkAndInit().then(() => {
      const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'textbooks');
      onSnapshot(colRef, (snap) => {
        const data = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setInventory(data);
        setIsLoading(false);
      });
    });
  }, [user]);

  // 로딩 화면
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f2f4f6]"><div className="animate-pulse text-xl font-bold text-slate-400">시스템 준비 중...</div></div>;
  }

  // 로그인 화면 렌더링
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f2f4f6] flex items-center justify-center p-4 selection:bg-blue-100">
        <div className="bg-white p-8 sm:p-10 rounded-[40px] shadow-xl w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-center text-[#191f28] mb-2">갈매중 교과서 관리</h1>
          <p className="text-center text-slate-500 text-sm font-medium mb-8">담당자 계정으로 로그인해주세요.</p>
          
          <form className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ml-1">이메일 (아이디)</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-[#f2f4f6] rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold text-[#191f28] outline-none transition-all" placeholder="admin@galmae.kr" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ml-1">비밀번호</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-[#f2f4f6] rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold text-[#191f28] outline-none transition-all" placeholder="••••••••" />
              </div>
            </div>
            
            <div className="pt-4 flex flex-col gap-3">
              <button onClick={handleLogin} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 text-lg">
                로그인
              </button>
              <button onClick={handleRegister} className="w-full py-4 bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-black rounded-2xl transition-all active:scale-95">
                새 계정 등록하기
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- 메인 앱 로직 ---
  const gradeList = useMemo(() => [...new Set(inventory.map(i => i.grade))].filter(Boolean).sort(), [inventory]);
  const curriculumList = useMemo(() => [...new Set(inventory.map(i => i.curriculum))].filter(Boolean).sort(), [inventory]);
  const publisherList = useMemo(() => [...new Set(inventory.map(i => i.publisher))].filter(Boolean).sort(), [inventory]);

  const handleQuickFilter = (type, value) => {
    if (editingId !== null) return;
    setFilters(prev => ({ ...prev, [type]: value }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateGridRow = (tempId, field, value) => setGridRows(prev => prev.map(row => row.tempId === tempId ? { ...row, [field]: value } : row));
  const updateGridCustom = (tempId, field, isCustom) => setGridRows(prev => prev.map(row => row.tempId === tempId ? { ...row, [field]: isCustom } : row));

  const changeQty = async (id, current, delta) => {
    const next = Math.max(0, current + delta);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'textbooks', id), { quantity: next });
  };

  const handleQtyChange = async (id, val) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'textbooks', id), { quantity: val });
  };

  const saveEdit = async (id) => {
    const { customGrade, customCurriculum, customPublisher, ...dataToSave } = editForm;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'textbooks', id), dataToSave);
    setEditingId(null);
  };

  const handleBulk = async (type) => {
    setIsLoading(true);
    setModalType(null);
    const ref = collection(db, 'artifacts', appId, 'public', 'data', 'textbooks');
    const snap = await getDocs(ref);
    const batch = writeBatch(db);

    if (type === 'delete_all') {
      snap.docs.forEach(d => batch.delete(d.ref));
    } else if (type === 'zero_qty') {
      snap.docs.forEach(d => batch.update(d.ref, { quantity: 0 }));
    } else if (type === 'save_sample') {
      const sampleDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'customSample');
      await setDoc(sampleDocRef, { data: inventory });
      alert('현재 작성된 목록이 성공적으로 [기본 샘플]로 저장되었습니다!\n이제 샘플 복구를 누르면 지금 이 상태로 복원됩니다.');
      setIsLoading(false);
      return;
    } else if (type === 'reset_sample') {
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      const sampleDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'customSample');
      const sampleSnap = await getDoc(sampleDocRef);
      let dataToRestore = initialSampleData;
      if (sampleSnap.exists() && sampleSnap.data().data) dataToRestore = sampleSnap.data().data;
      const batch2 = writeBatch(db);
      dataToRestore.forEach((item, idx) => batch2.set(doc(ref, item.id || `sample_${idx}`), { ...item, order: idx }));
      await batch2.commit();
      setIsLoading(false);
      return;
    }
    await batch.commit();
    setIsLoading(false);
  };

  const startGrid = () => {
    setGridRows([{ tempId: `g_${Date.now()}`, grade: gradeList[0] || '1학년', curriculum: curriculumList[0] || '2022 개정', subject: '', publisher: publisherList[0] || '출판사', quantity: 0, cGrade: false, cCurr: false, cPub: false }]);
    setIsGridMode(true);
  };

  const saveGrid = async () => {
    const valid = gridRows.filter(r => r.subject.trim());
    if (!valid.length) return setIsGridMode(false);
    setIsLoading(true);
    const batch = writeBatch(db);
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'textbooks');
    valid.forEach((r, idx) => batch.set(doc(colRef, `bulk_${Date.now()}_${idx}`), { grade: r.grade, curriculum: r.curriculum, subject: r.subject, publisher: r.publisher, quantity: r.quantity, order: inventory.length + idx }));
    await batch.commit();
    setIsGridMode(false);
    setIsLoading(false);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const filtered = useMemo(() => {
    let res = inventory.filter(i => {
      const matchGrade = filters.grade === '전체' || i.grade === filters.grade;
      const matchCurr = filters.curriculum === '전체' || i.curriculum === filters.curriculum;
      const matchPub = filters.publisher === '전체' || i.publisher === filters.publisher;
      const matchSearch = i.subject?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGrade && matchCurr && matchPub && matchSearch;
    });
    res.sort((a, b) => {
      const vA = a[sortConfig.key], vB = b[sortConfig.key];
      if (vA < vB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (vA > vB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return res;
  }, [inventory, filters, searchQuery, sortConfig]);

  const totalStock = useMemo(() => filtered.reduce((acc, i) => acc + (i.quantity || 0), 0), [filtered]);

  return (
    <div className="min-h-screen bg-[#f2f4f6] font-sans text-[#333d4b] pb-24 selection:bg-blue-100">
      
      {/* 상단 네비게이션 (로그아웃, 설정) */}
      <div className="bg-white px-4 py-3 flex justify-between items-center shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] sm:text-xs font-black text-emerald-600 uppercase tracking-widest">Live</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPwdModal(true)} className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 rounded-full transition-colors flex items-center justify-center">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button onClick={() => signOut(auth)} className="p-2 text-slate-500 hover:text-rose-500 bg-slate-50 rounded-full transition-colors flex items-center justify-center">
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-4">
        {/* 헤더 */}
        <header className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 bg-white p-6 rounded-[28px] shadow-sm flex flex-col justify-center relative overflow-hidden">
            <h1 className="text-2xl sm:text-3xl font-black text-[#191f28] tracking-tight relative z-10">갈매중 스마트 교과서 관리</h1>
            <p className="text-slate-400 font-medium text-sm mt-1 z-10 relative">{user.email} 계정 접속 중</p>
            <BookOpen className="absolute -right-6 -bottom-6 w-32 h-32 text-slate-50 opacity-50 rotate-[-10deg]" />
          </div>

          <div className="bg-gradient-to-br from-[#3182f6] to-[#1b64da] p-6 rounded-[28px] shadow-lg shadow-blue-100 flex items-center justify-between text-white min-w-[220px] overflow-hidden relative">
            <div className="relative z-10 text-center w-full">
              <p className="text-[12px] font-black opacity-80 uppercase mb-1">전체 재고 합계</p>
              <p className="text-4xl sm:text-5xl font-black tracking-tighter">{totalStock.toLocaleString()}<span className="text-lg sm:text-xl ml-1 opacity-70">권</span></p>
            </div>
            <Layers className="w-24 h-24 absolute -right-4 -bottom-4 opacity-10 rotate-12" />
          </div>
        </header>

        {/* 대시보드 (컨트롤러) */}
        {!isGridMode && (
          <div className="bg-white p-4 sm:p-5 rounded-[28px] shadow-sm space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                className="w-full pl-12 pr-4 py-3 sm:py-4 bg-[#f2f4f6] rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-[#191f28] placeholder-slate-400 transition-all"
                placeholder="과목명을 검색하세요"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <select value={filters.grade} onChange={e=>setFilters({...filters, grade:e.target.value})} className="bg-[#f2f4f6] p-3 rounded-xl border-none text-xs sm:text-sm font-bold text-[#4e5968] cursor-pointer outline-none">
                <option value="전체">학년 전체</option>
                {gradeList.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={filters.curriculum} onChange={e=>setFilters({...filters, curriculum:e.target.value})} className="bg-[#f2f4f6] p-3 rounded-xl border-none text-xs sm:text-sm font-bold text-[#4e5968] cursor-pointer outline-none">
                <option value="전체">분류 전체</option>
                {curriculumList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filters.publisher} onChange={e=>setFilters({...filters, publisher:e.target.value})} className="bg-[#f2f4f6] p-3 rounded-xl border-none text-xs sm:text-sm font-bold text-[#4e5968] cursor-pointer outline-none">
                <option value="전체">출판사 전체</option>
                {publisherList.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={() => { setFilters({grade:'전체', curriculum:'전체', publisher:'전체'}); setSearchQuery(''); }} className="bg-slate-50 text-slate-400 p-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                <FilterX className="w-4 h-4" /> 필터 해제
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
              <button onClick={startGrid} className="flex-1 min-w-[100px] bg-indigo-50 text-indigo-600 py-3 rounded-xl text-[11px] sm:text-sm font-black flex items-center justify-center gap-1.5 hover:bg-indigo-100 active:scale-95 transition-all">
                <TableIcon className="w-4 h-4" /> 그리드 등록
              </button>
              <button onClick={() => fileInputRef.current.click()} className="flex-1 min-w-[100px] bg-slate-50 text-slate-600 py-3 rounded-xl text-[11px] sm:text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-slate-100 active:scale-95 transition-all">
                <Upload className="w-4 h-4" /> 엑셀 업로드
              </button>
              <button onClick={() => {
                const csv = ['학년,교육과정,과목,출판사,수량', ...filtered.map(i => `${i.grade},${i.curriculum},${i.subject},${i.publisher},${i.quantity}`)].join('\n');
                const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
                const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `갈매중_재고현황.csv`; link.click();
              }} className="bg-[#191f28] text-white p-3 rounded-xl text-[11px] sm:text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-black active:scale-95 transition-all shadow-md">
                <Download className="w-4 h-4" /> 엑셀 저장
              </button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={e => {
              const file = e.target.files[0]; if(!file) return;
              const reader = new FileReader(); reader.onload = async (ev) => {
                const lines = ev.target.result.split('\n').slice(1).filter(l => l.trim());
                const batch = writeBatch(db); const col = collection(db, 'artifacts', appId, 'public', 'data', 'textbooks');
                lines.forEach((line, idx) => {
                  const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
                  if(parts[0] && parts[2]) batch.set(doc(col, `ex_${Date.now()}_${idx}`), { grade:parts[0], curriculum:parts[1]||'', subject:parts[2], publisher:parts[3]||'', quantity:parseInt(parts[4],10)||0, order:inventory.length+idx });
                });
                await batch.commit(); alert('데이터가 등록되었습니다.');
              }; reader.readAsText(file);
            }} />
          </div>
        )}

        {/* 메인 뷰: 그리드 모드 vs 리스트 모드 (모바일 최적화) */}
        {isGridMode ? (
          <div className="bg-white rounded-[32px] shadow-sm border border-indigo-100 overflow-hidden">
            <div className="p-4 sm:p-6 bg-indigo-50/50 border-b border-indigo-100 flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-indigo-900 leading-tight">대량 등록 (PC 전용 권장)</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setIsGridMode(false)} className="flex-1 px-4 py-2 bg-white rounded-xl text-xs sm:text-sm font-black text-slate-500 border border-slate-200">취소</button>
                <button onClick={saveGrid} className="flex-1 px-4 py-2 bg-[#3182f6] rounded-xl text-xs sm:text-sm font-black text-white shadow-md hover:bg-blue-600 transition-colors">저장 완료</button>
              </div>
            </div>
            <div className="p-2 sm:p-4 overflow-x-auto scrollbar-hide">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-50">
                    <th className="p-2 text-center">학년</th><th className="p-2 text-center">분류</th><th className="p-2 text-center">과목명</th><th className="p-2 text-center">출판사</th><th className="p-2 text-center">수량</th><th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {gridRows.map((r) => (
                    <tr key={r.tempId} className="hover:bg-slate-50/30">
                      <td className="p-1"><SmartInput options={gradeList} value={r.grade} onChange={v=>updateGridRow(r.tempId, 'grade', v)} isCustom={r.cGrade} setCustom={b=>updateGridCustom(r.tempId, 'cGrade', b)} placeholder="학년" /></td>
                      <td className="p-1"><SmartInput options={curriculumList} value={r.curriculum} onChange={v=>updateGridRow(r.tempId, 'curriculum', v)} isCustom={r.cCurr} setCustom={b=>updateGridCustom(r.tempId, 'cCurr', b)} placeholder="분류" /></td>
                      <td className="p-1"><GridTextInput value={r.subject} onChange={v=>updateGridRow(r.tempId, 'subject', v)} placeholder="과목명" /></td>
                      <td className="p-1"><SmartInput options={publisherList} value={r.publisher} onChange={v=>updateGridRow(r.tempId, 'publisher', v)} isCustom={r.cPub} setCustom={b=>updateGridCustom(r.tempId, 'cPub', b)} placeholder="출판사" /></td>
                      <td className="p-1"><GridNumberInput value={r.quantity} onChange={v=>updateGridRow(r.tempId, 'quantity', v)} /></td>
                      <td className="p-1 text-center"><button onClick={()=>setGridRows(prev=>prev.filter(x=>x.tempId!==r.tempId))} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={()=>setGridRows(prev=>[...prev, { tempId: `g_${Date.now()}`, grade: gradeList[0]||'1학년', curriculum: curriculumList[0]||'2022 개정', subject: '', publisher: publisherList[0]||'출판사', quantity: 0, cGrade: false, cCurr: false, cPub: false }])} className="w-full mt-4 py-4 border-2 border-dashed border-slate-200 rounded-[20px] text-slate-400 font-bold hover:bg-slate-50 hover:text-blue-500 transition-all flex items-center justify-center gap-2 text-sm">
                <PlusCircle className="w-4 h-4" /> 새 행 추가하기
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[24px] sm:rounded-[32px] shadow-sm overflow-hidden border border-white">
            {/* 📱 모바일 최적화된 리스트 헤더 (가로 스크롤 없이 한눈에!) */}
            <div className="flex px-3 sm:px-5 py-3 bg-[#fafbfc] border-b border-[#f2f4f6] text-[11px] sm:text-[13px] font-black text-slate-600 uppercase tracking-widest sticky top-0 z-10">
              <div onClick={()=>handleSort('grade')} className="w-14 sm:w-20 text-center cursor-pointer hover:text-blue-500 shrink-0">학년 {sortConfig.key==='grade' ? (sortConfig.direction==='asc'?'↑':'↓'):''}</div>
              <div onClick={()=>handleSort('subject')} className="flex-1 text-center cursor-pointer hover:text-blue-500 min-w-0">과목 정보 {sortConfig.key==='subject' ? (sortConfig.direction==='asc'?'↑':'↓'):''}</div>
              <div onClick={()=>handleSort('quantity')} className="w-[100px] sm:w-[140px] text-center cursor-pointer hover:text-blue-500 shrink-0">재고 수량 {sortConfig.key==='quantity' ? (sortConfig.direction==='asc'?'↑':'↓'):''}</div>
            </div>

            {/* 리스트 본문 */}
            <div className="divide-y divide-[#f2f4f6]">
              {isLoading && !inventory.length ? (
                <div className="py-24 text-center font-bold text-slate-300 animate-pulse italic">데이터 로드 중...</div>
              ) : filtered.length > 0 ? (
                filtered.map((item) => (
                  <div key={item.id} className="flex items-center p-2.5 sm:p-5 hover:bg-[#fafbfc] transition-colors group relative min-h-[70px]">
                    
                    {editingId === item.id ? (
                      /* --- 📝 수정 모드 --- */
                      <>
                        <div className="w-14 sm:w-20 shrink-0 px-0.5">
                          <SmartInput options={gradeList} value={editForm.grade} onChange={v=>setEditForm({...editForm, grade:v})} isCustom={editForm.cGrade} setCustom={b=>setEditForm({...editForm, cGrade:b})} placeholder="학년" />
                        </div>
                        <div className="flex-1 min-w-0 px-1 sm:px-2 space-y-1 sm:space-y-2">
                          <GridTextInput value={editForm.subject} onChange={v=>setEditForm({...editForm, subject:v})} placeholder="과목명" />
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                            <SmartInput options={curriculumList} value={editForm.curriculum} onChange={v=>setEditForm({...editForm, curriculum:v})} isCustom={editForm.cCurr} setCustom={b=>setEditForm({...editForm, cCurr:b})} placeholder="분류" />
                            <SmartInput options={publisherList} value={editForm.publisher} onChange={v=>setEditForm({...editForm, publisher:v})} isCustom={editForm.cPub} setCustom={b=>setEditForm({...editForm, cPub:b})} placeholder="출판사" />
                          </div>
                        </div>
                        <div className="w-[100px] sm:w-[140px] shrink-0 flex justify-center items-center">
                          <button onClick={()=>saveEdit(item.id)} className="p-2 sm:p-3 bg-blue-500 text-white rounded-xl shadow-lg hover:bg-blue-600 transition-colors">
                            <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </>
                    ) : (
                      /* --- 📖 일반 모드 (Flex 구조로 짤림 방지) --- */
                      <>
                        {/* 1. 학년 */}
                        <div className="w-14 sm:w-20 flex justify-center shrink-0">
                          <span onClick={()=>handleQuickFilter('grade', item.grade)} className="px-1.5 py-1 sm:px-3 sm:py-2 rounded-[10px] sm:rounded-xl text-[10px] sm:text-[12px] font-black cursor-pointer shadow-sm active:scale-90 bg-blue-50 text-blue-600 whitespace-nowrap overflow-hidden max-w-full truncate text-center">
                            {item.grade === '전학년(공통)' ? '공통' : item.grade}
                          </span>
                        </div>
                        
                        {/* 2. 과목 정보 (넘치면 알아서 줄임표 처리) */}
                        <div className="flex-1 min-w-0 px-2 flex flex-col items-center justify-center text-center">
                          <p className="font-black text-[#191f28] text-[13px] sm:text-lg leading-tight mb-0.5 sm:mb-1 truncate w-full">{item.subject}</p>
                          <div className="flex items-center justify-center gap-1 sm:gap-2 text-[9px] sm:text-xs font-bold text-slate-500 w-full truncate">
                            <span onClick={()=>handleQuickFilter('curriculum', item.curriculum)} className="hover:text-blue-500 cursor-pointer truncate">{item.curriculum}</span>
                            <span className="shrink-0 text-slate-300">·</span>
                            <span onClick={()=>handleQuickFilter('publisher', item.publisher)} className="hover:text-blue-500 cursor-pointer truncate">{item.publisher}</span>
                          </div>
                        </div>
                        
                        {/* 3. 수량 조절 버튼 (축소 절대 안됨!) */}
                        <div className="w-[100px] sm:w-[140px] flex items-center justify-center shrink-0">
                          <div className="flex items-center justify-between bg-[#f2f4f6] rounded-full p-1 w-full max-w-[120px] transition-all focus-within:ring-2 focus-within:ring-blue-200 shadow-inner">
                            <button onClick={()=>changeQty(item.id, item.quantity, -1)} className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-500 active:scale-75 transition-transform shrink-0"><Minus className="w-3 h-3 sm:w-4 sm:h-4 stroke-[3]" /></button>
                            <QtyInput value={item.quantity || 0} onChange={v => handleQtyChange(item.id, v)} />
                            <button onClick={()=>changeQty(item.id, item.quantity, 1)} className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-500 active:scale-75 transition-transform shrink-0"><Plus className="w-3 h-3 sm:w-4 sm:h-4 stroke-[3]" /></button>
                          </div>
                        </div>

                        {/* 4. 편집/삭제 버튼 (모바일: 작게 우측 상단, PC: 마우스 오버) */}
                        <div className="absolute right-1 top-1 sm:right-2 sm:top-2 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={()=>{
                            setEditingId(item.id); 
                            setEditForm({...item, cGrade: !gradeList.includes(item.grade), cCurr: !curriculumList.includes(item.curriculum), cPub: !publisherList.includes(item.publisher)});
                          }} className="p-1 sm:p-2 text-slate-400 hover:text-blue-500 bg-white/90 rounded-lg shadow-sm transition-colors"><Edit2 className="w-3 h-3 sm:w-4 sm:h-4"/></button>
                          <button onClick={()=>setDeletingId(item.id)} className="p-1 sm:p-2 text-slate-400 hover:text-rose-500 bg-white/90 rounded-lg shadow-sm transition-colors"><Trash2 className="w-3 h-3 sm:w-4 sm:h-4"/></button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-24 text-center font-bold text-slate-400 text-sm">등록된 교과서가 없습니다.</div>
              )}
            </div>

            <button 
              onClick={async () => {
                const nid = `new_${Date.now()}`;
                const newObj = { grade: '1학년', curriculum: '2022 개정', subject: '새 과목명', publisher: '출판사', quantity: 0, order: inventory.length };
                await setDoc(doc(collection(db, 'artifacts', appId, 'public', 'data', 'textbooks'), nid), newObj);
                setEditingId(nid);
                setEditForm({...newObj, id: nid, cGrade: false, cCurr: false, cPub: false});
              }}
              className="w-full py-5 bg-[#f9fafb] text-[#8b95a1] text-sm font-black border-t border-dashed hover:text-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-5 h-5" /> 새 교과서 항목 추가
            </button>
          </div>
        )}

        {/* 하단 관리 메뉴 */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 pt-8 pb-24">
          <button onClick={() => setModalType('zero_qty')} className="bg-white px-4 py-3 rounded-2xl text-[11px] sm:text-xs font-black text-indigo-600 shadow-sm border border-indigo-50 hover:bg-indigo-50 active:scale-95 transition-all flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> 수량 초기화
          </button>
          <button onClick={() => setModalType('save_sample')} className="bg-blue-50 px-4 py-3 rounded-2xl text-[11px] sm:text-xs font-black text-blue-600 shadow-sm border border-blue-100 hover:bg-blue-100 active:scale-95 transition-all flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" /> 현재 샘플로 저장
          </button>
          <button onClick={() => setModalType('reset_sample')} className="bg-white px-4 py-3 rounded-2xl text-[11px] sm:text-xs font-black text-slate-500 shadow-sm border border-slate-100 hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> 샘플 복구
          </button>
          <button onClick={() => setModalType('delete_all')} className="bg-rose-50 px-4 py-3 rounded-2xl text-[11px] sm:text-xs font-black text-rose-500 hover:bg-rose-100 active:scale-95 transition-all flex items-center gap-1.5">
            <Eraser className="w-3.5 h-3.5" /> 목록 완전 삭제
          </button>
        </div>
      </div>

      {/* 모달 시스템 (삭제, 대량작업) */}
      {(modalType || deletingId) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white p-6 sm:p-8 rounded-[32px] max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 ${
              modalType === 'zero_qty' || modalType === 'save_sample' ? 'bg-indigo-50 text-indigo-500' : 'bg-rose-50 text-rose-500'
            }`}>
              {modalType === 'save_sample' ? <Save className="w-7 h-7 sm:w-8 sm:h-8" /> : <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10" />}
            </div>
            <h3 className="text-lg sm:text-xl font-black text-[#191f28] mb-2 sm:mb-3 text-center">
              {deletingId ? '항목 삭제' : modalType === 'zero_qty' ? '재고 초기화' : modalType === 'save_sample' ? '샘플 고정' : modalType === 'reset_sample' ? '샘플 복구' : '전체 삭제'}
            </h3>
            <p className="text-[13px] sm:text-[15px] font-medium text-[#4e5968] mb-6 sm:mb-8 text-center leading-relaxed whitespace-pre-line px-2">
              {deletingId ? '이 항목을 정말 삭제할까요?' : modalType === 'zero_qty' ? '모든 수량만 0권으로 초기화합니다.' : modalType === 'save_sample' ? '현재 화면을 기본 복구 샘플로 저장합니다.' : modalType === 'reset_sample' ? '저장된 샘플로 덮어씌웁니다.\n현재 정보는 사라집니다.' : '목록의 모든 데이터를 삭제할까요?'}
            </p>
            <div className="flex gap-2 sm:gap-3">
              <button onClick={() => { setModalType(null); setDeletingId(null); }} className="flex-1 py-3 sm:py-4 bg-[#f2f4f6] text-[#4e5968] font-bold rounded-2xl hover:bg-slate-200 transition-colors">취소</button>
              <button onClick={async () => {
                if(deletingId) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'textbooks', deletingId)); setDeletingId(null); }
                else { await handleBulk(modalType); }
              }} className={`flex-1 py-3 sm:py-4 text-white font-bold rounded-2xl shadow-lg transition-all ${
                (modalType === 'zero_qty' || modalType === 'save_sample') ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-rose-500 hover:bg-rose-600'
              }`}>확인</button>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 변경 모달 */}
      {showPwdModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white p-6 sm:p-8 rounded-[32px] max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-[#191f28] mb-2 text-center">비밀번호 변경</h3>
            <p className="text-[13px] text-slate-500 mb-6 text-center">보안을 위해 6자리 이상으로 설정해주세요.</p>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="새 비밀번호 입력" 
              className="w-full py-4 px-4 bg-[#f2f4f6] rounded-2xl border-none outline-none font-bold focus:ring-2 focus:ring-blue-500 mb-6 text-center"
            />
            <div className="flex gap-2 sm:gap-3">
              <button onClick={() => { setShowPwdModal(false); setNewPassword(''); }} className="flex-1 py-4 bg-[#f2f4f6] text-[#4e5968] font-bold rounded-2xl hover:bg-slate-200 transition-colors">닫기</button>
              <button onClick={handleChangePassword} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg transition-colors">변경하기</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css');
        body { background-color: #f2f4f6; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif; }
        .no-spinners::-webkit-inner-spin-button, .no-spinners::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .no-spinners { -moz-appearance: textfield; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoom-in-95 { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-in { animation-duration: 300ms; animation-fill-mode: both; }
        .fade-in { animation-name: fade-in; }
        .zoom-in-95 { animation-name: zoom-in-95; }
      `}</style>
    </div>
  );
}