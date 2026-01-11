import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FeedSubscription, Article } from './types';

interface FeedStore {
    subscriptions: FeedSubscription[];
    articles: (Article & { feedTitle: string })[];
    addSubscription: (subscription: FeedSubscription) => void;
    removeSubscription: (id: string) => void;
    setArticles: (articles: (Article & { feedTitle: string })[]) => void;
    refreshFeeds: () => Promise<void>;
}

const DEFAULT_FEEDS: FeedSubscription[] = [
    { id: '1', title: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
    { id: '2', title: 'Hacker News', url: 'https://news.ycombinator.com/rss' },
    { id: '3', title: 'ArXiv AI', url: 'http://arxiv.org/rss/cs.AI' },
    { id: '4', title: 'Hugging Face', url: 'https://huggingface.co/blog/feed.xml' },
    { id: '5', title: 'BBC Tech', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
    { id: '6', title: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
    { id: '7', title: 'Wired', url: 'https://www.wired.com/feed/rss' },
    { id: '8', title: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
];

export const useFeedStore = create<FeedStore>()(
    persist(
        (set, get) => ({
            subscriptions: DEFAULT_FEEDS,
            articles: [],
            addSubscription: (subscription) =>
                set((state) => ({ subscriptions: [...state.subscriptions, subscription] })),
            removeSubscription: (id) =>
                set((state) => ({ subscriptions: state.subscriptions.filter((s) => s.id !== id) })),
            setArticles: (articles) => set({ articles }),
            refreshFeeds: async () => {
                const { subscriptions } = get();
                const cutoff = Date.now() - (48 * 60 * 60 * 1000); // 48 hours ago

                const results = await Promise.all(
                    subscriptions.map(async (sub) => {
                        try {
                            const res = await fetch(`/api/feed?url=${encodeURIComponent(sub.url)}`);
                            if (res.ok) {
                                const data = await res.json();
                                return data.items.map((item: Article) => ({
                                    ...item,
                                    feedTitle: sub.title,
                                })).filter((item: Article) => {
                                    const itemDate = new Date(item.isoDate || item.pubDate || 0).getTime();
                                    return itemDate > cutoff;
                                });
                            }
                        } catch (error) {
                            console.error(`Failed to fetch feed ${sub.url}`, error);
                        }
                        return [];
                    })
                );

                const allArticles = results.flat();

                // Sort by date descending
                allArticles.sort((a, b) => {
                    const dateA = new Date(a.isoDate || a.pubDate || 0).getTime();
                    const dateB = new Date(b.isoDate || b.pubDate || 0).getTime();
                    return dateB - dateA;
                });

                set({ articles: allArticles });
            },
        }),
        {
            name: 'rss-feed-storage-v2',
            partialize: (state) => ({ subscriptions: state.subscriptions }),
            skipHydration: false,
        }
    )
);
