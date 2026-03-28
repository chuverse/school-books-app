import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Plus, Minus, Download, BookOpen, Layers, RefreshCw, Edit2, Check, X, Trash2, PlusCircle, FilterX, ChevronUp, ChevronDown, ArrowUpDown, Cloud, AlertCircle, Upload, FileText, Table as TableIcon, Save, Eraser, RotateCcw } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, updateDoc, writeBatch, deleteDoc, getDocs, getDoc } from 'firebase/firestore';

// =====================================================================
// 선생님의 실제 Firebase 접속 키가 적용되었습니다!
// =====================================================================
const myFirebaseConfig = {
  apiKey: "AIzaSyCTyBcLl5eTugvkL8izjcsep8diGalITSI",
  authDomain: "school-books-d04cc.firebaseapp.com",
  projectId: "school-books-d04cc",
  storageBucket: "school-books-d04cc.firebasestorage.app",
  messagingSenderId: "315141079427",
  appId: "1:315141079427:web:e8214c0c0f63d0787fb6b6"
};

// 파이어베이스 초기화
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : myFirebaseConfig;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'textbook-inventory-v3'; 
// =====================================================================

// --- 초기 시스템 샘플 데이터 (올려주신 CSV 재고현황 바탕) ---
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
// 스마트 입력 컴포넌트들 (포커스 유지용)
// ----------------------------------------------------------------------
const SmartInput = ({ options, value, onChange, isCustom, setCustom, placeholder = "선택" }) => {
  const [localValue, setLocalValue] = useState(value || "");
  useEffect(() => { setLocalValue(value || ""); }, [value]);

  if (isCustom) {
    return (
      <div className="flex items-center gap-1 w-full bg-[#f2f4f6] rounded-xl px-2 border border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all shadow-sm">
        <input 
          className="w-full py-2.5 bg-transparent border-none focus:outline-none font-bold text-sm text-[#191f28] text-center"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => onChange(localValue)}
          onKeyDown={(e) => { if (e.key === 'Enter') { onChange(localValue); e.currentTarget.blur(); } }}
          placeholder="직접 입력"
          autoFocus
        />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); setCustom(false); }} className="p-1 text-slate-400 hover:text-rose-500 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <select 
        className="w-full p-2.5 pr-8 bg-[#f2f4f6] border border-transparent rounded-xl font-bold text-sm text-[#4e5968] cursor-pointer appearance-none outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm text-center"
        value={value || ""}
        onChange={(e) => {
          if (e.target.value === '__CUSTOM__') setCustom(true);
          else onChange(e.target.value);
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        <option value="__CUSTOM__" className="text-blue-600 font-bold">+ 직접 입력 (목록 없음)</option>
      </select>
      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
};

const GridNumberInput = ({ value, onChange }) => {
  const [localVal, setLocalVal] = useState(value);
  useEffect(() => { setLocalVal(value); }, [value]);

  return (
    <input 
      type="number"
      className="w-20 mx-auto p-2.5 bg-[#f2f4f6] rounded-xl font-black text-sm text-[#191f28] text-center no-spinners outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner border border-transparent"
      value={localVal}
      onChange={e => setLocalVal(e.target.value)}
      onBlur={() => onChange(parseInt(localVal, 10) || 0)}
      onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
    />
  );
};

const GridTextInput = ({ value, onChange, placeholder }) => {
  const [localVal, setLocalVal] = useState(value || '');
  useEffect(() => { setLocalVal(value || ''); }, [value]);

  return (
    <input 
      type="text"
      className="w-full p-2.5 bg-[#f2f4f6] rounded-xl font-bold text-sm text-[#191f28] text-center outline-none focus:ring-2 focus:ring-blue-500 border border-transparent transition-all shadow-inner"
      value={localVal}
      onChange={e => setLocalVal(e.target.value)}
      onBlur={() => onChange(localVal)}
      onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
      placeholder={placeholder}
    />
  );
};

const QtyInput = ({ value, onChange }) => {
  const [localVal, setLocalVal] = useState(value);
  useEffect(() => { setLocalVal(value); }, [value]);

  return (
    <input 
      type="number" 
      className="w-12 text-center bg-transparent font-black text-[22px] text-[#191f28] no-spinners outline-none" 
      value={localVal} 
      onChange={e => setLocalVal(e.target.value)}
      onBlur={() => onChange(parseInt(localVal, 10) || 0)}
      onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
    />
  );
};
// ----------------------------------------------------------------------

export default function App() {
  const [user, setUser] = useState(null);
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

  // 1. 인증 처리
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // 2. 실시간 데이터 구독 및 최초 샘플 데이터 처리
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    const checkAndInit = async () => {
      const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'textbooks');
      const snap = await getDocs(colRef);
      if (snap.empty) {
        // 비어있다면, 선생님이 저장한 커스텀 샘플이 있는지 확인
        const sampleDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'customSample');
        const sampleSnap = await getDoc(sampleDocRef);
        let dataToRestore = initialSampleData;
        
        if (sampleSnap.exists() && sampleSnap.data().data) {
          dataToRestore = sampleSnap.data().data; // 선생님의 저장된 샘플 불러오기
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

  // 필터 옵션 계산
  const gradeList = useMemo(() => [...new Set(inventory.map(i => i.grade))].filter(Boolean).sort(), [inventory]);
  const curriculumList = useMemo(() => [...new Set(inventory.map(i => i.curriculum))].filter(Boolean).sort(), [inventory]);
  const publisherList = useMemo(() => [...new Set(inventory.map(i => i.publisher))].filter(Boolean).sort(), [inventory]);

  // 퀵 필터 함수
  const handleQuickFilter = (type, value) => {
    if (editingId !== null) return;
    setFilters(prev => ({ ...prev, [type]: value }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 그리드 업데이트 로직
  const updateGridRow = (tempId, field, value) => {
    setGridRows(prev => prev.map(row => 
      row.tempId === tempId ? { ...row, [field]: value } : row
    ));
  };

  const updateGridCustom = (tempId, field, isCustom) => {
    setGridRows(prev => prev.map(row => 
      row.tempId === tempId ? { ...row, [field]: isCustom } : row
    ));
  };

  // 데이터 조작 함수
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

  // 대량 처리 및 커스텀 샘플 저장 로직
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
      // 선생님의 현재 목록을 커스텀 샘플로 DB에 영구 저장
      const sampleDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'customSample');
      await setDoc(sampleDocRef, { data: inventory });
      alert('현재 작성된 목록이 성공적으로 [기본 샘플]로 저장되었습니다!\n이제 샘플 복구를 누르면 지금 이 상태로 복원됩니다.');
      setIsLoading(false);
      return;
    } else if (type === 'reset_sample') {
      // 1. 기존 데이터 모두 삭제
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();

      // 2. 저장된 커스텀 샘플이 있는지 확인
      const sampleDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'customSample');
      const sampleSnap = await getDoc(sampleDocRef);
      let dataToRestore = initialSampleData;
      if (sampleSnap.exists() && sampleSnap.data().data) {
        dataToRestore = sampleSnap.data().data; // 선생님의 저장된 데이터 불러오기
      }

      // 3. 샘플 데이터 덮어쓰기
      const batch2 = writeBatch(db);
      dataToRestore.forEach((item, idx) => batch2.set(doc(ref, item.id || `sample_${idx}`), { ...item, order: idx }));
      await batch2.commit();
      setIsLoading(false);
      return;
    }
    await batch.commit();
    setIsLoading(false);
  };

  // 그리드 모드 관리
  const startGrid = () => {
    setGridRows([{ 
      tempId: `g_${Date.now()}`, 
      grade: gradeList[0] || '1학년', 
      curriculum: curriculumList[0] || '2022 개정', 
      subject: '', 
      publisher: publisherList[0] || '출판사', 
      quantity: 0, 
      cGrade: false, 
      cCurr: false, 
      cPub: false 
    }]);
    setIsGridMode(true);
  };

  const saveGrid = async () => {
    const valid = gridRows.filter(r => r.subject.trim());
    if (!valid.length) return setIsGridMode(false);
    
    setIsLoading(true);
    const batch = writeBatch(db);
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'textbooks');
    valid.forEach((r, idx) => {
      batch.set(doc(colRef, `bulk_${Date.now()}_${idx}`), {
        grade: r.grade,
        curriculum: r.curriculum,
        subject: r.subject,
        publisher: r.publisher,
        quantity: r.quantity,
        order: inventory.length + idx
      });
    });
    await batch.commit();
    setIsGridMode(false);
    setIsLoading(false);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  // 정렬 및 필터링 적용된 데이터
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
      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-4">
        
        {/* 헤더 */}
        <header className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 bg-white p-6 rounded-[28px] shadow-sm border border-white flex flex-col justify-center relative overflow-hidden">
            <div className="flex items-center gap-2 mb-1.5 relative z-10">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live 클라우드 연동됨</span>
            </div>
            {/* 갈매중학교 타이틀 */}
            <h1 className="text-2xl font-black text-[#191f28] tracking-tight relative z-10">갈매중 스마트 교과서 관리</h1>
            <BookOpen className="absolute -right-6 -bottom-6 w-32 h-32 text-slate-50 opacity-50 rotate-[-10deg]" />
          </div>

          <div className="bg-gradient-to-br from-[#3182f6] to-[#1b64da] p-6 rounded-[28px] shadow-lg shadow-blue-100 flex items-center justify-between text-white min-w-[220px] overflow-hidden relative">
            <div className="relative z-10 text-center w-full">
              <p className="text-[12px] font-black opacity-80 uppercase mb-1">전체 재고 합계</p>
              <p className="text-5xl font-black tracking-tighter">{totalStock.toLocaleString()}<span className="text-xl ml-1 opacity-70">권</span></p>
            </div>
            <Layers className="w-24 h-24 absolute -right-4 -bottom-4 opacity-10 rotate-12" />
          </div>
        </header>

        {/* 대시보드 (컨트롤러) */}
        {!isGridMode && (
          <div className="bg-white p-5 rounded-[28px] shadow-sm space-y-4">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                className="w-full pl-14 pr-5 py-4 bg-[#f2f4f6] rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-[#191f28] placeholder-slate-400 transition-all shadow-inner"
                placeholder="과목명을 검색하세요"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <select value={filters.grade} onChange={e=>setFilters({...filters, grade:e.target.value})} className="bg-[#f2f4f6] p-3.5 rounded-xl border-none text-xs font-bold text-[#4e5968] cursor-pointer outline-none">
                <option value="전체">학년 전체</option>
                {gradeList.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={filters.curriculum} onChange={e=>setFilters({...filters, curriculum:e.target.value})} className="bg-[#f2f4f6] p-3.5 rounded-xl border-none text-xs font-bold text-[#4e5968] cursor-pointer outline-none">
                <option value="전체">분류 전체</option>
                {curriculumList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filters.publisher} onChange={e=>setFilters({...filters, publisher:e.target.value})} className="bg-[#f2f4f6] p-3.5 rounded-xl border-none text-xs font-bold text-[#4e5968] cursor-pointer outline-none">
                <option value="전체">출판사 전체</option>
                {publisherList.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button 
                onClick={() => { setFilters({grade:'전체', curriculum:'전체', publisher:'전체'}); setSearchQuery(''); }}
                className="bg-slate-50 text-slate-400 p-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-rose-50 hover:text-rose-500 transition-colors"
              >
                <FilterX className="w-4 h-4" /> 필터 해제
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
              <button onClick={startGrid} className="flex-1 min-w-[120px] bg-indigo-50 text-indigo-600 py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-indigo-100 active:scale-95 transition-all">
                <TableIcon className="w-4 h-4" /> 그리드 등록
              </button>
              <button onClick={() => fileInputRef.current.click()} className="flex-1 min-w-[120px] bg-slate-50 text-slate-600 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-95 transition-all">
                <Upload className="w-4 h-4" /> 엑셀 업로드
              </button>
              <button 
                onClick={() => {
                  const csv = ['학년,교육과정,과목,출판사,수량', ...filtered.map(i => `${i.grade},${i.curriculum},${i.subject},${i.publisher},${i.quantity}`)].join('\n');
                  const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
                  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `갈매중_재고현황.csv`; link.click();
                }}
                className="bg-[#191f28] text-white p-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-black active:scale-95 transition-all shadow-md shadow-slate-200"
              >
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

        {/* 메인 뷰: 그리드 모드 vs 리스트 모드 */}
        {isGridMode ? (
          <div className="bg-white rounded-[32px] shadow-xl border-2 border-indigo-100 overflow-hidden animate-in slide-in-from-bottom-6 duration-500">
            <div className="p-6 bg-indigo-50/50 border-b border-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-indigo-900 leading-tight text-center sm:text-left">대량 등록 (그리드)</h2>
                <p className="text-xs font-bold text-indigo-400 mt-1">드롭다운과 직접 입력을 통해 엑셀처럼 빠르게 등록하세요.</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={()=>setIsGridMode(false)} className="flex-1 sm:flex-none px-5 py-2.5 bg-white rounded-xl text-sm font-black text-slate-500 border border-slate-200">취소</button>
                <button onClick={saveGrid} className="flex-1 sm:flex-none px-6 py-2.5 bg-[#3182f6] rounded-xl text-sm font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-600 transition-colors">저장 완료</button>
              </div>
            </div>
            <div className="p-4 overflow-x-auto scrollbar-hide">
              <table className="w-full text-left min-w-[850px]">
                <thead>
                  <tr className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-50">
                    <th className="p-3 text-center whitespace-nowrap">학년</th>
                    <th className="p-3 text-center whitespace-nowrap">분류</th>
                    <th className="p-3 text-center whitespace-nowrap">과목명</th>
                    <th className="p-3 text-center whitespace-nowrap">출판사</th>
                    <th className="p-3 text-center whitespace-nowrap">수량</th>
                    <th className="p-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {gridRows.map((r) => (
                    <tr key={r.tempId} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-2"><SmartInput options={gradeList} value={r.grade} onChange={v=>updateGridRow(r.tempId, 'grade', v)} isCustom={r.cGrade} setCustom={b=>updateGridCustom(r.tempId, 'cGrade', b)} placeholder="학년 선택" /></td>
                      <td className="p-2"><SmartInput options={curriculumList} value={r.curriculum} onChange={v=>updateGridRow(r.tempId, 'curriculum', v)} isCustom={r.cCurr} setCustom={b=>updateGridCustom(r.tempId, 'cCurr', b)} placeholder="분류 선택" /></td>
                      <td className="p-2"><GridTextInput value={r.subject} onChange={v=>updateGridRow(r.tempId, 'subject', v)} placeholder="과목명" /></td>
                      <td className="p-2"><SmartInput options={publisherList} value={r.publisher} onChange={v=>updateGridRow(r.tempId, 'publisher', v)} isCustom={r.cPub} setCustom={b=>updateGridCustom(r.tempId, 'cPub', b)} placeholder="출판사 선택" /></td>
                      <td className="p-2"><GridNumberInput value={r.quantity} onChange={v=>updateGridRow(r.tempId, 'quantity', v)} /></td>
                      <td className="p-2 text-center">
                        <button onClick={()=>setGridRows(prev=>prev.filter(x=>x.tempId!==r.tempId))} className="p-2 text-slate-300 hover:text-rose-500 transition-colors bg-white rounded-lg shadow-sm">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button 
                onClick={()=>setGridRows(prev=>[...prev, { tempId: `g_${Date.now()}`, grade: gradeList[0]||'1학년', curriculum: curriculumList[0]||'2022 개정', subject: '', publisher: publisherList[0]||'출판사', quantity: 0, cGrade: false, cCurr: false, cPub: false }])} 
                className="w-full mt-5 py-5 border-2 border-dashed border-slate-200 rounded-[24px] text-slate-400 font-bold hover:bg-slate-50 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-5 h-5" /> 새 행 추가하기
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] shadow-sm overflow-hidden border border-white">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-center min-w-[650px] table-fixed mx-auto">
                <thead>
                  <tr className="bg-[#fafbfc] border-b border-[#f2f4f6] text-[14px] font-black text-slate-600 uppercase tracking-widest">
                    <th onClick={()=>handleSort('grade')} className="w-[20%] p-4 sm:p-5 text-center cursor-pointer hover:text-blue-500 whitespace-nowrap">학년 {sortConfig.key === 'grade' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={()=>handleSort('subject')} className="w-[45%] p-4 sm:p-5 text-center cursor-pointer hover:text-blue-500 whitespace-nowrap">과목 정보</th>
                    <th onClick={()=>handleSort('quantity')} className="w-[25%] p-4 sm:p-5 text-center cursor-pointer hover:text-blue-500 whitespace-nowrap">재고 수량</th>
                    <th className="w-[10%] p-4 sm:p-5 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f4f6]">
                  {isLoading && !inventory.length ? (
                    <tr><td colSpan="4" className="py-24 text-center font-bold text-slate-300 animate-pulse italic">데이터 로드 중...</td></tr>
                  ) : filtered.length > 0 ? (
                    filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-[#fafbfc] transition-colors group">
                        <td className="p-3 sm:p-5 align-middle text-center">
                          {editingId === item.id ? (
                            <SmartInput options={gradeList} value={editForm.grade} onChange={v=>setEditForm({...editForm, grade:v})} isCustom={editForm.cGrade} setCustom={b=>setEditForm({...editForm, cGrade:b})} />
                          ) : (
                            <span onClick={()=>handleQuickFilter('grade', item.grade)} className={`px-3 py-2 rounded-xl text-[12px] font-black cursor-pointer shadow-sm active:scale-90 inline-flex flex-col items-center justify-center leading-tight whitespace-pre-line text-center ${
                              item.grade?.includes('1학년') ? 'bg-blue-50 text-blue-600' :
                              item.grade?.includes('2학년') ? 'bg-emerald-50 text-emerald-600' :
                              item.grade?.includes('3학년') ? 'bg-orange-50 text-orange-600' :
                              'bg-purple-50 text-purple-600'
                            }`}>
                              {item.grade === '전학년(공통)' ? <><span className="text-[11px]">전학년</span><span className="text-[9px] opacity-70">(공통)</span></> : item.grade}
                            </span>
                          )}
                        </td>
                        <td className="p-3 sm:p-5 align-middle text-center">
                          {editingId === item.id ? (
                            <div className="space-y-2">
                              <GridTextInput value={editForm.subject} onChange={v=>setEditForm({...editForm, subject:v})} placeholder="과목명" />
                              <div className="flex gap-2">
                                <SmartInput options={curriculumList} value={editForm.curriculum} onChange={v=>setEditForm({...editForm, curriculum:v})} isCustom={editForm.cCurr} setCustom={b=>setEditForm({...editForm, cCurr:b})} placeholder="분류" />
                                <SmartInput options={publisherList} value={editForm.publisher} onChange={v=>setEditForm({...editForm, publisher:v})} isCustom={editForm.cPub} setCustom={b=>setEditForm({...editForm, cPub:b})} placeholder="출판사" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <p className="font-black text-[#191f28] text-[17px] sm:text-lg leading-tight mb-1.5 text-center">{item.subject}</p>
                              <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                                <span onClick={()=>handleQuickFilter('curriculum', item.curriculum)} className="hover:text-blue-500 cursor-pointer">{item.curriculum}</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span onClick={()=>handleQuickFilter('publisher', item.publisher)} className="hover:text-blue-500 cursor-pointer">{item.publisher}</span>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-3 sm:p-5 align-middle text-center">
                          <div className="flex items-center justify-between bg-[#f2f4f6] rounded-[24px] p-1.5 w-[130px] sm:w-36 mx-auto transition-all focus-within:ring-2 focus-within:ring-blue-200 shadow-inner">
                            <button onClick={()=>changeQty(item.id, item.quantity, -1)} className="w-9 h-9 bg-white rounded-[16px] shadow-sm flex items-center justify-center text-slate-500 active:scale-75 transition-transform"><Minus className="w-4 h-4 stroke-[3]" /></button>
                            <QtyInput value={item.quantity || 0} onChange={v => handleQtyChange(item.id, v)} />
                            <button onClick={()=>changeQty(item.id, item.quantity, 1)} className="w-9 h-9 bg-white rounded-[16px] shadow-sm flex items-center justify-center text-slate-500 active:scale-75 transition-transform"><Plus className="w-4 h-4 stroke-[3]" /></button>
                          </div>
                        </td>
                        <td className="p-3 sm:p-5 text-center align-middle">
                          {editingId === item.id ? (
                            <button onClick={()=>saveEdit(item.id)} className="p-3 bg-blue-500 text-white rounded-xl shadow-lg hover:bg-blue-600 transition-colors mx-auto block">
                              <Check className="w-5 h-5" />
                            </button>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-1 justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={()=>{
                                setEditingId(item.id); 
                                setEditForm({
                                  ...item,
                                  cGrade: !gradeList.includes(item.grade),
                                  cCurr: !curriculumList.includes(item.curriculum),
                                  cPub: !publisherList.includes(item.publisher)
                                });
                              }} className="p-2 text-slate-400 hover:text-blue-500 bg-slate-50 rounded-xl transition-colors"><Edit2 className="w-4 h-4"/></button>
                              <button onClick={()=>setDeletingId(item.id)} className="p-2 text-slate-400 hover:text-rose-500 bg-slate-50 rounded-xl transition-colors"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="py-24 text-center font-bold text-slate-400">등록된 교과서가 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <button 
              onClick={async () => {
                const nid = `new_${Date.now()}`;
                const newObj = { grade: '1학년', curriculum: '2022 개정', subject: '새 과목명', publisher: '출판사', quantity: 0, order: inventory.length };
                await setDoc(doc(collection(db, 'artifacts', appId, 'public', 'data', 'textbooks'), nid), newObj);
                setEditingId(nid);
                setEditForm({...newObj, id: nid, cGrade: false, cCurr: false, cPub: false});
              }}
              className="w-full py-6 bg-[#f9fafb] text-[#8b95a1] font-black border-t border-dashed hover:text-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-6 h-6" /> 새 교과서 한 권 추가
            </button>
          </div>
        )}

        {/* 하단 데이터 관리 메뉴 */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 pt-12 pb-24">
          <button onClick={() => setModalType('zero_qty')} className="bg-white px-5 py-3.5 rounded-2xl text-xs font-black text-indigo-600 shadow-sm border border-indigo-50 hover:bg-indigo-50 active:scale-95 transition-all flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> 수량 0으로 초기화
          </button>
          <button onClick={() => setModalType('save_sample')} className="bg-blue-50 px-5 py-3.5 rounded-2xl text-xs font-black text-blue-600 shadow-sm border border-blue-100 hover:bg-blue-100 active:scale-95 transition-all flex items-center gap-2">
            <Save className="w-4 h-4" /> 현재 목록을 내 샘플로 고정
          </button>
          <button onClick={() => setModalType('reset_sample')} className="bg-white px-5 py-3.5 rounded-2xl text-xs font-black text-slate-500 shadow-sm border border-slate-100 hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> 샘플 복구
          </button>
          <button onClick={() => setModalType('delete_all')} className="bg-rose-50 px-5 py-3.5 rounded-2xl text-xs font-black text-rose-500 hover:bg-rose-100 active:scale-95 transition-all flex items-center gap-2">
            <Eraser className="w-4 h-4" /> 목록 완전 삭제
          </button>
        </div>
      </div>

      {/* 모달 시스템 */}
      {(modalType || deletingId) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-[40px] max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
              modalType === 'zero_qty' || modalType === 'save_sample' ? 'bg-indigo-50 text-indigo-500' : 'bg-rose-50 text-rose-500'
            }`}>
              {modalType === 'save_sample' ? <Save className="w-8 h-8" /> : <AlertCircle className="w-10 h-10" />}
            </div>
            <h3 className="text-xl font-black text-[#191f28] mb-3 text-center">
              {deletingId ? '항목 삭제' : 
               modalType === 'zero_qty' ? '재고 초기화' : 
               modalType === 'save_sample' ? '샘플 고정' :
               modalType === 'reset_sample' ? '샘플 복구' : '전체 삭제'}
            </h3>
            <p className="text-[15px] font-medium text-[#4e5968] mb-8 text-center leading-relaxed whitespace-pre-line px-2">
              {deletingId ? '이 교과서를 목록에서 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.' : 
               modalType === 'zero_qty' ? '목록 정보는 유지되고\n모든 수량만 0권으로 변경됩니다.' : 
               modalType === 'save_sample' ? '지금 화면에 보이는 교과서 목록이\n앞으로의 [기본 복구 샘플]로 영구 저장됩니다.' :
               modalType === 'reset_sample' ? '저장된 샘플 데이터로 덮어씌웁니다.\n현재 입력하신 정보는 사라집니다.' :
               '현재 입력하신 정보가 모두 사라지며\n복구할 수 없습니다. 계속하시겠습니까?'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setModalType(null); setDeletingId(null); }} className="flex-1 py-4 bg-[#f2f4f6] text-[#4e5968] font-bold rounded-2xl hover:bg-slate-200 transition-colors">취소</button>
              <button 
                onClick={async () => {
                  if(deletingId) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'textbooks', deletingId)); setDeletingId(null); }
                  else { await handleBulk(modalType); }
                }} 
                className={`flex-1 py-4 text-white font-bold rounded-2xl shadow-lg transition-all ${
                  (modalType === 'zero_qty' || modalType === 'save_sample') ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-rose-500 hover:bg-rose-600'
                }`}
              >확인</button>
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
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-thumb { background: #d1d6db; border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoom-in-95 { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-in { animation-duration: 300ms; animation-fill-mode: both; }
        .fade-in { animation-name: fade-in; }
        .zoom-in-95 { animation-name: zoom-in-95; }
      `}</style>
    </div>
  );
}