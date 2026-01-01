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
                        className="fixed bottom-6 right-6 z-[9999] px-5 py-3 bg-[var(--color-bg-elevated)] border border-[var(--border-strong)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-full shadow-lg transition-all type-subheadline font-medium"
                        aria-label="Manage Feeds"
                    >
                        Manage Feeds
                    </button>
                )}

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xl p-6"
                            onClick={() => setIsOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.96, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.96, opacity: 0, y: 20 }}
                                transition={{ duration: 0.25, ease: [0.28, 0, 0.21, 1] }}
                                className="apple-modal"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
                                    <h2 className="type-title text-[var(--color-text-primary)]">Feeds</h2>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors text-sm"
                                    >
                                        Close
                                    </button>
                                </div>

                                <div className="p-6">
                                    <form onSubmit={handleAddFeed} className="flex flex-col gap-3 mb-6">
                                        <div className="flex gap-2">
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
                                            />
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="apple-button-primary min-w-[80px]"
                                            >
                                                {loading ? 'Adding...' : 'Add'}
                                            </button>
                                        </div>
                                        {error && (
                                            <p className="type-footnote text-[var(--color-error)] px-1">
                                                {error}
                                            </p>
                                        )}
                                    </form>

                                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                                        {subscriptions.length === 0 ? (
                                            <p className="type-subheadline text-[var(--color-text-tertiary)] text-center py-10">No feeds yet</p>
                                        ) : (
                                            subscriptions.map((sub) => (
                                                <div key={sub.id} className="flex items-center justify-between p-4 bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-color)] transition-colors group">
                                                    <div className="flex-1 min-w-0 mr-3">
                                                        <h4 className="type-subheadline font-medium text-[var(--color-text-primary)] truncate mb-1">{sub.title}</h4>
                                                        <p className="type-footnote text-[var(--color-text-tertiary)] truncate">{sub.url}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeSubscription(sub.id)}
                                                        className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] px-3 py-2 transition-colors opacity-0 group-hover:opacity-100 type-footnote"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="p-5 bg-[var(--color-bg-tertiary)] border-t border-[var(--border-subtle)] flex justify-end">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="apple-button-primary"
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


