import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { Search, Plus, Trash2, Cloud, Upload, Download } from 'lucide-react';

// ==========================================
// 🚨 여기에 선생님의 Firebase 설정값을 넣어주세요!
// ==========================================
const myFirebaseConfig = {
  apiKey: "AIzaSyCTyBcLl5eTugvkL8izjcsep8diGalITSI",
  authDomain: "school-books-d04cc.firebaseapp.com",
  projectId: "school-books-d04cc",
  storageBucket: "school-books-d04cc.firebasestorage.app",
  messagingSenderId: "315141079427",
  appId: "1:315141079427:web:e8214c0c0f63d0787fb6b6"
};

// 파이어베이스 초기화
const app = initializeApp(myFirebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('전체');
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Firestore 실시간 데이터 가져오기
  useEffect(() => {
    const booksCol = collection(db, 'books');
    const unsubscribe = onSnapshot(booksCol, (snapshot) => {
      const bookData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // 정렬: 학년 오름차순, 그 다음 이름 오름차순
      bookData.sort((a, b) => {
        if (a.grade === b.grade) return a.name.localeCompare(b.name);
        return a.grade.localeCompare(b.grade);
      });
      setBooks(bookData);
      setIsCloudConnected(true);
    }, (error) => {
      console.error("Firebase 연결 에러:", error);
      setIsCloudConnected(false);
    });

    return () => unsubscribe();
  }, []);

  // 수량 업데이트 함수
  const updateQuantity = async (id, currentQty, change) => {
    const newQty = Math.max(0, currentQty + change);
    if (newQty === currentQty) return;
    try {
      const bookRef = doc(db, 'books', id);
      await updateDoc(bookRef, { quantity: newQty });
    } catch (error) {
      console.error("수량 업데이트 실패:", error);
    }
  };

  // 새 교과서 추가
  const addNewBook = async () => {
    const name = prompt('교과서 이름을 입력하세요 (예: 국어 1-1)');
    if (!name) return;
    const grade = prompt('학년을 입력하세요 (예: 1학년, 2학년)', '1학년');
    if (!grade) return;
    const publisher = prompt('출판사와 개정년도를 입력하세요 (예: 2022 개정 · 비상)', '2022 개정 · 비상');

    try {
      await addDoc(collection(db, 'books'), {
        name,
        grade,
        publisher: publisher || '',
        quantity: 0
      });
    } catch (error) {
      console.error("추가 실패:", error);
    }
  };

  // 삭제 함수
  const deleteBook = async (id) => {
    if (window.confirm('정말 이 교과서를 목록에서 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'books', id));
      } catch (error) {
        console.error("삭제 실패:", error);
      }
    }
  };

  // 필터링 적용
  const filteredBooks = books.filter(book => {
    const matchSearch = book.name.includes(searchTerm) || book.publisher.includes(searchTerm);
    const matchGrade = filterGrade === '전체' || book.grade === filterGrade;
    return matchSearch && matchGrade;
  });

  const totalBooks = books.reduce((sum, book) => sum + book.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 상단 헤더 영역 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Cloud className={`w-4 h-4 ${isCloudConnected ? 'text-green-500' : 'text-gray-400'}`} />
              <span className={`text-xs font-bold ${isCloudConnected ? 'text-green-600' : 'text-gray-500'}`}>
                {isCloudConnected ? '라이브 클라우드' : '연결 중...'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">현암초 교과서 관리</h1>
          </div>
          <div className="bg-blue-600 rounded-xl p-3 text-white text-center shadow-md">
            <div className="text-xs font-medium opacity-90">전체 재고</div>
            <div className="text-2xl font-black leading-none">{totalBooks}<span className="text-sm font-normal ml-1">권</span></div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6">
        {/* 검색 및 필터 영역 */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 border border-gray-100">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="과목명이나 출판사를 검색하세요..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {['전체', '1학년', '2학년', '3학년', '4학년', '5학년', '6학년'].map(grade => (
              <button
                key={grade}
                onClick={() => setFilterGrade(grade)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  filterGrade === grade 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>

        {/* 리스트 헤더 (모바일에서도 비율 유지) */}
        <div className="flex px-2 sm:px-4 py-3 text-xs font-bold text-gray-400 border-b border-gray-200">
          <div className="w-14 sm:w-20 text-center">학년</div>
          <div className="flex-1 text-center">과목 정보</div>
          <div className="w-24 sm:w-32 text-center">재고 수량</div>
        </div>

        {/* 교과서 리스트 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden mb-6">
          {filteredBooks.map((book) => (
            <div key={book.id} className="flex items-center p-3 sm:p-4 hover:bg-gray-50 transition-colors group relative">
              {/* 학년 라벨 - 고정 너비 */}
              <div className="w-14 sm:w-20 flex justify-center shrink-0">
                <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-xs font-black whitespace-nowrap">
                  {book.grade}
                </span>
              </div>
              
              {/* 과목 정보 - 넘치면 줄임말(...) 처리되도록 min-w-0 적용 */}
              <div className="flex-1 min-w-0 px-2 text-center">
                <div className="font-bold text-gray-800 text-sm sm:text-base truncate">{book.name}</div>
                <div className="text-[10px] sm:text-xs text-gray-400 truncate mt-0.5">{book.publisher}</div>
              </div>
              
              {/* 수량 조절 - 크기 줄어들지 않도록 shrink-0 적용 */}
              <div className="w-24 sm:w-32 flex justify-center items-center gap-1 sm:gap-3 shrink-0">
                <button 
                  onClick={() => updateQuantity(book.id, book.quantity, -1)}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-red-500 active:scale-95 transition-all"
                >
                  -
                </button>
                <span className="font-black text-gray-800 w-6 sm:w-8 text-center text-sm sm:text-lg">
                  {book.quantity}
                </span>
                <button 
                  onClick={() => updateQuantity(book.id, book.quantity, 1)}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-blue-500 active:scale-95 transition-all"
                >
                  +
                </button>
              </div>

              {/* 삭제 버튼 (PC에서는 마우스 오버시, 모바일에서는 살짝 보이게) */}
              <button 
                onClick={() => deleteBook(book.id)}
                className="absolute right-2 top-2 p-1 text-gray-300 hover:text-red-500 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                title="삭제하기"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          {filteredBooks.length === 0 && (
            <div className="p-10 text-center text-gray-400 font-medium">
              검색된 교과서가 없습니다.
            </div>
          )}
        </div>

        {/* 새 교과서 추가 버튼 */}
        <button 
          onClick={addNewBook}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          새 교과서 항목 추가하기
        </button>
      </div>
    </div>
  );
}