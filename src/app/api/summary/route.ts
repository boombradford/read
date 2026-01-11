import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function GET() {
    return NextResponse.json({ status: 'API is active' });
}

export async function POST(request: Request) {
    try {
        const { url, content: fallbackContent } = await request.json();

        if (!url && !fallbackContent) {
            return NextResponse.json({ error: 'Missing article data' }, { status: 400 });
        }

        let articleContent = '';
        let articleTitle = 'Article';

        // Try to fetch the full article if URL is provided
        if (url) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    },
                    signal: AbortSignal.timeout(8000), // Shorter timeout to fail fast
                });

                if (response.ok) {
                    const html = await response.text();
                    const $ = cheerio.load(html);
                    $('script, style, nav, footer, header, ads, iframe').remove();
                    articleContent = $('article, main, .content, .post-content, .article-body').text() || $('body').text();
                    articleContent = articleContent.replace(/\s+/g, ' ').trim();
                    articleTitle = $('title').text() || 'Article';
                }
            } catch (fetchError) {
                console.warn(`Fetch failed for ${url}, using fallback content`, fetchError);
            }
        }

        // If fetch failed or yielded too little content, use fallback
        if (articleContent.length < 200 && fallbackContent) {
            articleContent = fallbackContent;
            console.log('Using fallback content for summary');
        }

        if (articleContent.length < 50) {
            throw new Error('Insufficient content for analysis');
        }

        // Limit content to ~6000 words
        const words = articleContent.split(/\s+/);
        if (words.length > 5000) {
            articleContent = words.slice(0, 5000).join(' ') + '...';
        }

        const prompt = `You are a professional analyst. Summarize this article.
        
TITLE: ${articleTitle}
URL: ${url || 'N/A'}
CONTENT: ${articleContent}

CRITICAL: Return ONLY JSON.
{
  "tldr": "2-3 sentence summary",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "technicalDepth": "Level description",
  "worthReading": "One sentence verdict"
}`;

        const message = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1000,
            messages: [{ role: "user", content: prompt }],
        });

        const textContent = message.content[0].type === 'text' ? message.content[0].text : '';
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? jsonMatch[0] : textContent;
        const summary = JSON.parse(cleanJson);

        return NextResponse.json(summary);

    } catch (error: any) {
        console.error('Summary API Error:', error);
        return NextResponse.json({
            error: 'Failed to generate summary',
            details: error.message || String(error)
        }, { status: 500 });
    }
}
