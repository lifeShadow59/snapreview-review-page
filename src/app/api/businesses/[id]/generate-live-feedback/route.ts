import { NextRequest, NextResponse } from "next/server";

// Language validation function
function validateLanguage(text: string, expectedLanguage: string): boolean {
  // Basic language detection patterns
  const patterns = {
    english: /^[a-zA-Z0-9\s.,!?'"()-]+$/,
    en: /^[a-zA-Z0-9\s.,!?'"()-]+$/,
    hindi: /[\u0900-\u097F]/,
    hi: /[\u0900-\u097F]/,
    gujarati: /[\u0A80-\u0AFF]/,
    gu: /[\u0A80-\u0AFF]/
  };

  const pattern = patterns[expectedLanguage as keyof typeof patterns];
  if (!pattern) return true; // If no pattern, assume valid

  if (expectedLanguage === 'english' || expectedLanguage === 'en') {
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
  // Read and parse request body once at the beginning
  let requestBody;
  let bodyText = '';
  
  try {
    bodyText = await request.text();
    if (!bodyText || bodyText.trim() === '') {
      return NextResponse.json(
        { error: "Request body is empty" },
        { status: 400 }
      );
    }
    requestBody = JSON.parse(bodyText);
  } catch (parseError) {
    console.error("JSON parsing error:", parseError);
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  try {
    const resolvedParams = await params;
    const businessId = resolvedParams.id;
    const { language, language_code, businessName, businessType, businessTags } = requestBody;
    console.log("Received request body:", requestBody);
    
    // Support both old 'language' and new 'language_code' parameters for backward compatibility
    const selectedLanguage = language_code || language;

    // Validate business ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(businessId)) {
      return NextResponse.json(
        { error: "Invalid business ID format" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!selectedLanguage || !businessName) {
      return NextResponse.json(
        { error: "Language and business name are required" },
        { status: 400 }
      );
    }

    // Create human-like, natural language prompts for 2-4 sentences
    const languagePrompts: Record<string, string> = {
      english: `Write a genuine, human customer review for ${businessName}${businessType ? ` (${businessType})` : ''}${businessTags ? ` focusing on: ${businessTags}` : ''}. Make it sound like a real person wrote it - use natural language, personal experiences, and specific details. Write 1-3 sentences. Be conversational and authentic. Don't make it sound AI-generated. Use varied sentence structures and personal touches like "I went there last week", "in some feedback add location related details like, near by or at walking distance for services based comapany". IMPORTANT: Write ONLY in English.`,
      en: `Write a genuine, human customer review for ${businessName}${businessType ? ` (${businessType})` : ''}${businessTags ? ` focusing on: ${businessTags}` : ''}. Make it sound like a real person wrote it - use natural language, personal experiences, and specific details. Write 1-3 sentences. Be conversational and authentic. Don't make it sound AI-generated. Use varied sentence structures and personal touches like "I went there last week", "in some feedback add location related details like, near by or at walking distance for services based comapany". IMPORTANT: Write ONLY in English.`,

      hindi: `${businessName}${businessType ? ` (${businessType})` : ''} के लिए एक सच्ची, मानवीय ग्राहक समीक्षा लिखें${businessTags ? ` इन पर ध्यान दें: ${businessTags}` : ''}। इसे ऐसे लिखें जैसे कोई वास्तविक व्यक्ति ने लिखा हो - प्राकृतिक भाषा, व्यक्तिगत अनुभव और विशिष्ट विवरण का उपयोग करें। 2-4 वाक्य लिखें। बातचीत की तरह और प्रामाणिक हों। इसे AI द्वारा बनाया गया न लगने दें। विविध वाक्य संरचनाओं और व्यक्तिगत स्पर्श का उपयोग करें जैसे "मैं पिछले हफ्ते वहां गया था" या "मेरे परिवार को यह जगह पसंद है"। महत्वपूर्ण: केवल हिंदी में लिखें।`,
      hi: `${businessName}${businessType ? ` (${businessType})` : ''} के लिए एक सच्ची, मानवीय ग्राहक समीक्षा लिखें${businessTags ? ` इन पर ध्यान दें: ${businessTags}` : ''}। इसे ऐसे लिखें जैसे कोई वास्तविक व्यक्ति ने लिखा हो - प्राकृतिक भाषा, व्यक्तिगत अनुभव और विशिष्ट विवरण का उपयोग करें। 2-4 वाक्य लिखें। बातचीत की तरह और प्रामाणिक हों। इसे AI द्वारा बनाया गया न लगने दें। विविध वाक्य संरचनाओं और व्यक्तिगत स्पर्श का उपयोग करें जैसे "मैं पिछले हफ्ते वहां गया था" या "मेरे परिवार को यह जगह पसंद है"। महत्वपूर्ण: केवल हिंदी में लिखें।`,

      gujarati: `${businessName}${businessType ? ` (${businessType})` : ''} માટે એક સાચી, માનવીય ગ્રાહક સમીક્ષા લખો${businessTags ? ` આના પર ધ્યાન આપો: ${businessTags}` : ''}। તેને એવી રીતે લખો જાણે કોઈ વાસ્તવિક વ્યક્તિએ લખ્યું હોય - કુદરતી ભાષા, વ્યક્તિગત અનુભવો અને વિશિષ્ટ વિગતોનો ઉપયોગ કરો। 2-4 વાક્યો લખો। વાતચીત જેવું અને પ્રામાણિક બનાવો। તેને AI દ્વારા બનાવેલું ન લાગવા દો। વિવિધ વાક્ય રચનાઓ અને વ્યક્તિગત સ્પર્શનો ઉપયોગ કરો જેવા કે "હું ગયા અઠવાડિયે ત્યાં ગયો હતો" અથવા "મારા પરિવારને આ જગ્યા ગમે છે"। મહત્વપૂર્ણ: ફક્ત ગુજરાતીમાં લખો।`,
      gu: `${businessName}${businessType ? ` (${businessType})` : ''} માટે એક સાચી, માનવીય ગ્રાહક સમીક્ષા લખો${businessTags ? ` આના પર ધ્યાન આપો: ${businessTags}` : ''}। તેને એવી રીતે લખો જાણે કોઈ વાસ્તવિક વ્યક્તિએ લખ્યું હોય - કુદરતી ભાષા, વ્યક્તિગત અનુભવો અને વિશિષ્ટ વિગતોનો ઉપયોગ કરો। 2-4 વાક્યો લખો। વાતચીત જેવું અને પ્રામાણિક બનાવો। તેને AI દ્વારા બનાવેલું ન લાગવા દો। વિવિધ વાક્ય રચનાઓ અને વ્યક્તિગત સ્પર્શનો ઉપયોગ કરો જેવા કે "હું ગયા અઠવાડિયે ત્યાં ગયો હતો" અથવા "મારા પરિવારને આ જગ્યા ગમે છે"। મહત્વપૂર્ણ: ફક્ત ગુજરાતીમાં લખો।`
    };

    const prompt = languagePrompts[selectedLanguage];

    if (!prompt) {
      return NextResponse.json(
        { error: "Unsupported language" },
        { status: 400 }
      );
    }

    // Build messages array for chat APIs
    const messages = [
      { role: 'system', content: 'You are a real customer writing an authentic review. Keep responses 2-4 sentences, conversational and natural.' },
      { role: 'user', content: `Please write a human-like customer review for ${businessName}${businessType ? ` (${businessType})` : ''}${businessTags ? ` focusing on: ${businessTags}` : ''}. ${prompt}` }
    ];

    // Call OpenRouter API with timeout for faster response
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout to allow API to respond

    // Use OpenRouter iff an API key is explicitly configured; otherwise use OpenAI.
    // This comments out the old OpenRouter request and substitutes an OpenAI call.
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    if (openRouterApiKey) {
      // Make a request to OpenRouter and extract generated text
      const openRouterResp = await fetch('https://api.openrouter.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: 'openai/gpt-4o-mini', messages, stream: false }),
        signal: controller.signal
      });

      if (!openRouterResp.ok) {
        const errText = await openRouterResp.text();
        console.error('OpenRouter API error:', errText);
        throw new Error(`OpenRouter API error: ${openRouterResp.status}`);
      }

      const data = await openRouterResp.json();
      const generatedFeedback = (data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? '').trim();

      // Clean up the feedback (remove quotes, extra formatting)
      const cleanFeedback = String(generatedFeedback)
        .replace(/^['"]|['"]$/g, '') // Remove surrounding quotes
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .trim();

      // Language validation - check if response is in correct language
      const isValidLanguage = validateLanguage(cleanFeedback, selectedLanguage);

      if (!isValidLanguage || !cleanFeedback) {
        throw new Error('Generated content not in requested language');
      }

      return NextResponse.json(
        { feedback: cleanFeedback },
        { status: 200 }
      );

    } else {
      // Use OpenAI when OpenRouter credentials are not provided
      const openAiKey = process.env.OPENAI_API;
      if (!openAiKey) {
        console.error('No OpenAI key found in environment (process.env.OPENAI_API).');
        throw new Error('No OpenAI API key configured');
      }

      const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // adjust model as needed
          messages, // reuse messages constructed earlier in this file
          max_tokens: 800,
          temperature: 0.7,
          stream: false
        })
      });

      if (!openaiResp.ok) {
        const errText = await openaiResp.text();
        console.error('OpenAI API error:', errText);
        throw new Error(`OpenAI API error: ${openaiResp.status}`);
      }

      const data = await openaiResp.json();
      // Map OpenAI response to the same structure the rest of the handler expects.
      // If prior code used `data.choices[0].message.content`, keep that mapping.
      const generatedText = data?.choices?.[0]?.message?.content ?? '';

      // Clean up the feedback (remove quotes, extra formatting)
      const cleanFeedback = generatedText
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .trim();

      // Language validation - check if response is in correct language
      const isValidLanguage = validateLanguage(cleanFeedback, selectedLanguage);

      if (!isValidLanguage) {
        // If language validation fails, use template fallback
        throw new Error('Generated content not in requested language');
      }

      return NextResponse.json(
        { feedback: cleanFeedback },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error("Error generating live feedback:", error);

    // Use already parsed request body for fallback
    const fallbackData = {
      language: requestBody?.language || 'english',
      language_code: requestBody?.language_code || 'en',
      businessName: requestBody?.businessName || 'this business'
    };
    
    const { language, language_code, businessName } = fallbackData;
    
    const fallbackLanguage = language_code || language;

    // Generate human-like template-based feedback with more variety (2-4 sentences)
    const templates: Record<string, string[]> = {
      english: [
        `Visited ${businessName} last weekend and was blown away! The staff went above and beyond to help me find exactly what I needed. Definitely my new go-to spot.`,
        `I've been to ${businessName} several times now and they never disappoint. The quality is consistently excellent and the service is always friendly. My whole family loves coming here.`,
        `Had such a great experience at ${businessName} yesterday. The team was incredibly knowledgeable and made me feel welcome from the moment I walked in. Will definitely be back soon!`,
        `${businessName} exceeded all my expectations! I was hesitant at first but the reviews were right - this place is amazing. The attention to detail really shows in everything they do.`,
        `Been a customer of ${businessName} for months now and they keep getting better. The staff remembers my preferences and always makes great recommendations. Couldn't be happier with the service.`,
        `Stumbled upon ${businessName} by accident and what a pleasant surprise! The atmosphere is welcoming and the quality is top-notch. Already planning my next visit.`,
        `${businessName} has become my favorite place in the area. Every visit feels personal and the team genuinely cares about customer satisfaction. Highly recommend to anyone looking for quality service.`,
        `Took my friends to ${businessName} last week and we all had an incredible time. The service was prompt, the quality was excellent, and the prices were very reasonable. We'll definitely be regulars now!`
      ],
      en: [
        `Visited ${businessName} last weekend and was blown away! The staff went above and beyond to help me find exactly what I needed. Definitely my new go-to spot.`,
        `I've been to ${businessName} several times now and they never disappoint. The quality is consistently excellent and the service is always friendly. My whole family loves coming here.`,
        `Had such a great experience at ${businessName} yesterday. The team was incredibly knowledgeable and made me feel welcome from the moment I walked in. Will definitely be back soon!`,
        `${businessName} exceeded all my expectations! I was hesitant at first but the reviews were right - this place is amazing. The attention to detail really shows in everything they do.`,
        `Been a customer of ${businessName} for months now and they keep getting better. The staff remembers my preferences and always makes great recommendations. Couldn't be happier with the service.`,
        `Stumbled upon ${businessName} by accident and what a pleasant surprise! The atmosphere is welcoming and the quality is top-notch. Already planning my next visit.`,
        `${businessName} has become my favorite place in the area. Every visit feels personal and the team genuinely cares about customer satisfaction. Highly recommend to anyone looking for quality service.`,
        `Took my friends to ${businessName} last week and we all had an incredible time. The service was prompt, the quality was excellent, and the prices were very reasonable. We'll definitely be regulars now!`
      ],
      hindi: [
        `पिछले हफ्ते ${businessName} गया था और वाकई बहुत प्रभावित हुआ! स्टाफ ने मेरी जरूरत के अनुसार बिल्कुल सही चीज़ ढूंढने में मदद की। अब यही मेरी पसंदीदा जगह है।`,
        `${businessName} में कई बार गया हूं और हर बार खुश होकर लौटा हूं। क्वालिटी हमेशा बेहतरीन रहती है और सर्विस भी दोस्ताना। मेरे पूरे परिवार को यह जगह पसंद है।`,
        `कल ${businessName} में बहुत अच्छा अनुभव रहा। टीम बहुत जानकार थी और पहले दिन से ही स्वागत महसूस कराया। जल्द ही वापस जाऊंगा!`,
        `${businessName} ने मेरी सभी उम्मीदों को पार कर दिया! पहले थोड़ा संकोच था लेकिन रिव्यूज़ सही थे - यह जगह वाकई शानदार है। हर चीज़ में बारीकी का ध्यान दिखता है।`,
        `${businessName} का कई महीनों से ग्राहक हूं और वे लगातार बेहतर होते जा रहे हैं। स्टाफ मेरी पसंद याद रखता है और हमेशा अच्छी सलाह देता है। सर्विस से बहुत खुश हूं।`,
        `गलती से ${businessName} पहुंचा था और क्या सुखद आश्चर्य मिला! माहौल स्वागत करने वाला है और क्वालिटी टॉप-नॉच है। अगली विज़िट की योजना बना रहा हूं।`,
        `${businessName} इस इलाके की मेरी पसंदीदा जगह बन गई है। हर विज़िट व्यक्तिगत लगती है और टीम वास्तव में ग्राहक संतुष्टि की परवाह करती है। क्वालिटी सर्विस चाहने वाले किसी भी व्यक्ति को सुझाऊंगा।`,
        `पिछले हफ्ते अपने दोस्तों को ${businessName} ले गया था और हम सभी का अविश्वसनीय समय बीता। सर्विस तुरंत मिली, क्वालिटी उत्कृष्ट थी, और दाम भी बहुत उचित थे। अब हम नियमित ग्राहक बनेंगे!`
      ],
      hi: [
        `पिछले हफ्ते ${businessName} गया था और वाकई बहुत प्रभावित हुआ! स्टाफ ने मेरी जरूरत के अनुसार बिल्कुल सही चीज़ ढूंढने में मदद की। अब यही मेरी पसंदीदा जगह है।`,
        `${businessName} में कई बार गया हूं और हर बार खुश होकर लौटा हूं। क्वालिटी हमेशा बेहतरीन रहती है और सर्विस भी दोस्ताना। मेरे पूरे परिवार को यह जगह पसंद है।`,
        `कल ${businessName} में बहुत अच्छा अनुभव रहा। टीम बहुत जानकार थी और पहले दिन से ही स्वागत महसूस कराया। जल्द ही वापस जाऊंगा!`,
        `${businessName} ने मेरी सभी उम्मीदों को पार कर दिया! पहले थोड़ा संकोच था लेकिन रिव्यूज़ सही थे - यह जगह वाकई शानदार है। हर चीज़ में बारीकी का ध्यान दिखता है।`,
        `${businessName} का कई महीनों से ग्राहक हूं और वे लगातार बेहतर होते जा रहे हैं। स्टाफ मेरी पसंद याद रखता है और हमेशा अच्छी सलाह देता है। सर्विस से बहुत खुश हूं।`,
        `गलती से ${businessName} पहुंचा था और क्या सुखद आश्चर्य मिला! माहौल स्वागत करने वाला है और क्वालिटी टॉप-नॉच है। अगली विज़िट की योजना बना रहा हूं।`,
        `${businessName} इस इलाके की मेरी पसंदीदा जगह बन गई है। हर विज़िट व्यक्तिगत लगती है और टीम वास्तव में ग्राहक संतुष्टि की परवाह करती है। क्वालिटी सर्विस चाहने वाले किसी भी व्यक्ति को सुझाऊंगा।`,
        `पिछले हफ्ते अपने दोस्तों को ${businessName} ले गया था और हम सभी का अविश्वसनीय समय बीता। सर्विस तुरंत मिली, क्वालिटी उत्कृष्ट थी, और दाम भी बहुत उचित थे। अब हम नियमित ग्राहक बनेंगे!`
      ],
      gujarati: [
        `ગયા અઠવાડિયે ${businessName} ગયો હતો અને ખરેખર પ્રભાવિત થયો! સ્ટાફે મારી જરૂરિયાત મુજબ બિલકુલ યોગ્ય વસ્તુ શોધવામાં મદદ કરી. હવે આ મારી પસંદીદા જગ્યા છે.`,
        `${businessName} માં ઘણી વખત ગયો છું અને દર વખતે ખુશ થઈને પાછો આવ્યો છું. ક્વોલિટી હંમેશા ઉત્કૃષ્ટ રહે છે અને સર્વિસ પણ મિત્રતાપૂર્ણ છે. મારા આખા પરિવારને આ જગ્યા ગમે છે.`,
        `ગઈકાલે ${businessName} માં ખૂબ સારો અનુભવ રહ્યો. ટીમ ખૂબ જાણકાર હતી અને પહેલા દિવસથી જ સ્વાગત અનુભવાવ્યું. જલ્દી જ પાછા આવીશ!`,
        `${businessName} એ મારી બધી અપેક્ષાઓને પાર કરી! પહેલા થોડો સંકોચ હતો પણ રિવ્યૂઝ સાચા હતા - આ જગ્યા ખરેખર શાનદાર છે. દરેક વસ્તુમાં વિગતોનું ધ્યાન દેખાય છે.`,
        `${businessName} નો ઘણા મહિનાઓથી ગ્રાહક છું અને તેઓ સતત સારા થતા જાય છે. સ્ટાફ મારી પસંદગી યાદ રાખે છે અને હંમેશા સારી સલાહ આપે છે. સર્વિસથી ખૂબ ખુશ છું.`,
        `ભૂલથી ${businessName} પહોંચ્યો હતો અને શું સુખદ આશ્ચર્ય મળ્યું! વાતાવરણ સ્વાગત કરનારું છે અને ક્વોલિટી ટોપ-નોચ છે. આગલી મુલાકાતની યોજના બનાવી રહ્યો છું.`,
        `${businessName} આ વિસ્તારની મારી પસંદીદા જગ્યા બની ગઈ છે. દરેક મુલાકાત વ્યક્તિગત લાગે છે અને ટીમ ખરેખર ગ્રાહક સંતુષ્ટિની કાળજી લે છે. ક્વોલિટી સર્વિસ જોઈતી હોય તો કોઈપણને સૂચવીશ.`,
        `ગયા અઠવાડિયે મારા મિત્રોને ${businessName} લઈ ગયો હતો અને અમારો અવિશ્વસનીય સમય પસાર થયો. સર્વિસ તુરંત મળી, ક્વોલિટી ઉત્કૃષ્ટ હતી, અને ભાવ પણ ખૂબ વાજબી હતા. હવે અમે નિયમિત ગ્રાહક બનીશું!`
      ],
      gu: [
        `ગયા અઠવાડિયે ${businessName} ગયો હતો અને ખરેખર પ્રભાવિત થયો! સ્ટાફે મારી જરૂરિયાત મુજબ બિલકુલ યોગ્ય વસ્તુ શોધવામાં મદદ કરી. હવે આ મારી પસંદીદા જગ્યા છે.`,
        `${businessName} માં ઘણી વખત ગયો છું અને દર વખતે ખુશ થઈને પાછો આવ્યો છું. ક્વોલિટી હંમેશા ઉત્કૃષ્ટ રહે છે અને સર્વિસ પણ મિત્રતાપૂર્ણ છે. મારા આખા પરિવારને આ જગ્યા ગમે છે.`,
        `ગઈકાલે ${businessName} માં ખૂબ સારો અનુભવ રહ્યો. ટીમ ખૂબ જાણકાર હતી અને પહેલા દિવસથી જ સ્વાગત અનુભવાવ્યું. જલ્દી જ પાછા આવીશ!`,
        `${businessName} એ મારી બધી અપેક્ષાઓને પાર કરી! પહેલા થોડો સંકોચ હતો પણ રિવ્યૂઝ સાચા હતા - આ જગ્યા ખરેખર શાનદાર છે. દરેક વસ્તુમાં વિગતોનું ધ્યાન દેખાય છે.`,
        `${businessName} નો ઘણા મહિનાઓથી ગ્રાહક છું અને તેઓ સતત સારા થતા જાય છે. સ્ટાફ મારી પસંદગી યાદ રાખે છે અને હંમેશા સારી સલાહ આપે છે. સર્વિસથી ખૂબ ખુશ છું.`,
        `ભૂલથી ${businessName} પહોંચ્યો હતો અને શું સુખદ આશ્ચર્ય મળ્યું! વાતાવરણ સ્વાગત કરનારું છે અને ક્વોલિટી ટોપ-નોચ છે. આગલી મુલાકાતની યોજના બનાવી રહ્યો છું.`,
        `${businessName} આ વિસ્તારની મારી પસંદીદા જગ્યા બની ગઈ છે. દરેક મુલાકાત વ્યક્તિગત લાગે છે અને ટીમ ખરેખર ગ્રાહક સંતુષ્ટિની કાળજી લે છે. ક્વોલિટી સર્વિસ જોઈતી હોય તો કોઈપણને સૂચવીશ.`,
        `ગયા અઠવાડિયે મારા મિત્રોને ${businessName} લઈ ગયો હતો અને અમારો અવિશ્વસનીય સમય પસાર થયો. સર્વિસ તુરંત મળી, ક્વોલિટી ઉત્કૃષ્ટ હતી, અને ભાવ પણ ખૂબ વાજબી હતા. હવે અમે નિયમિત ગ્રાહક બનીશું!`
      ]
    };

    const languageTemplates = templates[fallbackLanguage] || templates.english || templates.en;
    const randomTemplate = languageTemplates[Math.floor(Math.random() * languageTemplates.length)];

    return NextResponse.json(
      { feedback: randomTemplate },
      { status: 200 }
    );
  }
}