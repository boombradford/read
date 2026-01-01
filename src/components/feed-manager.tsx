'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFeedStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

const ModalPortal = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;
    return createPortal(children, document.body);
};

export const FeedManager = () => {
    const { subscriptions, addSubscription, removeSubscription, refreshFeeds } = useFeedStore();
    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddFeed = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/feed?url=${encodeURIComponent(url)}`);
            if (res.ok) {
                const data = await res.json();
                addSubscription({
                    id: crypto.randomUUID(),
                    url,
                    title: data.title || 'Unknown Feed',
                });
                setUrl('');
                refreshFeeds();
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to add feed.');
            }
        } catch {
            setError('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ModalPortal>
                {subscriptions.length > 0 && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-[9999] glass-effect text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-full shadow-lg transition-all type-subheadline font-medium min-h-[56px] min-w-[56px] px-6 py-3 md:min-h-0 md:min-w-0"
                        aria-label="Manage RSS feeds"
                        aria-haspopup="dialog"
                        aria-expanded={isOpen}
                    >
                        <span className="hidden sm:inline">Manage Feeds</span>
                        <span className="sm:hidden text-lg">⚙️</span>
                    </button>
                )}

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xl p-0 sm:p-6"
                            onClick={() => setIsOpen(false)}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="feed-manager-title"
                        >
                            <motion.div
                                initial={{ y: "100%", opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: "100%", opacity: 0 }}
                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                className="apple-modal w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center sticky top-0 bg-[var(--color-bg-elevated)] z-10 rounded-t-3xl sm:rounded-t-2xl">
                                    <h2 id="feed-manager-title" className="type-title text-[var(--color-text-primary)]">Feeds</h2>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="apple-button-secondary"
                                        aria-label="Close feed manager"
                                    >
                                        Close
                                    </button>
                                </div>

                                <div className="p-6 max-h-[70vh] sm:max-h-[600px] overflow-y-auto">
                                    <form onSubmit={handleAddFeed} className="flex flex-col gap-3 mb-6" aria-label="Add new RSS feed">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <input
                                                type="url"
                                                placeholder="https://example.com/feed"
                                                className="flex-1 apple-input"
                                                value={url}
                                                onChange={(e) => {
                                                    setUrl(e.target.value);
                                                    if (error) setError(null);
                                                }}
                                                disabled={loading}
                                                aria-label="RSS feed URL"
                                                aria-invalid={error ? "true" : "false"}
                                                aria-describedby={error ? "feed-error" : undefined}
                                                autoComplete="url"
                                            />
                                            <button
                                                type="submit"
                                                disabled={loading || !url}
                                                className="apple-button-primary sm:min-w-[100px]"
                                                aria-label={loading ? "Adding feed" : "Add feed"}
                                            >
                                                {loading ? 'Adding...' : 'Add'}
                                            </button>
                                        </div>
                                        {error && (
                                            <p id="feed-error" className="type-footnote text-[var(--color-error)] px-1" role="alert">
                                                {error}
                                            </p>
                                        )}
                                    </form>

                                    <div className="space-y-2" role="list" aria-label="Subscribed RSS feeds">
                                        {subscriptions.length === 0 ? (
                                            <p className="type-subheadline text-[var(--color-text-tertiary)] text-center py-10" role="status">No feeds yet</p>
                                        ) : (
                                            subscriptions.map((sub) => (
                                                <div key={sub.id} className="flex items-center justify-between p-4 bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-color)] transition-all group" role="listitem">
                                                    <div className="flex-1 min-w-0 mr-3">
                                                        <h4 className="type-subheadline font-medium text-[var(--color-text-primary)] truncate mb-1">{sub.title}</h4>
                                                        <p className="type-footnote text-[var(--color-text-tertiary)] truncate">{sub.url}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeSubscription(sub.id)}
                                                        className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] px-4 py-2 transition-colors sm:opacity-0 sm:group-hover:opacity-100 type-footnote min-h-[44px] rounded-lg hover:bg-[var(--color-error)]/10"
                                                        aria-label={`Remove ${sub.title} feed`}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="p-5 bg-[var(--color-bg-tertiary)] border-t border-[var(--border-subtle)] flex justify-end pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="apple-button-primary w-full sm:w-auto"
                                        aria-label="Close feed manager and return to main view"
                                    >
                                        Done
                                    </button>
                                </div>
                            </motion.div>

                        </motion.div>
                    )}
                </AnimatePresence>
            </ModalPortal>
        </>
    );
};


