"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeedStore } from '@/lib/store';
import { Lightbulb } from 'lucide-react';

interface Briefing {
    greeting: string;
    summary: string;
    key_takeaway: string;
}

export const BriefingView = () => {
    const { articles } = useFeedStore();
    const [briefing, setBriefing] = useState<Briefing | null>(null);
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateBriefing = async () => {
        if (articles.length === 0) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/briefing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ articles }),
            });
            if (res.ok) {
                const data = await res.json();
                setBriefing(data);
                setGenerated(true);
            } else {
                throw new Error('Failed to fetch briefing');
            }
        } catch (error) {
            console.error('Failed to generate briefing');
            setError('Could not curate briefing. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (articles.length === 0) return null;

    return (
        <div className="mb-16">
            {!generated ? (
                <div className="flex flex-col items-center justify-center gap-3">
                    <button
                        onClick={generateBriefing}
                        disabled={loading}
                        className="apple-button-primary disabled:opacity-30"
                    >
                        {loading ? 'Generating...' : 'Generate Briefing'}
                    </button>
                    {error && (
                        <span className="type-footnote text-[var(--color-error)]">{error}</span>
                    )}
                </div>
            ) : (
                <AnimatePresence>
                    {briefing && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: [0.28, 0, 0.21, 1] }}
                            className="w-full max-w-3xl mx-auto p-10 md:p-14 glass-card"
                        >
                            <div className="text-center mb-10">
                                <div className="mb-3">
                                    <span className="type-caption text-[var(--color-text-tertiary)]">
                                        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                                <h1 className="type-title-large text-[var(--color-text-primary)]">
                                    {briefing.greeting}
                                </h1>
                            </div>

                            <div className="max-w-2xl mx-auto space-y-5">
                                {briefing.summary.split('\n\n').map((para, i) => (
                                    <p key={i} className="type-body text-[var(--color-text-secondary)] leading-relaxed">
                                        {para}
                                    </p>
                                ))}

                                <div className="pt-8 mt-8 border-t border-[var(--border-subtle)] glass-card p-6">
                                    <div className="flex items-start gap-3">
                                        <Lightbulb className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0 mt-0.5" />
                                        <p className="type-subheadline text-[var(--color-text-primary)] italic flex-1">
                                            {briefing.key_takeaway}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
};
