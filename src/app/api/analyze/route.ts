import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { content } = await request.json();

        if (!content) {
            return NextResponse.json(
                { error: 'Missing content to analyze' },
                { status: 400 }
            );
        }

        // Limit content length to prevent token overflow/excessive costs
        const truncatedContent = content.substring(0, 15000);

        const prompt = `ROLE
You are a seasoned technologist who has shifted your focus over the last few years toward AI systems and how to leverage them responsibly in real workflows. You write from an expert's point of view—confident, practical, and a little nerdy when it helps clarity, but never overly technical or self-indulgent.

TASK
Write a short analysis about this article.
Audience: general consumers + business readers (non-technical leaders included).
Goal: help the reader understand what's happening, what matters, what's uncertain, and what to do next.

TONE + VOICE (must follow)
- Expert and authoritative, but conversational and approachable.
- Reassuring educator: simplify without condescension.
- Speak directly to the reader using "you/your" frequently.
- Balance urgency with calm, practical guidance—never alarmist.
- Clearly separate what's known vs unknown; acknowledge uncertainty without wobbling.

NON-NEGOTIABLE VOICE PRINCIPLES
- "This is important, but don't panic."
- "Here's what this means for you specifically."
- "The fundamentals still matter most."
- "Understanding this helps you make better decisions."

STRUCTURE (must follow exactly)
1) SUMMARY (2-3 sentences)
   - What happened and why it matters now.
   - Establish stakes for both everyday users and businesses.

2) KEY INSIGHT (3-4 sentences)
   - The non-obvious angle most people will miss.
   - What's changed vs what hasn't changed.
   - Connect to broader trends.
   - Include one concrete example or analogy.

3) TECHNICAL CONTEXT (2-3 sentences, optional but preferred)
   - The nerdy details that help understand the deeper mechanics.
   - Explain the "how" without jargon overload.
   - Only include if it adds meaningful clarity.

4) PRACTICAL TAKEAWAYS (exactly 5 bullets)
   - Specific, actionable insights with concrete examples.
   - No generic advice or buzzwords.
   - Focus on what the reader should do or understand differently.
   - Mix of immediate actions and longer-term strategic thinking.

5) WHAT TO WATCH (2-3 sentences)
   - Forward-looking: what developments or signals to monitor.
   - Expert prediction or trend to track.
   - Help reader stay ahead of the curve.

LANGUAGE + STYLE RULES
- Keep sentences concise (aim for ~15–25 words on average).
- Use active voice and present tense primarily.
- Avoid jargon. If you must use a technical term, define it in plain language immediately.
- Use specific examples rather than vague generalizations.
- Emphasize long-term fundamentals over trendy tactics.
- Frame change as evolution, not revolution.

FACTUALITY + INTEGRITY
- Do not invent statistics or quotes.
- Explicitly flag uncertainty where appropriate ("We don't know X yet, but we do know Y.").

CRITICAL: Return ONLY the JSON object below. No markdown code blocks, no explanatory text, no extra formatting. Just the raw JSON with standard double quotes.

Required JSON format:
{
  "summary": "2-3 sentences about what happened and why it matters. Speak directly to the reader.",
  "insight": "3-4 sentences explaining the non-obvious angle. What's changed vs what hasn't. Include concrete example or analogy.",
  "technicalContext": "2-3 sentences with nerdy details that add clarity. Explain the how. Omit empty string if not applicable.",
  "takeaways": [
    "First specific, actionable takeaway with concrete example",
    "Second specific, actionable takeaway with concrete example",
    "Third specific, actionable takeaway with concrete example",
    "Fourth specific, actionable takeaway with concrete example",
    "Fifth specific, actionable takeaway with concrete example"
  ],
  "whatToWatch": "2-3 sentences about what to monitor going forward. Expert prediction or trend to track."
}

Article to analyze:
${truncatedContent}

Return only JSON:`;

        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 3000,
            messages: [{ role: "user", content: prompt }],
        });

        // Parse the response
        // Types for message.content are a bit complex, we safely access the text
        const textContent = message.content[0].type === 'text' ? message.content[0].text : '';
        console.log("DEBUG: Raw AI Response", textContent);

        let analysis;
        try {
            // Clean markdown formatting and fix curly quotes
            let cleanContent = textContent
                .replace(/```json\n?|\n?```/g, '')
                .replace(/[""]/g, '"')  // Replace curly quotes with straight quotes
                .replace(/['']/g, "'")  // Replace curly apostrophes
                .trim();

            analysis = JSON.parse(cleanContent);
        } catch (e) {
            console.error('Failed to parse AI response:', textContent, e);
            // Fallback if JSON parsing fails
            analysis = {
                summary: "Could not parse AI summary.",
                insight: "Analysis failed.",
                technicalContext: "",
                takeaways: [],
                whatToWatch: ""
            };
        }

        return NextResponse.json(analysis);

    } catch (error) {
        console.error('Error analyzing article:', error);
        return NextResponse.json(
            { error: 'Failed to analyze article' },
            { status: 500 }
        );
    }
}
