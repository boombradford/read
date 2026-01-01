export interface Article {
    title: string;
    link: string;
    pubDate?: string;
    content?: string;
    contentSnippet?: string;
    isoDate?: string;
    categories?: string[];
}

export interface Feed {
    url: string;
    title?: string;
    description?: string;
    items: Article[];
    lastUpdated?: number;
}

export interface FeedSubscription {
    id: string; // UUID or simple ID
    url: string;
    title: string;
    category?: string;
}
