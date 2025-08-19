import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;

        const businessId = resolvedParams.id;

        // Validate business ID format (UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(businessId)) {
            return NextResponse.json(
                { error: "Invalid business ID format" },
                { status: 400 }
            );
        }

        // Get business details with tags
        const businessQuery = `
      SELECT 
        b.name, 
        b.description, 
        b.address,
        b.website,
        bt.name as business_type_name,
        COALESCE(
          STRING_AGG(btags.tag, ', '), 
          ''
        ) as business_tags
      FROM businesses b
      LEFT JOIN business_types bt ON b.business_type_id = bt.id
      LEFT JOIN business_tags btags ON b.id = btags.business_id
      WHERE b.id = $1 AND b.status = 'active'
      GROUP BY b.id, b.name, b.description, b.address, b.website, bt.name
    `;

        const businessResult = await pool.query(businessQuery, [businessId]);

        if (businessResult.rows.length === 0) {
            return NextResponse.json(
                { error: "Business not found" },
                { status: 404 }
            );
        }

        const business = businessResult.rows[0];

        // Create prompt for AI feedback generation
        const prompt = `Generate a positive customer review feedback for the following business:

Business Name: ${business.name}
Business Type: ${business.business_type_name || 'Not specified'}
Business Tags: ${business.business_tags || 'None'}
Description: ${business.description || 'Not provided'}
Address: ${business.address || 'Not provided'}
Website: ${business.website || 'Not provided'}

Please generate a realistic, positive customer review that:
1. Has a funky yet professional tone - creative, engaging, and memorable
2. Uses modern, trendy language while maintaining professionalism
3. Mentions specific aspects of the business type and tags in a creative way
4. Is between 60-180 words
5. Includes specific details that would be relevant to this type of business
6. Uses expressions like "absolutely nailed it", "game-changer", "next level", "vibes are immaculate"
7. Balances enthusiasm with credibility
8. References the business tags in a natural, hip way
9. Sounds like it's written by someone who genuinely loves sharing great experiences

Generate only the review text, no additional formatting or quotes.`;

        // Call OpenRouter API
        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
                'X-Title': 'ReviewQR Feedback Generator'
            },
            body: JSON.stringify({
                model: 'anthropic/claude-sonnet-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a creative assistant that generates funky yet professional customer reviews for businesses. Your reviews should be engaging, modern, and authentic while maintaining credibility. Use trendy expressions and contemporary language that resonates with today\'s customers.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 200,
                temperature: 0.8
            })
        });

        if (!openRouterResponse.ok) {
            const errorData = await openRouterResponse.text();
            console.error('OpenRouter API error:', errorData);
            return NextResponse.json(
                { error: "Failed to generate feedback" },
                { status: 500 }
            );
        }

        const aiResponse = await openRouterResponse.json();
        const generatedFeedback = aiResponse.choices[0]?.message?.content?.trim();

        if (!generatedFeedback) {
            return NextResponse.json(
                { error: "No feedback generated" },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { feedback: generatedFeedback },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error generating AI feedback:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}