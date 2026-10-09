import React, { useState, useEffect, useRef, useMemo } from 'react';
import { documentsApi } from '../../api/documentsApi';
import DocumentCard from '../../components/documents/DocumentCard';
import { 
    UploadCloud, Search, BookOpen, AlertCircle, Loader, 
    RefreshCw, FileText, CheckCircle2, Sparkles, Database, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function MemoriesPage() {
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const fileInputRef = useRef(null);

    const fetchDocuments = async () => {
        try {
            const data = await documentsApi.getDocuments();
            if (Array.isArray(data)) {
                setDocuments(data);
            } else {
                setDocuments([]);
            }
        } catch (err) {
            console.error("Failed to load documents", err);
            toast.error("Failed to load your memories.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        await handleUpload(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) await handleUpload(file);
    };

    const handleUpload = async (file) => {
        setUploadError(null);
        
        // Basic validation
        if (file.size > 10 * 1024 * 1024) {
            setUploadError("File is too large. Maximum size is 10MB.");
            toast.error("File exceeds 10MB limit.");
            return;
        }
        
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'txt'].includes(ext)) {
            setUploadError("Invalid file type. Only PDF and TXT documents are supported.");
            toast.error("Only PDF and TXT files are supported.");
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading("Extracting and processing document...");
        try {
            const res = await documentsApi.uploadDocument(file);
            toast.success(res?.message || "Document processed and stored!", { id: toastId });
            await fetchDocuments();
        } catch (err) {
            const errMsg = err.response?.data?.error || "Upload failed. Please check your document and try again.";
            setUploadError(errMsg);
            toast.error(errMsg, { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await documentsApi.deleteDocument(id);
            setDocuments(docs => docs.filter(d => d.id !== id));
            toast.success("Memory deleted successfully.");
        } catch (err) {
            console.error("Failed to delete document:", err);
            const errMsg = err.response?.data?.error || "Failed to delete memory.";
            toast.error(errMsg);
            throw err;
        }
    };

    const filteredDocs = useMemo(() => {
        if (!searchQuery.trim()) return documents;
        const q = searchQuery.toLowerCase().trim();
        return documents.filter(doc => {
            const titleMatch = doc.title?.toLowerCase().includes(q);
            const nameMatch = doc.original_name?.toLowerCase().includes(q);
            const summaryMatch = doc.summary?.toLowerCase().includes(q);
            const overviewMatch = doc.overview?.toLowerCase().includes(q);
            const textMatch = doc.extracted_text?.toLowerCase().includes(q);
            const topicsMatch = doc.key_topics?.some(t => String(t).toLowerCase().includes(q));
            const keywordsMatch = doc.keywords?.some(k => String(k).toLowerCase().includes(q));
            const pointsMatch = doc.key_points?.some(p => String(p).toLowerCase().includes(q));
            return titleMatch || nameMatch || summaryMatch || overviewMatch || textMatch || topicsMatch || keywordsMatch || pointsMatch;
        });
    }, [documents, searchQuery]);

    const totalExtractedChars = useMemo(() => {
        return documents.reduce((acc, d) => acc + (d.extracted_chars || d.extracted_text?.length || 0), 0);
    }, [documents]);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-16 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-primary-400 via-indigo-300 to-indigo-400 bg-clip-text text-transparent tracking-tight">
                        Life Memories & Knowledge
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm sm:text-base">
                        Upload your PDFs and documents. We automatically extract content and create structured summaries.
                    </p>
                </div>

                {documents.length > 0 && (
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 rounded-2xl bg-surface-800/80 border border-white/5 flex items-center gap-2.5 text-xs text-slate-300">
                            <Database className="w-4 h-4 text-cyan-400" />
                            <span><strong>{documents.length}</strong> Memories ({totalExtractedChars.toLocaleString()} chars)</span>
                        </div>
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Upload Section */}
                <div className="lg:col-span-1 space-y-4">
                    <div 
                        className={`glass-card p-7 flex flex-col items-center justify-center text-center border-2 border-dashed transition-all cursor-pointer group
                            ${isUploading ? 'border-primary-500 bg-primary-900/15' : 'border-surface-600/80 hover:border-primary-500 hover:bg-surface-800/60'}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".pdf,.txt"
                            onChange={handleFileChange}
                        />
                        
                        <div className="w-16 h-16 bg-surface-800/90 border border-white/10 rounded-2xl flex items-center justify-center mb-4 text-primary-400 group-hover:scale-105 transition-transform shadow-lg">
                            {isUploading ? <Loader className="w-8 h-8 animate-spin text-primary-400" /> : <UploadCloud className="w-8 h-8" />}
                        </div>
                        
                        <h3 className="text-lg font-bold text-white mb-1.5">
                            {isUploading ? 'Processing Document...' : 'Upload Memory Document'}
                        </h3>
                        <p className="text-xs text-slate-400 mb-5 max-w-xs leading-relaxed">
                            Drag & drop your PDF or TXT file here, or click to browse. Max 10MB.
                        </p>
                        
                        <button 
                            type="button"
                            disabled={isUploading}
                            className="btn-primary w-full text-xs sm:text-sm py-2.5 flex items-center justify-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" /> Extracting Text...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" /> Select PDF or TXT
                                </>
                            )}
                        </button>
                    </div>

                    {uploadError && (
                        <motion.div 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-900/20 border border-red-500/40 rounded-2xl p-4 flex items-start gap-3 text-red-200"
                        >
                            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            <div className="text-xs space-y-1">
                                <p className="font-semibold text-red-300">Upload Issue</p>
                                <p className="text-red-200/90">{uploadError}</p>
                            </div>
                        </motion.div>
                    )}

                    {/* How It Works Card */}
                    <div className="glass-card p-5 border border-white/5 space-y-3">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-primary-400" /> Document Pipeline
                        </h4>
                        <div className="space-y-2 text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-surface-800 text-primary-400 flex items-center justify-center font-bold text-[10px]">1</span>
                                <span><strong>Instant Text Extraction</strong> from PDF/TXT</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-surface-800 text-primary-400 flex items-center justify-center font-bold text-[10px]">2</span>
                                <span><strong>Local Summary Generation</strong> without OpenAI</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-surface-800 text-primary-400 flex items-center justify-center font-bold text-[10px]">3</span>
                                <span><strong>Full Searchability</strong> in AI Replay</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Documents Grid / List Section */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Controls Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between glass-card p-4 border border-white/5">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-white">Your Documents</h2>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-800 text-slate-300 border border-white/5 font-semibold">
                                {filteredDocs.length}
                            </span>
                        </div>
                        
                        {/* Search field */}
                        <div className="relative w-full sm:w-72">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search by name, summary, topic..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-surface-900/90 border border-surface-700/80 rounded-xl py-2 pl-9 pr-8 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content Section */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
                            <p className="text-slate-400 text-sm font-medium">Loading your memories...</p>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-20 bg-surface-900/40 rounded-3xl border border-dashed border-surface-700/80 p-8">
                            <div className="w-16 h-16 bg-surface-800 rounded-2xl flex items-center justify-center mb-4 text-slate-400 border border-white/5 shadow-inner">
                                <BookOpen className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1.5">No memories yet</h3>
                            <p className="text-slate-400 max-w-sm mx-auto text-xs sm:text-sm leading-relaxed mb-5">
                                Upload journal entries, notes, or project PDFs to start building your personal searchable memory database.
                            </p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="btn-primary text-xs sm:text-sm px-5 py-2.5"
                            >
                                Upload Your First Document
                            </button>
                        </div>
                    ) : filteredDocs.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 bg-surface-900/30 rounded-3xl border border-white/5 p-6">
                            <Search className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                            <p className="text-sm font-semibold text-slate-300">No memories match "{searchQuery}"</p>
                            <p className="text-xs text-slate-500 mt-1">Try searching with different keywords or clear the filter.</p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="btn-secondary text-xs px-4 py-2 mt-4"
                            >
                                Clear Search Filter
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredDocs.map((doc) => (
                                <DocumentCard 
                                    key={doc.id} 
                                    doc={doc} 
                                    onDelete={handleDelete} 
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
