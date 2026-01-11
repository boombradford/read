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
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'Missing article URL' }, { status: 400 });
        }

        // Fetch the article
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Simple content extraction: remove scripts/styles and get main text
        $('script, style, nav, footer, header, ads').remove();
        let articleContent = $('article, main, .content, .post-content').text() || $('body').text();

        // Clean up whitespace
        articleContent = articleContent.replace(/\s+/g, ' ').trim();
        const articleTitle = $('title').text() || 'Article';

        // Limit content to ~6000 words
        const words = articleContent.split(/\s+/);
        if (words.length > 6000) {
            articleContent = words.slice(0, 6000).join(' ') + '...';
        }

        if (articleContent.length < 100) {
            throw new Error('Content too short');
        }

        const prompt = `You are a professional analyst. Summarize this article.
        
TITLE: ${articleTitle}
CONTENT: ${articleContent}

CRITICAL: Return ONLY JSON.
{
  "tldr": "2-3 sentence summary",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "technicalDepth": "Level description",
  "worthReading": "One sentence verdict"
}`;

        const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            messages: [{ role: "user", content: prompt }],
        });

        const textContent = message.content[0].type === 'text' ? message.content[0].text : '';
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? jsonMatch[0] : textContent;
        const summary = JSON.parse(cleanJson);

        return NextResponse.json(summary);

    } catch (error) {
        console.error('Extraction/Summary Error:', error);
        return NextResponse.json({ error: 'Failed to extract or summarize article' }, { status: 500 });
    }
}
