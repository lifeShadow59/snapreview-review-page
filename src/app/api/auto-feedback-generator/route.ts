import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// Auto-feedback generation service
export async function POST(request: NextRequest) {
  try {
    console.log("Starting auto-feedback generation check...");

    // Get all businesses with their language preferences
    const businessQuery = `
      SELECT DISTINCT 
        b.id as business_id,
        b.name as business_name,
        b.description,
        bt.name as business_type_name,
        COALESCE(STRING_AGG(btags.tag, ', '), '') as business_tags,
        blp.language_code,
        blp.language_name
      FROM businesses b
      LEFT JOIN business_types bt ON b.business_type_id = bt.id
      LEFT JOIN business_tags btags ON b.id = btags.business_id
      LEFT JOIN business_language_preferences blp ON b.id = blp.business_id
      WHERE b.status = 'active' AND blp.language_code IS NOT NULL
      GROUP BY b.id, b.name, b.description, bt.name, blp.language_code, blp.language_name
    `;

    const businessResult = await pool.query(businessQuery);
    
    if (businessResult.rows.length === 0) {
      return NextResponse.json(
        { message: "No businesses with language preferences found" },
        { status: 200 }
      );
    }

    let processedCount = 0;
    let generatedCount = 0;

    // Process each business-language combination
    for (const business of businessResult.rows) {
      const { business_id, business_name, business_type_name, business_tags, language_code, language_name } = business;

      // Check current feedback count for this business-language combination
      const feedbackCountQuery = `
        SELECT COUNT(*) as feedback_count
        FROM business_feedbacks 
        WHERE business_id = $1 AND language_code = $2
      `;

      const countResult = await pool.query(feedbackCountQuery, [business_id, language_code]);
      const currentCount = parseInt(countResult.rows[0].feedback_count);

      console.log(`Business: ${business_name}, Language: ${language_code}, Current feedback count: ${currentCount}`);

      // If feedback count is less than 5, generate 20 more
      if (currentCount < 5) {
        console.log(`Generating 20 feedbacks for ${business_name} in ${language_name} (${language_code})`);
        
        const feedbacksToGenerate = 20;
        const generatedFeedbacks = [];

        // Generate 20 feedbacks
        for (let i = 0; i < feedbacksToGenerate; i++) {
          try {
            const feedback = await generateSingleFeedback(
              business_name,
              business_type_name,
              business_tags,
              language_code
            );
            
            if (feedback) {
              generatedFeedbacks.push(feedback);
            }
          } catch (error) {
            console.error(`Error generating feedback ${i + 1} for ${business_name}:`, error);
            // Continue with next feedback generation
          }
        }

        // Insert all generated feedbacks into database
        if (generatedFeedbacks.length > 0) {
          const insertQuery = `
            INSERT INTO business_feedbacks (business_id, feedback, language_code, created_at)
            VALUES ($1, $2, $3, NOW())
          `;

          for (const feedback of generatedFeedbacks) {
            try {
              await pool.query(insertQuery, [business_id, feedback, language_code]);
              generatedCount++;
            } catch (error) {
              console.error(`Error inserting feedback for ${business_name}:`, error);
            }
          }

          console.log(`Successfully generated ${generatedFeedbacks.length} feedbacks for ${business_name} in ${language_name}`);
        }

        processedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-feedback generation completed`,
      processedBusinesses: processedCount,
      totalFeedbacksGenerated: generatedCount
    }, { status: 200 });

  } catch (error) {
    console.error("Error in auto-feedback generation:", error);
    return NextResponse.json(
      { error: "Internal server error during auto-feedback generation" },
      { status: 500 }
    );
  }
}

// Function to generate a single feedback using AI or templates
async function generateSingleFeedback(
  businessName: string,
  businessType: string | null,
  businessTags: string | null,
  languageCode: string
): Promise<string | null> {
  try {
    // Create language-specific prompts
    const languagePrompts: Record<string, string> = {
      english: `Write a genuine, human customer review for ${businessName}${businessType ? ` (${businessType})` : ''}${businessTags ? ` focusing on: ${businessTags}` : ''}. Make it sound like a real person wrote it - use natural language, personal experiences, and specific details. Write 2-4 sentences. Be conversational and authentic. Don't make it sound AI-generated. Use varied sentence structures and personal touches. IMPORTANT: Write ONLY in English.`,
      en: `Write a genuine, human customer review for ${businessName}${businessType ? ` (${businessType})` : ''}${businessTags ? ` focusing on: ${businessTags}` : ''}. Make it sound like a real person wrote it - use natural language, personal experiences, and specific details. Write 2-4 sentences. Be conversational and authentic. Don't make it sound AI-generated. Use varied sentence structures and personal touches. IMPORTANT: Write ONLY in English.`,

      hindi: `${businessName}${businessType ? ` (${businessType})` : ''} के लिए एक सच्ची, मानवीय ग्राहक समीक्षा लिखें${businessTags ? ` इन पर ध्यान दें: ${businessTags}` : ''}। इसे ऐसे लिखें जैसे कोई वास्तविक व्यक्ति ने लिखा हो - प्राकृतिक भाषा, व्यक्तिगत अनुभव और विशिष्ट विवरण का उपयोग करें। 2-4 वाक्य लिखें। बातचीत की तरह और प्रामाणिक हों। महत्वपूर्ण: केवल हिंदी में लिखें।`,
      hi: `${businessName}${businessType ? ` (${businessType})` : ''} के लिए एक सच्ची, मानवीय ग्राहक समीक्षा लिखें${businessTags ? ` इन पर ध्यान दें: ${businessTags}` : ''}। इसे ऐसे लिखें जैसे कोई वास्तविक व्यक्ति ने लिखा हो - प्राकृतिक भाषा, व्यक्तिगत अनुभव और विशिष्ट विवरण का उपयोग करें। 2-4 वाक्य लिखें। बातचीत की तरह और प्रामाणिक हों। महत्वपूर्ण: केवल हिंदी में लिखें।`,

      gujarati: `${businessName}${businessType ? ` (${businessType})` : ''} માટે એક સાચી, માનવીય ગ્રાહક સમીક્ષા લખો${businessTags ? ` આના પર ધ્યાન આપો: ${businessTags}` : ''}। તેને એવી રીતે લખો જાણે કોઈ વાસ્તવિક વ્યક્તિએ લખ્યું હોય - કુદરતી ભાષા, વ્યક્તિગત અનુભવો અને વિશિષ્ટ વિગતોનો ઉપયોગ કરો। 2-4 વાક્યો લખો। વાતચીત જેવું અને પ્રામાણિક બનાવો। મહત્વપૂર્ણ: ફક્ત ગુજરાતીમાં લખો।`,
      gu: `${businessName}${businessType ? ` (${businessType})` : ''} માટે એક સાચી, માનવીય ગ્રાહક સમીક્ષા લખો${businessTags ? ` આના પર ધ્યાન આપો: ${businessTags}` : ''}। તેને એવી રીતે લખો જાણે કોઈ વાસ્તવિક વ્યક્તિએ લખ્યું હોય - કુદરતી ભાષા, વ્યક્તિગત અનુભવો અને વિશિષ્ટ વિગતોનો ઉપયોગ કરો। 2-4 વાક્યો લખો। વાતચીત જેવું અને પ્રામાણિક બનાવો. મહત્વપૂર્ણ: ફક્ત ગુજરાતીમાં લખો।`
    };

    const prompt = languagePrompts[languageCode];
    
    if (!prompt) {
      throw new Error(`Unsupported language: ${languageCode}`);
    }

    // Try AI generation first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
          'X-Title': 'SnapReview.ai Auto Feedback Generator'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a real customer writing an authentic review. You must respond ONLY in the requested language. Make it unique, personal, and human-like. Vary your writing style and avoid repetitive patterns.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.9,
          max_tokens: 150,
          top_p: 0.95,
          frequency_penalty: 0.5,
          presence_penalty: 0.2
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (openRouterResponse.ok) {
        const data = await openRouterResponse.json();
        const generatedFeedback = data.choices?.[0]?.message?.content?.trim();
        
        if (generatedFeedback) {
          return generatedFeedback
            .replace(/^["']|["']$/g, '') // Remove surrounding quotes
            .replace(/\n+/g, ' ') // Replace newlines with spaces
            .trim();
        }
      }
    } catch (aiError) {
      console.error("AI generation failed, falling back to templates:", aiError);
    }

    // Fallback to template-based generation
    return generateTemplateFeedback(businessName, languageCode);

  } catch (error) {
    console.error("Error generating single feedback:", error);
    return generateTemplateFeedback(businessName, languageCode);
  }
}

// Template-based feedback generation as fallback
function generateTemplateFeedback(businessName: string, languageCode: string): string {
  const templates: Record<string, string[]> = {
    english: [
      `Visited ${businessName} last weekend and was blown away! The staff went above and beyond to help me find exactly what I needed. Definitely my new go-to spot.`,
      `I've been to ${businessName} several times now and they never disappoint. The quality is consistently excellent and the service is always friendly.`,
      `Had such a great experience at ${businessName} yesterday. The team was incredibly knowledgeable and made me feel welcome from the moment I walked in.`,
      `${businessName} exceeded all my expectations! The attention to detail really shows in everything they do. Will definitely be back soon.`,
      `Been a customer of ${businessName} for months now and they keep getting better. The staff remembers my preferences and always makes great recommendations.`,
      `Stumbled upon ${businessName} by accident and what a pleasant surprise! The atmosphere is welcoming and the quality is top-notch.`,
      `${businessName} has become my favorite place in the area. Every visit feels personal and the team genuinely cares about customer satisfaction.`,
      `Took my friends to ${businessName} last week and we all had an incredible time. The service was prompt and the quality was excellent.`
    ],
    en: [
      `Visited ${businessName} last weekend and was blown away! The staff went above and beyond to help me find exactly what I needed. Definitely my new go-to spot.`,
      `I've been to ${businessName} several times now and they never disappoint. The quality is consistently excellent and the service is always friendly.`,
      `Had such a great experience at ${businessName} yesterday. The team was incredibly knowledgeable and made me feel welcome from the moment I walked in.`,
      `${businessName} exceeded all my expectations! The attention to detail really shows in everything they do. Will definitely be back soon.`,
      `Been a customer of ${businessName} for months now and they keep getting better. The staff remembers my preferences and always makes great recommendations.`,
      `Stumbled upon ${businessName} by accident and what a pleasant surprise! The atmosphere is welcoming and the quality is top-notch.`,
      `${businessName} has become my favorite place in the area. Every visit feels personal and the team genuinely cares about customer satisfaction.`,
      `Took my friends to ${businessName} last week and we all had an incredible time. The service was prompt and the quality was excellent.`
    ],
    hindi: [
      `पिछले हफ्ते ${businessName} गया था और वाकई बहुत प्रभावित हुआ! स्टाफ ने मेरी जरूरत के अनुसार बिल्कुल सही चीज़ ढूंढने में मदद की।`,
      `${businessName} में कई बार गया हूं और हर बार खुश होकर लौटा हूं। क्वालिटी हमेशा बेहतरीन रहती है और सर्विस भी दोस्ताना।`,
      `कल ${businessName} में बहुत अच्छा अनुभव रहा। टीम बहुत जानकार थी और पहले दिन से ही स्वागत महसूस कराया।`,
      `${businessName} ने मेरी सभी उम्मीदों को पार कर दिया! हर चीज़ में बारीकी का ध्यान दिखता है। जल्द ही वापस जाऊंगा।`,
      `${businessName} का कई महीनों से ग्राहक हूं और वे लगातार बेहतर होते जा रहे हैं। स्टाफ मेरी पसंद याद रखता है।`,
      `गलती से ${businessName} पहुंचा था और क्या सुखद आश्चर्य मिला! माहौल स्वागत करने वाला है और क्वालिटी टॉप-नॉच है।`,
      `${businessName} इस इलाके की मेरी पसंदीदा जगह बन गई है। हर विज़िट व्यक्तिगत लगती है।`,
      `पिछले हफ्ते अपने दोस्तों को ${businessName} ले गया था और हम सभी का अविश्वसनीय समय बीता।`
    ],
    hi: [
      `पिछले हफ्ते ${businessName} गया था और वाकई बहुत प्रभावित हुआ! स्टाफ ने मेरी जरूरत के अनुसार बिल्कुल सही चीज़ ढूंढने में मदद की।`,
      `${businessName} में कई बार गया हूं और हर बार खुश होकर लौटा हूं। क्वालिटी हमेशा बेहतरीन रहती है और सर्विस भी दोस्ताना।`,
      `कल ${businessName} में बहुत अच्छा अनुभव रहा। टीम बहुत जानकार थी और पहले दिन से ही स्वागत महसूस कराया।`,
      `${businessName} ने मेरी सभी उम्मीदों को पार कर दिया! हर चीज़ में बारीकी का ध्यान दिखता है। जल्द ही वापस जाऊंगा।`,
      `${businessName} का कई महीनों से ग्राहक हूं और वे लगातार बेहतर होते जा रहे हैं। स्टाफ मेरी पसंद याद रखता है।`,
      `गलती से ${businessName} पहुंचा था और क्या सुखद आश्चर्य मिला! माहौल स्वागत करने वाला है और क्वालिटी टॉप-नॉच है।`,
      `${businessName} इस इलाके की मेरी पसंदीदा जगह बन गई है। हर विज़िट व्यक्तिगत लगती है।`,
      `पिछले हफ्ते अपने दोस्तों को ${businessName} ले गया था और हम सभी का अविश्वसनीय समय बीता।`
    ],
    gujarati: [
      `ગયા અઠવાડિયે ${businessName} ગયો હતો અને ખરેખર પ્રભાવિત થયો! સ્ટાફે મારી જરૂરિયાત મુજબ બિલકુલ યોગ્ય વસ્તુ શોધવામાં મદદ કરી.`,
      `${businessName} માં ઘણી વખત ગયો છું અને દર વખતે ખુશ થઈને પાછો આવ્યો છું. ક્વોલિટી હંમેશા ઉત્કૃષ્ટ રહે છે.`,
      `ગઈકાલે ${businessName} માં ખૂબ સારો અનુભવ રહ્યો. ટીમ ખૂબ જાણકાર હતી અને પહેલા દિવસથી જ સ્વાગત અનુભવાવ્યું.`,
      `${businessName} એ મારી બધી અપેક્ષાઓને પાર કરી! દરેક વસ્તુમાં વિગતોનું ધ્યાન દેખાય છે. જલ્દી જ પાછા આવીશ.`,
      `${businessName} નો ઘણા મહિનાઓથી ગ્રાહક છું અને તેઓ સતત સારા થતા જાય છે. સ્ટાફ મારી પસંદગી યાદ રાખે છે.`,
      `ભૂલથી ${businessName} પહોંચ્યો હતો અને શું સુખદ આશ્ચર્ય મળ્યું! વાતાવરણ સ્વાગત કરનારું છે અને ક્વોલિટી ટોપ-નોચ છે.`,
      `${businessName} આ વિસ્તારની મારી પસંદીદા જગ્યા બની ગઈ છે. દરેક મુલાકાત વ્યક્તિગત લાગે છે.`,
      `ગયા અઠવાડિયે મારા મિત્રોને ${businessName} લઈ ગયો હતો અને અમારો અવિશ્વસનીય સમય પસાર થયો.`
    ],
    gu: [
      `ગયા અઠવાડિયે ${businessName} ગયો હતો અને ખરેખર પ્રભાવિત થયો! સ્ટાફે મારી જરૂરિયાત મુજબ બિલકુલ યોગ્ય વસ્તુ શોધવામાં મદદ કરી.`,
      `${businessName} માં ઘણી વખત ગયો છું અને દર વખતે ખુશ થઈને પાછો આવ્યો છું. ક્વોલિટી હંમેશા ઉત્કૃષ્ટ રહે છે.`,
      `ગઈકાલે ${businessName} માં ખૂબ સારો અનુભવ રહ્યો. ટીમ ખૂબ જાણકાર હતી અને પહેલા દિવસથી જ સ્વાગત અનુભવાવ્યું.`,
      `${businessName} એ મારી બધી અપેક્ષાઓને પાર કરી! દરેક વસ્તુમાં વિગતોનું ધ્યાન દેખાય છે. જલ્દી જ પાછા આવીશ.`,
      `${businessName} નો ઘણા મહિનાઓથી ગ્રાહક છું અને તેઓ સતત સારા થતા જાય છે. સ્ટાફ મારી પસંદગી યાદ રાખે છે.`,
      `ભૂલથી ${businessName} પહોંચ્યો હતો અને શું સુખદ આશ્ચર્ય મળ્યું! વાતાવરણ સ્વાગત કરનારું છે અને ક્વોલિટી ટોપ-નોચ છે.`,
      `${businessName} આ વિસ્તારની મારી પસંદીદા જગ્યા બની ગઈ છે. દરેક મુલાકાત વ્યક્તિગત લાગે છે.`,
      `ગયા અઠવાડિયે મારા મિત્રોને ${businessName} લઈ ગયો હતો અને અમારો અવિશ્વસનીય સમય પસાર થયો.`
    ]
  };

  const languageTemplates = templates[languageCode] || templates.english || templates.en;
  return languageTemplates[Math.floor(Math.random() * languageTemplates.length)];
}