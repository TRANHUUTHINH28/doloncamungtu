
import React, { useState, useCallback } from 'react';
import { MOCK_QUESTIONS } from './mockData';
import { Question, SearchResult, DuplicateMatch } from './types';
import { findDuplicates } from './geminiService';

// --- Sub-components (defined outside to avoid re-renders) ---

const Header: React.FC = () => (
  <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
    <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 p-1.5 rounded-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800">Gemini Duplicate Finder</h1>
      </div>
      <nav className="flex gap-4">
        <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          {MOCK_QUESTIONS.length} Questions in DB
        </span>
      </nav>
    </div>
  </header>
);

const SearchSection: React.FC<{
  onSearch: (text: string) => void;
  isLoading: boolean;
}> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Kiểm tra câu hỏi mới</h2>
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập câu hỏi của bạn tại đây để kiểm tra trùng lặp..."
          className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-slate-700"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className={`absolute bottom-4 right-4 px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg ${
            isLoading || !query.trim()
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white transform hover:-translate-y-0.5'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang phân tích...
            </>
          ) : (
            <>
              Phân tích trùng lặp
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

const DuplicateResultItem: React.FC<{
  match: DuplicateMatch;
  original: Question;
}> = ({ match, original }) => {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 65) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  return (
    <div className="p-5 border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors bg-white group">
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Existing Question</span>
          <h4 className="text-slate-800 font-medium group-hover:text-indigo-600 transition-colors">
            {original.text}
          </h4>
        </div>
        <div className={`px-3 py-1 rounded-full border text-sm font-bold flex items-center gap-1 shrink-0 ${getScoreColor(match.similarityScore)}`}>
          {match.similarityScore}% <span className="text-[10px] uppercase opacity-70">Match</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          {original.author}
        </span>
        <span className="px-2 py-0.5 rounded bg-slate-100">{original.category}</span>
      </div>

      <div className="mt-3 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
        <p className="text-sm text-indigo-900 leading-relaxed italic">
          <span className="font-semibold">AI Reason:</span> {match.reasoning}
        </p>
      </div>
    </div>
  );
};

const ResultsList: React.FC<{
  results: SearchResult | null;
  questions: Question[];
}> = ({ results, questions }) => {
  if (!results) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
          Kết quả phân tích
          <span className={`px-2 py-0.5 rounded text-xs ${results.matches.length > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {results.matches.length} matches found
          </span>
        </h3>
        <p className="text-slate-600 mb-6 pb-6 border-b border-slate-100">
          {results.analysis}
        </p>

        <div className="space-y-4">
          {results.matches.map((match) => {
            const original = questions.find(q => q.id === match.questionId);
            if (!original) return null;
            return (
              <DuplicateResultItem 
                key={match.questionId} 
                match={match} 
                original={original} 
              />
            );
          })}
          
          {results.matches.length === 0 && (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">Tuyệt vời! Không tìm thấy câu hỏi tương tự.</p>
              <p className="text-slate-400 text-sm">Bạn có thể đăng câu hỏi này mà không lo bị trùng lặp.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);

  const handleSearch = useCallback(async (text: string) => {
    setIsLoading(true);
    try {
      const searchResults = await findDuplicates(text, MOCK_QUESTIONS);
      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 pt-8">
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Thông minh & Chính xác</h2>
          <p className="text-slate-500 max-w-2xl">
            Sử dụng công nghệ Gemini AI mới nhất để phát hiện các câu hỏi trùng lặp về mặt ý nghĩa, 
            giúp cơ sở dữ liệu của bạn luôn tinh gọn và hữu ích.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-12">
            <SearchSection onSearch={handleSearch} isLoading={isLoading} />
            <ResultsList results={results} questions={MOCK_QUESTIONS} />
          </div>
        </div>

        <section className="mt-16 pt-12 border-t border-slate-200">
          <h3 className="text-xl font-semibold text-slate-800 mb-6">Danh sách câu hỏi mẫu trong hệ thống</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_QUESTIONS.map(q => (
              <div key={q.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                    ID: {q.id}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 uppercase">
                    {q.category}
                  </span>
                </div>
                <p className="text-slate-700 font-medium line-clamp-2">{q.text}</p>
                <div className="mt-2 text-xs text-slate-400">Đăng bởi: {q.author}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Persistent Help Toggle */}
      <div className="fixed bottom-6 right-6">
        <button className="bg-slate-900 text-white p-3 rounded-full shadow-2xl hover:bg-slate-800 transition-all group flex items-center gap-2 overflow-hidden max-w-[48px] hover:max-w-[200px]">
          <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pr-2 text-sm font-medium">How it works</span>
        </button>
      </div>
    </div>
  );
};

export default App;
