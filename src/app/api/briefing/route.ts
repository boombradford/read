import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { articles } = await request.json();

        if (!articles || !Array.isArray(articles)) {
            return NextResponse.json(
                { error: 'Missing articles to analyze' },
                { status: 400 }
            );
        }

        // Limit to top 10 stories to prevent token overflow
        const topArticles = articles.slice(0, 10).map((a: any) => `- ${a.title}: ${a.contentSnippet || a.content?.substring(0, 200)}`).join('\n');

        const prompt = `You are the Executive Editor of a premium tech magazine like Wired or The Verge. Create a morning briefing for creative professionals.

TASK:
- Read the headlines and snippets below
- Synthesize them into a cohesive narrative
- Identify the most significant trends or patterns
- Write in a sophisticated, insightful, and concise tone

WRITING QUALITY REQUIREMENTS:
- Use proper grammar, punctuation, and capitalization throughout
- Write in complete, well-structured sentences
- Organize the summary into 2-3 distinct paragraphs, each covering a related theme
- Use natural paragraph breaks (double newlines) to separate ideas
- Ensure smooth transitions between sentences and paragraphs
- Avoid bullet points or lists in the summary - use flowing prose instead
- The key_takeaway should be a single, punchy sentence with proper punctuation

CRITICAL: Return ONLY the JSON object below. No markdown code blocks, no explanatory text before or after. Just raw JSON with standard double quotes (").

Required JSON format:
{
  "greeting": "A short creative greeting - 2-4 words (examples: 'Rise and Shine', 'The Wednesday Brief', 'Digital Frontier')",
  "summary": "A 2-3 paragraph editorial synthesis of the key news. Separate paragraphs with double newlines (\\n\\n). Weave stories into a narrative where possible. Use high-quality, distinctive writing with proper grammar and punctuation. Be specific about what's happening and why it matters.",
  "key_takeaway": "One punchy sentence that captures today's tech world mood. Use proper capitalization and end punctuation."
}

Headlines and snippets:
${topArticles}

Return only JSON:`;

        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 1200,
            messages: [{ role: "user", content: prompt }],
        });

        const textContent = message.content[0].type === 'text' ? message.content[0].text : '';
        console.log("DEBUG: Raw Briefing Response:", textContent);

        let briefing;
        try {
            // Clean markdown formatting and fix curly quotes
            let cleanContent = textContent
                .replace(/```json\n?|\n?```/g, '')
                .replace(/[""]/g, '"')  // Replace curly quotes with straight quotes
                .replace(/['']/g, "'")  // Replace curly apostrophes
                .trim();

            briefing = JSON.parse(cleanContent);
        } catch (e) {
            console.error('Failed to parse AI briefing:', textContent, e);
            briefing = {
                greeting: "Good Morning",
                summary: "Here are your top stories for the day.",
                key_takeaway: "Stay curious."
            };
        }

        return NextResponse.json(briefing);

    } catch (error) {
        console.error('Error generating briefing:', error);
        return NextResponse.json(
            { error: 'Failed to generate briefing' },
            { status: 500 }
        );
    }
}
