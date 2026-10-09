import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, Trash2, Calendar, FileType, CheckCircle, AlertCircle, 
    Loader, Eye, X, Copy, Check, Database, Sparkles, BookOpen, 
    Tag, HelpCircle, AlignLeft, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DocumentCard({ doc, onDelete }) {
    const [showTextModal, setShowTextModal] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copied, setCopied] = useState(false);

    const isProcessing = doc.status === 'processing';
    const isError = doc.status === 'error';
    const isLocal = doc.is_local_summary || doc.summary_type === 'local';

    const handleCopy = () => {
        if (doc.extracted_text) {
            navigator.clipboard.writeText(doc.extracted_text);
            setCopied(true);
            toast.success('Extracted text copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(doc.id);
            setShowDeleteModal(false);
        } catch (err) {
            console.error("Delete error:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const keyTopics = Array.isArray(doc.key_topics) ? doc.key_topics : [];
    const keyPoints = Array.isArray(doc.key_points) ? doc.key_points : [];
    const keyDates = Array.isArray(doc.key_dates) ? doc.key_dates : [];
    const keywords = Array.isArray(doc.keywords) ? doc.keywords : [];

    return (
        <>
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5 relative overflow-hidden group flex flex-col justify-between hover:border-primary-500/40 transition-all duration-200"
            >
                <div>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3 gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2.5 rounded-xl shrink-0 ${
                                isError 
                                    ? 'bg-red-900/30 text-red-400 border border-red-500/30' 
                                    : isProcessing 
                                        ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30' 
                                        : 'bg-primary-900/30 text-primary-400 border border-primary-500/30'
                            }`}>
                                {isError ? <AlertCircle className="w-5 h-5" /> : 
                                 isProcessing ? <Loader className="w-5 h-5 animate-spin" /> : 
                                 <FileText className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-white text-base truncate" title={doc.title || doc.original_name}>
                                    {doc.title || doc.original_name}
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                                    <span className="flex items-center gap-1 uppercase font-semibold text-slate-300">
                                        <FileType className="w-3 h-3 text-primary-400" /> {doc.file_type}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-slate-500" /> 
                                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Delete Action */}
                        <button 
                            onClick={() => setShowDeleteModal(true)}
                            className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-xl hover:bg-surface-700/60 shrink-0"
                            title="Delete Memory"
                            aria-label="Delete Memory"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Body / Summary Section */}
                    <div className="mt-3 space-y-2.5">
                        {isProcessing ? (
                            <div className="flex items-center justify-center py-6 text-sm text-blue-400 gap-2.5 bg-surface-900/40 rounded-2xl border border-white/5">
                                <Loader className="w-4 h-4 animate-spin text-primary-400" /> 
                                <span>Extracting document & creating local summary...</span>
                            </div>
                        ) : isError ? (
                            <div className="text-xs text-red-300 bg-red-900/20 p-3.5 rounded-xl border border-red-900/30 leading-relaxed">
                                {doc.error_message || 'Processing failed. This document could not be read or extracted.'}
                            </div>
                        ) : (
                            <>
                                {/* Badge identifying Local vs AI Summary */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    {isLocal ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-800/80 text-slate-300 border border-slate-700">
                                            <Database className="w-3 h-3 text-cyan-400" /> Local Summary
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-violet-900/40 text-violet-300 border border-violet-500/30">
                                            <Sparkles className="w-3 h-3 text-violet-400" /> AI-Enhanced Summary
                                        </span>
                                    )}

                                    {doc.extracted_text && (
                                        <span className="text-[11px] text-slate-400">
                                            {doc.extracted_text.length.toLocaleString()} chars
                                        </span>
                                    )}
                                </div>

                                {/* Overview text preview */}
                                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3 bg-surface-900/40 p-3 rounded-xl border border-white/5">
                                    {doc.overview || doc.summary || 'Document extracted and stored locally.'}
                                </div>

                                {/* Key Topics Badges */}
                                {keyTopics.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {keyTopics.slice(0, 4).map((topic, i) => (
                                            <span 
                                                key={i} 
                                                className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full bg-surface-800 text-primary-300 border border-surface-700/80 font-medium"
                                            >
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Footer Action Buttons */}
                {!isProcessing && !isError && (
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
                        <button
                            onClick={() => setShowSummaryModal(true)}
                            className="text-xs font-semibold text-primary-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-500/10 hover:bg-primary-500/20 transition-all border border-primary-500/20"
                        >
                            <AlignLeft className="w-3.5 h-3.5" /> View Summary
                        </button>

                        {doc.extracted_text && (
                            <button
                                onClick={() => setShowTextModal(true)}
                                className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-800/80 hover:bg-surface-700 transition-all border border-white/5"
                            >
                                <Eye className="w-3.5 h-3.5 text-slate-400" /> Extracted Text
                            </button>
                        )}
                    </div>
                )}
                
                {/* Status Bottom Accent Line */}
                <div className={`absolute bottom-0 left-0 h-1 w-full ${
                    isError ? 'bg-red-500/60' : isProcessing ? 'bg-blue-500/60' : 'bg-primary-500/60'
                }`} />
            </motion.div>

            {/* 1. VIEW SUMMARY MODAL */}
            <AnimatePresence>
                {showSummaryModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSummaryModal(false)}
                            className="fixed inset-0 bg-black/75 backdrop-blur-md"
                        />

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="relative w-full max-w-2xl rounded-3xl overflow-hidden z-10 my-8 flex flex-col max-h-[85vh] glass-card border border-white/10 shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white tracking-tight truncate max-w-md">
                                            {doc.title || doc.original_name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {isLocal ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                                                    <Database className="w-3 h-3 text-cyan-400" /> Local Summary
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-violet-900/40 text-violet-300 border border-violet-500/30">
                                                    <Sparkles className="w-3 h-3 text-violet-400" /> AI-Enhanced Summary
                                                </span>
                                            )}
                                            <span className="text-xs text-slate-400">
                                                {doc.extracted_text ? `${doc.extracted_text.length.toLocaleString()} characters` : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowSummaryModal(false)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-sm text-slate-200">
                                {/* Overview */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Info className="w-4 h-4 text-primary-400" /> Overview
                                    </h4>
                                    <div className="p-4 rounded-2xl bg-surface-900/70 border border-white/5 leading-relaxed text-slate-200">
                                        {doc.overview || doc.summary || 'No overview available.'}
                                    </div>
                                </div>

                                {/* Key Topics */}
                                {keyTopics.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Tag className="w-4 h-4 text-cyan-400" /> Key Topics
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {keyTopics.map((topic, i) => (
                                                <span 
                                                    key={i}
                                                    className="px-3 py-1 rounded-xl bg-surface-800/80 text-primary-300 border border-surface-700 text-xs font-medium"
                                                >
                                                    • {topic}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Key Points */}
                                {keyPoints.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <CheckCircle className="w-4 h-4 text-emerald-400" /> Important Points
                                        </h4>
                                        <div className="p-4 rounded-2xl bg-surface-900/70 border border-white/5 space-y-2">
                                            {keyPoints.map((pt, i) => (
                                                <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                                                    <span className="text-primary-400 font-bold">•</span>
                                                    <p className="leading-relaxed">{pt}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Key Dates */}
                                {keyDates.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4 text-amber-400" /> Key Dates Mentioned
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {keyDates.map((d, i) => (
                                                <div key={i} className="p-3 rounded-xl bg-surface-900/50 border border-white/5 flex items-center gap-2 text-xs text-amber-300 font-medium">
                                                    <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                                    <span>{d}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Useful Keywords */}
                                {keywords.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Useful Keywords
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {keywords.map((kw, i) => (
                                                <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/5">
                                                    #{kw}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 sm:p-6 border-t border-white/10 bg-surface-900/50 flex items-center justify-between gap-3 shrink-0">
                                <button
                                    onClick={() => {
                                        setShowSummaryModal(false);
                                        setShowTextModal(true);
                                    }}
                                    className="text-xs text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1.5"
                                >
                                    <Eye className="w-4 h-4" /> View Full Extracted Text
                                </button>
                                <button
                                    onClick={() => setShowSummaryModal(false)}
                                    className="btn-secondary text-xs px-5 py-2.5"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 2. VIEW EXTRACTED TEXT MODAL */}
            <AnimatePresence>
                {showTextModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTextModal(false)}
                            className="fixed inset-0 bg-black/75 backdrop-blur-md"
                        />

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="relative w-full max-w-3xl rounded-3xl overflow-hidden z-10 my-8 flex flex-col max-h-[85vh] glass-card border border-white/10 shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-primary-400" />
                                    <div>
                                        <h3 className="font-bold text-white text-lg truncate max-w-md">
                                            {doc.title || doc.original_name}
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Full Extracted Text • {doc.extracted_text?.length.toLocaleString() || 0} characters
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 text-slate-300 hover:text-white bg-surface-800 hover:bg-surface-700 rounded-xl transition-colors text-xs flex items-center gap-1.5 border border-white/5"
                                        title="Copy Text"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                                    </button>
                                    <button
                                        onClick={() => setShowTextModal(false)}
                                        className="p-2 text-slate-400 hover:text-white bg-surface-800 hover:bg-surface-700 rounded-xl transition-colors border border-white/5"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Extracted Text Content */}
                            <div className="flex-1 overflow-y-auto p-6 bg-surface-950/80 custom-scrollbar select-text">
                                <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap font-mono leading-relaxed bg-surface-900/60 p-5 rounded-2xl border border-white/5">
                                    {doc.extracted_text || 'No extracted text found.'}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 sm:p-6 border-t border-white/10 bg-surface-900/50 flex justify-end shrink-0">
                                <button
                                    onClick={() => setShowTextModal(false)}
                                    className="btn-secondary text-xs px-5 py-2.5"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 3. DELETE CONFIRMATION MODAL */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isDeleting && setShowDeleteModal(false)}
                            className="fixed inset-0 bg-black/75 backdrop-blur-md"
                        />

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-md rounded-3xl overflow-hidden z-10 glass-card p-6 border border-red-500/25 shadow-2xl space-y-5"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-red-900/30 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
                                <Trash2 className="w-6 h-6" />
                            </div>

                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-white">Delete this memory?</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    This will permanently remove <strong className="text-white font-semibold">"{doc.title || doc.original_name}"</strong> and its extracted content from your Life Replay database.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={isDeleting}
                                    className="btn-secondary w-1/2 py-2.5 text-sm font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="w-1/2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? <Loader className="w-4 h-4 animate-spin" /> : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
