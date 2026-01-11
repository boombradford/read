import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({ status: 'API is active (Minimal Mode)' });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        return NextResponse.json({
            tldr: "Minimal summary mode active for debugging.",
            keyPoints: ["Point 1", "Point 2", "Point 3"],
            technicalDepth: "Basic",
            worthReading: "Yes, for debugging purposes.",
            receivedUrl: body.url
        });
    } catch (error) {
        return NextResponse.json({ error: 'Minimal mode error' }, { status: 500 });
    }
}
