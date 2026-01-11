import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Article } from '@/lib/types';
import { ExternalLink, Calendar, Hash, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface ArticleCardProps {
    article: Article & { feedTitle: string };
    index: number;
    onClick?: () => void;
}

interface Summary {
    tldr: string;
    keyPoints: string[];
    technicalDepth: string;
    worthReading: string;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, index, onClick }) => {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    const handleSummarize = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (summary) {
            setExpanded(!expanded);
            return;
        }

        // Validate URL before attempting to fetch
        if (!article.link) {
            setError('Article has no valid link');
            return;
        }

        try {
            new URL(article.link);
        } catch {
            setError('Article has an invalid URL');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: article.link }),
            });

            if (res.ok) {
                const data = await res.json();
                setSummary(data);
                setExpanded(true);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to summarize');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            layoutId={`card-${article.link}`}
            onClick={onClick}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.4,
                delay: Math.min(index * 0.02, 0.2),
                ease: [0.28, 0, 0.21, 1]
            }}
            className="apple-card group cursor-pointer"
        >
            <div className="p-4 md:p-6 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                    <Hash className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                    <span className="type-caption text-[var(--color-text-tertiary)]">
                        {article.feedTitle}
                    </span>
                    {article.isoDate && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-[var(--color-text-tertiary)] opacity-40" />
                            <Calendar className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                            <span className="type-caption text-[var(--color-text-tertiary)]">
                                {new Date(article.isoDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        </>
                    )}
                </div>

                <h3 className="type-headline mb-3 text-[var(--color-text-primary)] line-clamp-3">
                    {article.title}
                </h3>

                <p className="type-subheadline text-[var(--color-text-secondary)] line-clamp-3 flex-grow">
                    {article.contentSnippet || article.content?.replace(/<[^>]*>?/gm, '').substring(0, 300)}
                </p>

                <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={handleSummarize}
                            disabled={loading}
                            className="type-footnote text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Summarizing...
                                </>
                            ) : summary ? (
                                <>
                                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    {expanded ? 'Hide' : 'Show'} Summary
                                </>
                            ) : (
                                <>
                                    Summarize
                                </>
                            )}
                        </button>
                        {article.link && (
                            <a
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="type-subheadline text-[var(--color-accent)] hover:opacity-70 transition-opacity inline-flex items-center gap-2 group"
                            >
                                Read article
                                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </a>
                        )}
                    </div>

                    {error && (
                        <p className="type-footnote text-[var(--color-error)]">{error}</p>
                    )}

                    <AnimatePresence>
                        {summary && expanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                className="space-y-4 pt-4 border-t border-[var(--border-subtle)]"
                            >
                                <div className="glass-card p-4 space-y-3">
                                    <div>
                                        <h4 className="type-caption text-[var(--color-text-tertiary)] mb-2">TL;DR</h4>
                                        <p className="type-subheadline text-[var(--color-text-primary)]">{summary.tldr}</p>
                                    </div>

                                    <div>
                                        <h4 className="type-caption text-[var(--color-text-tertiary)] mb-2">KEY POINTS</h4>
                                        <ul className="space-y-1.5">
                                            {summary.keyPoints.map((point, i) => (
                                                <li key={i} className="type-footnote text-[var(--color-text-secondary)] flex gap-2">
                                                    <span className="text-[var(--color-accent)] flex-shrink-0">•</span>
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-[var(--border-subtle)]">
                                        <div className="flex-1">
                                            <h4 className="type-caption text-[var(--color-text-tertiary)] mb-1">DEPTH</h4>
                                            <p className="type-footnote text-[var(--color-text-secondary)]">{summary.technicalDepth}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="type-caption text-[var(--color-text-tertiary)] mb-1">VERDICT</h4>
                                            <p className="type-footnote text-[var(--color-text-secondary)]">{summary.worthReading}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

