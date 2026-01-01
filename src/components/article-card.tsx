import React from 'react';
import { motion } from 'framer-motion';
import { Article } from '@/lib/types';

interface ArticleCardProps {
    article: Article & { feedTitle: string };
    index: number;
    onClick?: () => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, index, onClick }) => {
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
            <div className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                    <span className="type-caption text-[var(--color-text-tertiary)]">
                        {article.feedTitle}
                    </span>
                    {article.isoDate && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-[var(--color-text-tertiary)] opacity-40" />
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

                <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
                    <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="type-subheadline text-[var(--color-accent)] hover:opacity-70 transition-opacity inline-block"
                    >
                        Read article
                    </a>
                </div>
            </div>
        </motion.div>
    );
};

