import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import Anthropic from '@anthropic-ai/sdk';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

interface SummaryResponse {
    tldr: string;
    keyPoints: string[];
    technicalDepth: string;
    worthReading: string;
}

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { error: 'Missing article URL' },
                { status: 400 }
            );
        }

        // Fetch the article
        let articleContent: string;
        let articleTitle: string;

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
                signal: AbortSignal.timeout(10000), // 10 second timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const html = await response.text();

            // Use Readability to extract main content
            const dom = new JSDOM(html, { url });
            const reader = new Readability(dom.window.document);
            const article = reader.parse();

            if (!article || !article.textContent) {
                throw new Error('Could not extract article content');
            }

            articleContent = article.textContent;
            articleTitle = article.title || 'Article';

            // Limit content to ~8000 words to avoid token limits
            const words = articleContent.split(/\s+/);
            if (words.length > 8000) {
                articleContent = words.slice(0, 8000).join(' ') + '...';
            }

        } catch (error) {
            console.error('Failed to fetch article:', error);
            return NextResponse.json(
                { error: 'Could not fetch article content. It may be behind a paywall or unavailable.' },
                { status: 400 }
            );
        }

        // Generate AI summary
        const prompt = `You are analyzing an article for a busy professional. Provide a structured analysis.

ARTICLE TITLE: ${articleTitle}

ARTICLE CONTENT:
${articleContent}

CRITICAL: Return ONLY the JSON object below. No markdown code blocks, no explanatory text. Just raw JSON with standard double quotes (").

Required JSON format:
{
  "tldr": "2-3 sentence summary capturing the main point and why it matters",
  "keyPoints": ["First key point", "Second key point", "Third key point"],
  "technicalDepth": "One of: 'Beginner-friendly overview', 'Intermediate - some technical knowledge helpful', 'Advanced - requires domain expertise', 'Research-level - highly technical'",
  "worthReading": "One sentence honest assessment of whether this is worth the reader's time and why"
}

Return only JSON:`;

        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 1500,
            messages: [{ role: "user", content: prompt }],
        });

        const textContent = message.content[0].type === 'text' ? message.content[0].text : '';
        console.log("DEBUG: Raw Summary Response:", textContent);

        let summary: SummaryResponse;
        try {
            // Clean markdown formatting and fix curly quotes
            let cleanContent = textContent
                .replace(/```json\n?|\n?```/g, '')
                .replace(/[""]/g, '"')
                .replace(/['']/g, "'")
                .trim();

            summary = JSON.parse(cleanContent);
        } catch (e) {
            console.error('Failed to parse AI summary:', textContent, e);
            return NextResponse.json(
                { error: 'Failed to generate summary' },
                { status: 500 }
            );
        }

        return NextResponse.json(summary);

    } catch (error) {
        console.error('Error generating summary:', error);
        return NextResponse.json(
            { error: 'Failed to generate summary' },
            { status: 500 }
        );
    }
}
