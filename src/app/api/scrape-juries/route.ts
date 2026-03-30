import { NextRequest, NextResponse } from 'next/server';

// --- Types ---

interface ScrapeJuriesRequest {
  name: string;
  email: string;
  companyName: string;
  jobTitle: string;
}

interface ScrapeJuriesItem {
  eventName: string;
  year: string;
  role: string;
}

// --- Gemini API ---

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function buildPrompt(input: ScrapeJuriesRequest): string {
  return `You are a research assistant. Based on the following person's information, find any advertising/creative industry awards or jury experiences they may have participated in.

Person Information:
- Name: ${input.name}
- Email: ${input.email}
- Company: ${input.companyName}
- Job Title: ${input.jobTitle}

Search for their involvement in major advertising and creative awards shows such as:
- Cannes Lions
- D&AD
- One Show
- Clio Awards
- Spikes Asia
- AdFest
- New York Festivals
- London International Awards
- AWARD Awards
- Effie Awards
- Webby Awards
- And any other relevant industry awards

Return ONLY a valid JSON array of objects with this exact format (no markdown, no explanation, just the JSON array):
[
 {
 "eventName": "Name of the award show",
 "year": "2023",
 "role": "Jury Member"
 }
]

If no jury experiences are found, return an empty array: []

Important:
- Only include events where this person was actually a jury member, judge, or similar role
- The "year" field must be a string (e.g., "2023")
- The "role" field should describe their specific role (e.g., "Jury Member", "Jury President", "Grand Jury")
- Be accurate - do not fabricate information`;
}

async function callGeminiAPI(prompt: string, apiKey: string): Promise<ScrapeJuriesItem[]> {
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();

  // Extract text from Gemini response
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) {
    throw new Error('No content returned from Gemini API');
  }

  // Parse JSON from the response (handle potential markdown code blocks)
  const jsonString = textContent
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  const parsed = JSON.parse(jsonString);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.map((item: Record<string, string>) => ({
    eventName: String(item.eventName || ''),
    year: String(item.year || ''),
    role: String(item.role || ''),
  }));
}

// --- Route Handler ---

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'Gemini API key is not configured', data: [] },
        { status: 500 }
      );
    }

    const body: ScrapeJuriesRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.companyName || !body.jobTitle) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: name, companyName, jobTitle',
          data: [],
        },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(body);
    const results = await callGeminiAPI(prompt, apiKey);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error in scrape-juries API:', error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        data: [],
      },
      { status: 500 }
    );
  }
}
