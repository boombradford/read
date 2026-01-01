import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    try {
        const feed = await parser.parseURL(url);
        // Return cleaned data
        const cleanedFeed = {
            title: feed.title,
            description: feed.description,
            link: feed.link,
            items: feed.items.map((item) => ({
                title: item.title,
                link: item.link,
                pubDate: item.pubDate,
                content: item.content,
                contentSnippet: item.contentSnippet,
                isoDate: item.isoDate,
                categories: item.categories,
            })),
        };

        return NextResponse.json(cleanedFeed);
    } catch (error) {
        console.error('Error fetching feed:', error);
        return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
    }
}
