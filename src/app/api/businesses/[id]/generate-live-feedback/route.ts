import { NextRequest, NextResponse } from "next/server";

// Language validation function
function validateLanguage(text: string, expectedLanguage: string): boolean {
  // Basic language detection patterns
  const patterns = {
    english: /^[a-zA-Z0-9\s.,!?'"()-]+$/,
    hindi: /[\u0900-\u097F]/,
    gujarati: /[\u0A80-\u0AFF]/
  };

  const pattern = patterns[expectedLanguage as keyof typeof patterns];
  if (!pattern) return true; // If no pattern, assume valid

  if (expectedLanguage === 'english') {
    // For English, check that it doesn't contain Hindi or Gujarati characters
    return !patterns.hindi.test(text) && !patterns.gujarati.test(text);
  } else {
    // For Hindi/Gujarati, check that it contains the expected script
    return pattern.test(text);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const businessId = resolvedParams.id;
    const { language, businessName, businessType, businessTags } = await request.json();

    // Validate business ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(businessId)) {
      return NextResponse.json(
        { error: "Invalid business ID format" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!language || !businessName) {
      return NextResponse.json(
        { error: "Language and business name are required" },
        { status: 400 }
      );
    }

    // Create explicit language-specific prompts
    const languagePrompts = {
      english: `You must respond ONLY in English. Write a short, natural customer review for ${businessName}${businessType ? ` (${businessType})` : ''}${businessTags ? ` focusing on: ${businessTags}` : ''}. Use casual language like "really good", "definitely recommend". Maximum 2 sentences. IMPORTANT: Respond only in English language.`,

      hindi: `आपको केवल हिंदी में जवाब देना है। ${businessName}${businessType ? ` (${businessType})` : ''} के लिए एक छोटी, प्राकृतिक ग्राहक समीक्षा लिखें${businessTags ? ` इन पर ध्यान दें: ${businessTags}` : ''}। आकस्मिक भाषा का उपयोग करें जैसे "वाकई अच्छा", "बिल्कुल सुझाऊंगा"। अधिकतम 2 वाक्य। महत्वपूर्ण: केवल हिंदी भाषा में जवाब दें।`,

      gujarati: `તમારે ફક્ત ગુજરાતીમાં જવાબ આપવો જોઈએ। ${businessName}${businessType ? ` (${businessType})` : ''} માટે એક ટૂંકી, કુદરતી ગ્રાહક સમીક્ષા લખો${businessTags ? ` આના પર ધ્યાન આપો: ${businessTags}` : ''}। કેઝ્યુઅલ ભાષાનો ઉપયોગ કરો જેવા કે "ખરેખર સારું", "બિલકુલ ભલામણ કરું"। મહત્તમ 2 વાક્યો। મહત્વપૂર્ણ: ફક્ત ગુજરાતી ભાષામાં જવાબ આપો।`
    };

    const prompt = languagePrompts[language as keyof typeof languagePrompts];

    if (!prompt) {
      return NextResponse.json(
        { error: "Unsupported language" },
        { status: 400 }
      );
    }

    // Call OpenRouter API with timeout for faster response
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'SnapReview.ai Feedback Generator'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini', // Better multilingual support, still fast
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that generates customer reviews. You must respond ONLY in the requested language. Do not mix languages or provide translations.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 100, // Slightly increased for better quality
        top_p: 0.9,
        frequency_penalty: 0.4,
        presence_penalty: 0.3
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.text();
      console.error('OpenRouter API error:', errorData);
      throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
    }

    const data = await openRouterResponse.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenRouter API');
    }

    const generatedFeedback = data.choices[0].message.content.trim();

    // Clean up the feedback (remove quotes, extra formatting)
    const cleanFeedback = generatedFeedback
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();

    // Language validation - check if response is in correct language
    const isValidLanguage = validateLanguage(cleanFeedback, language);

    if (!isValidLanguage) {
      // If language validation fails, use template fallback
      throw new Error('Generated content not in requested language');
    }

    return NextResponse.json(
      { feedback: cleanFeedback },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error generating live feedback:", error);

    // Smart fallback with template variations
    const { language, businessName } = await request.json().catch(() => ({
      language: 'english',
      businessName: 'this business'
    }));

    // Generate quick template-based feedback with more variety
    const templates = {
      english: [
        `Really impressed with ${businessName}! Great quality and excellent service.`,
        `Amazing experience at ${businessName}. Staff was super helpful and professional.`,
        `Love shopping at ${businessName}! Quality products and friendly service.`,
        `Outstanding service at ${businessName}. Definitely recommend to everyone!`,
        `Excellent quality at ${businessName}. Will definitely be coming back soon!`,
        `Great experience with ${businessName}. Really satisfied with their service.`,
        `Fantastic service at ${businessName}! Exceeded all my expectations completely.`,
        `Highly recommend ${businessName}. Great quality and reasonable prices too.`
      ],
      hindi: [
        `${businessName} से वाकई खुश हूं! बहुत अच्छी क्वालिटी और सेवा।`,
        `${businessName} में शानदार अनुभव। स्टाफ बहुत मददगार और प्रोफेशनल था।`,
        `${businessName} में खरीदारी करना पसंद है! अच्छे प्रोडक्ट्स और फ्रेंडली सर्विस।`,
        `${businessName} में बेहतरीन सेवा। सभी को जरूर सुझाऊंगा!`,
        `${businessName} में उत्कृष्ट क्वालिटी। निश्चित रूप से जल्द वापस आऊंगा!`,
        `${businessName} के साथ बहुत अच्छा अनुभव। उनकी सेवा से खुश हूं।`,
        `${businessName} में शानदार सेवा! मेरी उम्मीदों से कहीं बेहतर।`,
        `${businessName} की बहुत सिफारिश करता हूं। अच्छी क्वालिटी और उचित दाम।`
      ],
      gujarati: [
        `${businessName} થી ખરેખર ખુશ છું! ખૂબ સારી ક્વોલિટી અને સેવા.`,
        `${businessName} માં શાનદાર અનુભવ। સ્ટાફ ખૂબ મદદગાર અને પ્રોફેશનલ હતો.`,
        `${businessName} માં ખરીદારી કરવાનું ગમે છે! સારા પ્રોડક્ટ્સ અને ફ્રેન્ડલી સર્વિસ.`,
        `${businessName} માં બેહતરીન સેવા। બધાને જરૂર સૂચવીશ!`,
        `${businessName} માં ઉત્કૃષ્ટ ક્વોલિટી। ચોક્કસ જલ્દી પાછા આવીશ!`,
        `${businessName} સાથે ખૂબ સારો અનુભવ। તેમની સેવાથી ખુશ છું.`,
        `${businessName} માં શાનદાર સેવા! મારી અપેક્ષાઓ કરતાં વધુ સારું.`,
        `${businessName} ની ખૂબ ભલામણ કરું છું. સારી ક્વોલિટી અને વાજબી ભાવ.`
      ]
    };

    const languageTemplates = templates[language as keyof typeof templates] || templates.english;
    const randomTemplate = languageTemplates[Math.floor(Math.random() * languageTemplates.length)];

    return NextResponse.json(
      { feedback: randomTemplate },
      { status: 200 }
    );
  }
}