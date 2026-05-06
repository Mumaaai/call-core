import { useState, useEffect, useMemo, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { menu } from './menu';
import { Search, Menu, X, BookOpen, Sun, Moon, ArrowRight, Video, FileText, Cpu, Code, Settings } from 'lucide-react';

const rawMarkdowns = import.meta.glob('./markdowns/*.md', { query: '?raw', import: 'default' });

const useGlobalSearch = () => {
  const [docs, setDocs] = useState<{id: string, title: string, content: string}[]>([]);
  
  useEffect(() => {
    const loadAllDocs = async () => {
      const allDocs = [];
      for (const section of menu) {
        for (const item of section.items) {
          const importFn = rawMarkdowns[`./markdowns/${item.file}`];
          if (importFn) {
            const text = await importFn() as string;
            // Strip common markdown characters for cleaner search snippets
            const cleanText = text.replace(/[#*`_\\[\\]()]/g, '');
            allDocs.push({
              id: item.id,
              title: item.title,
              content: cleanText
            });
          }
        }
      }
      setDocs(allDocs);
    };
    loadAllDocs();
  }, []);

  return docs;
};

const getSnippet = (content: string, query: string) => {
  if (!query) return null;
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerContent.indexOf(lowerQuery);
  
  if (index === -1) return null;
  
  const start = Math.max(0, index - 40);
  const end = Math.min(content.length, index + query.length + 40);
  let snippet = content.substring(start, end).replace(/\n/g, ' ');
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi');
  const parts = snippet.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) 
          ? <strong key={i} className="bg-yellow-200 dark:bg-yellow-500/30 text-yellow-900 dark:text-yellow-200 px-1 rounded">{part}</strong> 
          : part
      )}
    </>
  );
};

const SearchBar = ({ onSelect, autoFocus }: { onSelect?: (id: string) => void, autoFocus?: boolean }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const docs = useGlobalSearch();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return docs
      .filter(d => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q))
      .slice(0, 5);
  }, [query, docs]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          autoFocus={autoFocus}
          placeholder="Search everything..."
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:border-mumaa-orange focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900 rounded-2xl shadow-sm text-gray-900 dark:text-white transition-all outline-none"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsFocused(true);
          }}
          onFocus={() => setIsFocused(true)}
        />
      </div>
      
      {isFocused && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
          {results.length > 0 ? (
            <ul className="py-2">
              {results.map(res => {
                const snippet = getSnippet(res.content, query);
                return (
                  <li key={res.id}>
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-orange-50 dark:hover:bg-gray-700 flex flex-col"
                      onClick={() => {
                        setQuery('');
                        setIsFocused(false);
                        navigate(`/docs/${res.id}?q=${encodeURIComponent(query)}`);
                        if (onSelect) onSelect(res.id);
                      }}
                    >
                      <span className="font-semibold text-gray-900 dark:text-white">{res.title}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 leading-relaxed">
                        {snippet || "Match found in document content"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const LandingPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4 w-full">
      <div className="mb-6 p-4 bg-orange-100 dark:bg-gray-800 rounded-full inline-block shadow-sm">
        <BookOpen className="w-12 h-12 text-mumaa-orange" />
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-gray-900 dark:text-gray-50 tracking-tight">
        Mumaa AI <span className="text-mumaa-orange">Call Core</span>
      </h1>
      <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mb-10">
        Everything you need to build scalable 1:1 video consultations.
      </p>
      
      <div className="w-full mb-16">
        <SearchBar autoFocus={true} />
      </div>

      <div className="flex flex-row justify-center gap-8 mt-auto mb-8">
        <Link to="/docs/intro" className="flex flex-col items-center gap-2 text-gray-500 hover:text-mumaa-orange transition-colors">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
            <Video className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium">Video SDK</span>
        </Link>
        <Link to="/docs/backend" className="flex flex-col items-center gap-2 text-gray-500 hover:text-mumaa-orange transition-colors">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
            <Code className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium">API</span>
        </Link>
        <Link to="/docs/worker" className="flex flex-col items-center gap-2 text-gray-500 hover:text-mumaa-orange transition-colors">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
            <Cpu className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium">AI Worker</span>
        </Link>
        <Link to="/docs/setup" className="flex flex-col items-center gap-2 text-gray-500 hover:text-mumaa-orange transition-colors">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
            <Settings className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium">Setup</span>
        </Link>
      </div>
    </div>
  );
};

const DocViewer = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q');
  const [content, setContent] = useState<string>('Loading...');

  useEffect(() => {
    const loadContent = async () => {
      const menuItem = menu.flatMap(m => m.items).find(i => i.id === id);
      if (menuItem) {
        const importFn = rawMarkdowns[`./markdowns/${menuItem.file}`];
        if (importFn) {
          const text = await importFn();
          setContent(text as unknown as string);
        } else {
          setContent('# 404\nDocument not found.');
        }
      } else {
        setContent('# 404\nDocument not found.');
      }
    };
    loadContent();
  }, [id]);

  const highlightedContent = useMemo(() => {
    if (!q || !content || content.startsWith('Loading...') || content.startsWith('# 404')) return content;
    
    const safeQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeQuery})`, 'gi');
    
    const parts = content.split(/(```[\s\S]*?```|`[^`]*`|\[[^\]]*\]\([^)]*\)|<[^>]*>)/g);
    
    return parts.map(part => {
      if (!part) return '';
      if (part.startsWith('`') || part.startsWith('[') || part.startsWith('<')) {
        return part;
      }
      return part.replace(regex, '<mark class="bg-yellow-300 text-black px-1 rounded font-bold shadow-sm">$1</mark>');
    }).join('');
  }, [content, q]);

  return (
    <div className="prose max-w-none pb-20">
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{highlightedContent}</ReactMarkdown>
    </div>
  );
};

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const location = useLocation();
  const isLanding = location.pathname === '/';

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="lg:hidden text-gray-600 dark:text-gray-300" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white">
            <BookOpen className="text-mumaa-orange" /> Mumaa AI
          </Link>
        </div>
        <div className="flex items-center gap-4 flex-1 justify-end">
          <div className="hidden sm:block w-full max-w-md">
            {!isLanding && <SearchBar />}
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 text-gray-500 hover:text-mumaa-orange dark:text-gray-400 dark:hover:text-mumaa-orange transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex w-full">
        <aside className={`
          fixed inset-y-0 left-0 pt-16 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out z-40
          lg:static lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="p-4 h-full overflow-y-auto">
            {menu.map((section, idx) => (
              <div key={idx} className="mb-8">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-3">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map(item => (
                    <li key={item.id}>
                      <Link
                        to={`/docs/${item.id}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                          location.pathname.startsWith(`/docs/${item.id}`)
                            ? 'bg-orange-100 text-orange-900 font-semibold dark:bg-orange-900/30 dark:text-orange-300'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                        }`}
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className={`flex-1 p-6 md:p-12 w-full ${isLanding ? 'flex items-center justify-center' : 'max-w-4xl mx-auto'}`}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/docs/:id" element={<DocViewer />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
