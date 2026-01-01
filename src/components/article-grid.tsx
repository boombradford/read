'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeedStore } from '@/lib/store';
import { ArticleCard } from './article-card';
import { ArticleDetail } from './article-detail';
import { Article } from '@/lib/types';
import { RefreshCw, Plus, Rss } from 'lucide-react';

type ExtendedArticle = Article & { feedTitle: string };

export const ArticleGrid = () => {
    const { articles, refreshFeeds, subscriptions, addSubscription } = useFeedStore();
    const [columns, setColumns] = useState(1);
    const [refreshing, setRefreshing] = useState(false);
    const [feedUrl, setFeedUrl] = useState('');
    const [addingFeed, setAddingFeed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<ExtendedArticle | null>(null);

    // Responsive columns
    useEffect(() => {
        const updateColumns = () => {
            if (window.innerWidth >= 1280) setColumns(4);
            else if (window.innerWidth >= 1024) setColumns(3);
            else if (window.innerWidth >= 768) setColumns(2);
            else setColumns(1);
        };

        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    // Initial fetch
    useEffect(() => {
        if (subscriptions.length > 0 && articles.length === 0) {
            refreshFeeds();
        }
    }, [subscriptions.length, articles.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleRefresh = async () => {
        setRefreshing(true);
        await refreshFeeds();
        setRefreshing(false);
    };

    const handleAddFeed = async (urlOverride?: string) => {
        const urlToUse = urlOverride || feedUrl;
        if (!urlToUse) return;

        setAddingFeed(true);
        setError(null);
        try {
            const res = await fetch(`/api/feed?url=${encodeURIComponent(urlToUse)}`);
            if (res.ok) {
                const data = await res.json();
                addSubscription({
                    id: crypto.randomUUID(),
                    url: urlToUse,
                    title: data.title || 'Unknown Feed',
                });
                setFeedUrl('');
                refreshFeeds();
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to add feed. Please check the URL.');
            }
        } catch {
            setError('Unable to reach the server. Please try again later.');
        } finally {
            setAddingFeed(false);
        }
    };

    const handleQuickAdd = (url: string) => {
        setFeedUrl(url);
        handleAddFeed(url);
    };

    if (subscriptions.length === 0) {
        return (
            <div className="max-w-2xl mx-auto px-6 py-32 md:py-40">
                <div className="text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.28, 0, 0.21, 1] }}
                        className="type-display text-[var(--color-text-primary)] mb-4"
                    >
                        Your Feed
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1, ease: [0.28, 0, 0.21, 1] }}
                        className="type-body text-[var(--color-text-secondary)] mb-12"
                    >
                        A private, disciplined way to follow the stories you care about.
                    </motion.p>

                    <motion.form
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: [0.28, 0, 0.21, 1] }}
                        onSubmit={(e) => { e.preventDefault(); handleAddFeed(); }}
                        className="flex flex-col gap-3 max-w-lg mx-auto"
                    >
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="url"
                                placeholder="https://example.com/feed"
                                value={feedUrl}
                                onChange={(e) => {
                                    setFeedUrl(e.target.value);
                                    if (error) setError(null);
                                }}
                                disabled={addingFeed}
                                className="flex-grow apple-input"
                            />
                            <button
                                type="submit"
                                disabled={addingFeed || !feedUrl}
                                className="apple-button-primary min-w-[100px] flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                {addingFeed ? 'Adding...' : 'Add Feed'}
                            </button>
                        </div>
                        {error && (
                            <p className="type-footnote text-[var(--color-error)] px-1">
                                {error}
                            </p>
                        )}
                    </motion.form>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="mt-16 pt-10 border-t border-[var(--border-subtle)]"
                    >
                        <p className="type-caption text-[var(--color-text-tertiary)] mb-4">Suggestions</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {[
                                { name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
                                { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
                                { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' }
                            ].map((preset) => (
                                <button
                                    key={preset.url}
                                    onClick={() => handleQuickAdd(preset.url)}
                                    disabled={addingFeed}
                                    className="type-footnote text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)] px-4 py-2 rounded-lg border border-[var(--border-color)] transition-all"
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }


    if (articles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] py-24">
                <div className="w-8 h-8 border-2 border-[var(--color-text-tertiary)] border-t-[var(--color-accent)] rounded-full animate-spin"></div>
            </div>
        );
    }

    // Distribute articles into columns for Masonry style
    const columnBuckets = Array.from({ length: columns }, () => [] as typeof articles);
    articles.forEach((article, i) => {
        columnBuckets[i % columns].push(article);
    });

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-8">
            <header className="flex justify-between items-center mb-10 pb-6 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center glass-card">
                        <Rss className="w-6 h-6 text-[var(--color-accent)]" />
                    </div>
                    <div>
                        <h1 className="type-title text-[var(--color-text-primary)] mb-1">Recent</h1>
                        <p className="type-footnote text-[var(--color-text-secondary)]">
                            {subscriptions.length} {subscriptions.length === 1 ? 'source' : 'sources'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className={`px-4 py-2 rounded-lg transition-all type-subheadline text-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)] flex items-center gap-2 ${refreshing ? 'opacity-50' : ''}`}
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
            </header>

            <div className="flex gap-6">
                {columnBuckets.map((bucket, colIndex) => (
                    <div key={colIndex} className="flex-1 flex flex-col gap-6">
                        {bucket.map((article, index) => (
                            <ArticleCard
                                key={`${article.link}-${index}`}
                                article={article}
                                index={index}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};
