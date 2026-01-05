"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Article } from '@/lib/types';

interface ArticleDetailProps {
    article: Article & { feedTitle: string };
    onClose: () => void;
}

interface AnalysisResult {
    summary: string;
    insight: string;
    technicalContext?: string;
    takeaways: string[];
    whatToWatch?: string;
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, onClose }) => {
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const socialCardRef = useRef<HTMLDivElement>(null);

    const handleShare = async () => {
        if (!socialCardRef.current) return;
        try {
            const dataUrl = await toPng(socialCardRef.current, { cacheBust: true, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `share-${article.title.slice(0, 20)}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate image', err);
        }
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setError(null);
        try {
            const contentToAnalyze = article.content || article.contentSnippet || article.title;
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: contentToAnalyze }),
            });

            if (!res.ok) throw new Error('Analysis failed');

            const data = await res.json();
            setAnalysis(data);
        } catch (e) {
            setError('Failed to generate analysis. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-xl p-0 md:p-8"
            onClick={onClose}
        >
            <motion.div
                layoutId={`card-${article.link}`}
                className="w-full md:max-w-3xl max-h-[95vh] md:max-h-[90vh] bg-[var(--color-bg-elevated)] border-t md:border border-[var(--border-strong)] rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-[var(--border-subtle)] flex justify-between items-start sticky top-0 z-10 bg-[var(--color-bg-elevated)]">
                    <div className="pr-8">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="type-caption text-[var(--color-text-tertiary)]">
                                {article.feedTitle}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-[var(--color-text-tertiary)] opacity-40" />
                            <span className="type-caption text-[var(--color-text-tertiary)]">
                                {article.isoDate ? new Date(article.isoDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : ''}
                            </span>
                        </div>
                        <h2 className="type-title text-[var(--color-text-primary)] leading-tight">
                            {article.title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors type-footnote"
                    >
                        Close
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {/* AI Analysis Section */}
                    <div className="mb-8">
                        {!analysis && !analyzing && (
                            <button
                                onClick={handleAnalyze}
                                className="apple-button-primary w-full"
                            >
                                Analyze with AI
                            </button>
                        )}

                        {analyzing && (
                            <div className="w-full py-12 rounded-xl border border-[var(--border-color)] bg-[var(--color-bg-tertiary)] flex flex-col items-center justify-center gap-3">
                                <div className="w-6 h-6 border-2 border-[var(--color-text-tertiary)] border-t-[var(--color-accent)] rounded-full animate-spin"></div>
                                <span className="type-footnote text-[var(--color-text-secondary)]">Analyzing...</span>
                            </div>
                        )}

                        {error && (
                            <div className="w-full p-4 rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 text-[var(--color-error)] type-footnote text-center">
                                {error}
                            </div>
                        )}

                        <AnimatePresence>
                            {analysis && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, ease: [0.28, 0, 0.21, 1] }}
                                    className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--color-bg-tertiary)]"
                                >
                                    <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--color-bg-secondary)]">
                                        <span className="type-caption text-[var(--color-text-secondary)]">Analysis</span>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        {/* Summary */}
                                        <div>
                                            <h4 className="type-subheadline font-medium text-[var(--color-text-primary)] mb-2">Summary</h4>
                                            <p className="type-body text-[var(--color-text-secondary)] leading-relaxed">
                                                {analysis.summary}
                                            </p>
                                        </div>

                                        {/* Key Insight */}
                                        <div className="pt-4 border-t border-[var(--border-subtle)]">
                                            <h4 className="type-subheadline font-medium text-[var(--color-text-primary)] mb-2">Key Insight</h4>
                                            <p className="type-body text-[var(--color-text-secondary)] leading-relaxed">
                                                {analysis.insight}
                                            </p>
                                        </div>

                                        {/* Technical Context */}
                                        {analysis.technicalContext && analysis.technicalContext.trim() && (
                                            <div className="pt-4 border-t border-[var(--border-subtle)]">
                                                <h4 className="type-subheadline font-medium text-[var(--color-text-primary)] mb-2">Technical Context</h4>
                                                <p className="type-body text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-bg-secondary)] p-4 rounded-lg border-l-2 border-[var(--color-accent)]">
                                                    {analysis.technicalContext}
                                                </p>
                                            </div>
                                        )}

                                        {/* Practical Takeaways */}
                                        <div className="pt-4 border-t border-[var(--border-subtle)]">
                                            <h4 className="type-subheadline font-medium text-[var(--color-text-primary)] mb-3">Practical Takeaways</h4>
                                            <ul className="space-y-3">
                                                {analysis.takeaways.map((takeaway, i) => (
                                                    <li key={i} className="type-body text-[var(--color-text-secondary)] flex gap-3 leading-relaxed">
                                                        <span className="block w-1 h-1 mt-2.5 rounded-full bg-[var(--color-text-tertiary)] flex-shrink-0" />
                                                        {takeaway}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* What to Watch */}
                                        {analysis.whatToWatch && analysis.whatToWatch.trim() && (
                                            <div className="pt-4 border-t border-[var(--border-subtle)]">
                                                <h4 className="type-subheadline font-medium text-[var(--color-text-primary)] mb-2">What to Watch</h4>
                                                <p className="type-body text-[var(--color-text-secondary)] leading-relaxed">
                                                    {analysis.whatToWatch}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Article Body */}
                    <div
                        className="prose prose-invert prose-lg max-w-none prose-headings:font-semibold prose-a:text-[var(--color-accent)] prose-strong:text-[var(--color-text-primary)] text-[var(--color-text-secondary)]"
                        dangerouslySetInnerHTML={{ __html: article.content || article.contentSnippet || '' }}
                    />
                </div>

                {/* Footer */}
                <div className="p-4 md:p-5 border-t border-[var(--border-subtle)] bg-[var(--color-bg-elevated)] flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                    <div className="flex gap-3">
                        <button
                            onClick={handleShare}
                            className="apple-button-secondary"
                        >
                            Share Image
                        </button>
                        {analysis && (
                            <button
                                onClick={() => {
                                    let mdContent = `# ${article.title}\n\n## Summary\n${analysis.summary}\n\n## Key Insight\n${analysis.insight}`;

                                    if (analysis.technicalContext?.trim()) {
                                        mdContent += `\n\n## Technical Context\n${analysis.technicalContext}`;
                                    }

                                    mdContent += `\n\n## Practical Takeaways\n${analysis.takeaways.map(a => `- ${a}`).join('\n')}`;

                                    if (analysis.whatToWatch?.trim()) {
                                        mdContent += `\n\n## What to Watch\n${analysis.whatToWatch}`;
                                    }

                                    mdContent += `\n\nGenerated by AI.`;
                                    const blob = new Blob([mdContent], { type: 'text/markdown' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `analysis-${article.title.slice(0, 30).replace(/[^a-z0-9]/gi, '_')}.md`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                                className="apple-button-secondary"
                            >
                                Export Analysis
                            </button>
                        )}
                    </div>

                    <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="apple-button-primary"
                    >
                        Read Full Article
                    </a>
                </div>

                {/* Hidden Social Card for Capture */}
                <div
                    ref={socialCardRef}
                    className="fixed -left-[9999px] top-0 w-[1080px] h-[1080px] bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] p-16 flex flex-col justify-between"
                >
                    <div>
                        <div className="flex items-center gap-4 mb-8">
                            <span className="text-4xl font-semibold tracking-tight text-white/90">Your Feed</span>
                            <span className="h-[1px] flex-1 bg-white/15"></span>
                            <span className="text-3xl text-white/40">{new Date().toLocaleDateString()}</span>
                        </div>
                        <h1 className="text-7xl font-semibold text-white mb-12 leading-tight">
                            {article.title}
                        </h1>
                        <p className="text-4xl text-white/70 leading-relaxed">
                            {article.contentSnippet || article.content?.substring(0, 300)}
                        </p>
                    </div>
                    <div>
                        {analysis && (
                            <div className="mb-12 p-8 rounded-2xl bg-white/5 border border-white/10">
                                <span className="type-caption text-[var(--color-accent)] mb-4 block">Analysis</span>
                                <p className="text-3xl text-white leading-relaxed">
                                    {analysis.insight || "Essential reading."}
                                </p>
                            </div>
                        )}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[var(--color-accent)]"></div>
                            <span className="text-3xl text-white/50">Curated with AI</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
