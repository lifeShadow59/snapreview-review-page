// Auto-feedback generation cron service
// This service can be called by a cron job or scheduled task

import pool from "@/lib/db";

interface BusinessLanguageData {
  business_id: string;
  business_name: string;
  business_type_name: string | null;
  business_tags: string | null;
  language_code: string;
  language_name: string;
}

export class AutoFeedbackService {
  private static instance: AutoFeedbackService;
  private isRunning = false;

  public static getInstance(): AutoFeedbackService {
    if (!AutoFeedbackService.instance) {
      AutoFeedbackService.instance = new AutoFeedbackService();
    }
    return AutoFeedbackService.instance;
  }

  // Main method to run the auto-feedback generation
  public async runAutoFeedbackGeneration(): Promise<{
    success: boolean;
    processedBusinesses: number;
    totalFeedbacksGenerated: number;
    message: string;
  }> {
    if (this.isRunning) {
      return {
        success: false,
        processedBusinesses: 0,
        totalFeedbacksGenerated: 0,
        message: "Auto-feedback generation is already running"
      };
    }

    this.isRunning = true;
    console.log("🤖 Starting auto-feedback generation process...");

    try {
      const businesses = await this.getBusinessesWithLanguagePreferences();
      
      if (businesses.length === 0) {
        console.log("ℹ️ No businesses with language preferences found");
        return {
          success: true,
          processedBusinesses: 0,
          totalFeedbacksGenerated: 0,
          message: "No businesses with language preferences found"
        };
      }

      let processedCount = 0;
      let generatedCount = 0;

      // Process each business-language combination
      for (const business of businesses) {
        try {
          const currentCount = await this.getFeedbackCount(business.business_id, business.language_code);
          
          console.log(`📊 ${business.business_name} (${business.language_code}): ${currentCount} feedbacks`);

          // If feedback count is less than 5, generate 20 more
          if (currentCount < 5) {
            console.log(`🚀 Generating feedbacks for ${business.business_name} in ${business.language_name}`);
            
            const generated = await this.generateFeedbacksForBusiness(business);
            generatedCount += generated;
            processedCount++;

            // Add small delay between businesses to avoid overwhelming the AI API
            await this.delay(1000);
          }
        } catch (error) {
          console.error(`❌ Error processing ${business.business_name}:`, error);
          // Continue with next business
        }
      }

      const result = {
        success: true,
        processedBusinesses: processedCount,
        totalFeedbacksGenerated: generatedCount,
        message: `Auto-feedback generation completed. Processed ${processedCount} businesses, generated ${generatedCount} feedbacks.`
      };

      console.log("✅ Auto-feedback generation completed:", result);
      return result;

    } catch (error) {
      console.error("❌ Error in auto-feedback generation:", error);
      return {
        success: false,
        processedBusinesses: 0,
        totalFeedbacksGenerated: 0,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      this.isRunning = false;
    }
  }

  // Get all businesses with their language preferences
  private async getBusinessesWithLanguagePreferences(): Promise<BusinessLanguageData[]> {
    const query = `
      SELECT DISTINCT 
        b.id as business_id,
        b.name as business_name,
        bt.name as business_type_name,
        COALESCE(STRING_AGG(btags.tag, ', '), '') as business_tags,
        blp.language_code,
        blp.language_name
      FROM businesses b
      LEFT JOIN business_types bt ON b.business_type_id = bt.id
      LEFT JOIN business_tags btags ON b.id = btags.business_id
      LEFT JOIN business_language_preferences blp ON b.id = blp.business_id
      WHERE b.status = 'active' AND blp.language_code IS NOT NULL
      GROUP BY b.id, b.name, bt.name, blp.language_code, blp.language_name
      ORDER BY b.name, blp.language_code
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Get current feedback count for a business-language combination
  private async getFeedbackCount(businessId: string, languageCode: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as feedback_count
      FROM business_feedbacks 
      WHERE business_id = $1 AND language_code = $2
    `;

    const result = await pool.query(query, [businessId, languageCode]);
    return parseInt(result.rows[0].feedback_count);
  }

  // Generate 20 feedbacks for a specific business-language combination
  private async generateFeedbacksForBusiness(business: BusinessLanguageData): Promise<number> {
    const feedbacksToGenerate = 20;
    const generatedFeedbacks: string[] = [];

    // Generate feedbacks in batches to avoid overwhelming the AI API
    const batchSize = 5;
    for (let i = 0; i < feedbacksToGenerate; i += batchSize) {
      const batchPromises = [];
      
      for (let j = 0; j < batchSize && (i + j) < feedbacksToGenerate; j++) {
        batchPromises.push(
          this.generateSingleFeedback(
            business.business_name,
            business.business_type_name,
            business.business_tags,
            business.language_code
          )
        );
      }

      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        for (const result of batchResults) {
          if (result.status === 'fulfilled' && result.value) {
            generatedFeedbacks.push(result.value);
          }
        }

        // Small delay between batches
        if (i + batchSize < feedbacksToGenerate) {
          await this.delay(500);
        }
      } catch (error) {
        console.error(`Error generating batch for ${business.business_name}:`, error);
      }
    }

    // Insert all generated feedbacks into database
    if (generatedFeedbacks.length > 0) {
      await this.insertFeedbacks(business.business_id, generatedFeedbacks, business.language_code);
      console.log(`✨ Generated ${generatedFeedbacks.length} feedbacks for ${business.business_name} (${business.language_code})`);
    }

    return generatedFeedbacks.length;
  }

  // Generate a single feedback using AI or templates
  private async generateSingleFeedback(
    businessName: string,
    businessType: string | null,
    businessTags: string | null,
    languageCode: string
  ): Promise<string | null> {
    try {
      // Try AI generation first (with shorter timeout for cron job)
      const aiFeedback = await this.generateAIFeedback(businessName, businessType, businessTags, languageCode);
      if (aiFeedback) {
        return aiFeedback;
      }
    } catch (error) {
      console.log(`AI generation failed for ${businessName}, using template fallback`);
    }

    // Fallback to template-based generation
    return this.generateTemplateFeedback(businessName, languageCode);
  }

  // AI-based feedback generation
  private async generateAIFeedback(
    businessName: string,
    businessType: string | null,
    businessTags: string | null,
    languageCode: string
  ): Promise<string | null> {
    const languagePrompts: Record<string, string> = {
      english: `Write a genuine, human customer review for ${businessName}${businessType ? ` (${businessType})` : ''}${businessTags ? ` focusing on: ${businessTags}` : ''}. Make it sound like a real person wrote it. Write 2-4 sentences. Be conversational and authentic. IMPORTANT: Write ONLY in English.`,
      en: `Write a genuine, human customer review for ${businessName}${businessType ? ` (${businessType})` : ''}${businessTags ? ` focusing on: ${businessTags}` : ''}. Make it sound like a real person wrote it. Write 2-4 sentences. Be conversational and authentic. IMPORTANT: Write ONLY in English.`,
      hindi: `${businessName}${businessType ? ` (${businessType})` : ''} के लिए एक सच्ची, मानवीय ग्राहक समीक्षा लिखें${businessTags ? ` इन पर ध्यान दें: ${businessTags}` : ''}। 2-4 वाक्य लिखें। बातचीत की तरह और प्रामाणिक हों। महत्वपूर्ण: केवल हिंदी में लिखें।`,
      hi: `${businessName}${businessType ? ` (${businessType})` : ''} के लिए एक सच्ची, मानवीय ग्राहक समीक्षा लिखें${businessTags ? ` इन पर ध्यान दें: ${businessTags}` : ''}। 2-4 वाक्य लिखें। बातचीत की तरह और प्रामाणिक हों। महत्वपूर्ण: केवल हिंदी में लिखें।`,
      gujarati: `${businessName}${businessType ? ` (${businessType})` : ''} માટે એક સાચી, માનવીય ગ્રાહક સમીક્ષા લખો${businessTags ? ` આના પર ધ્યાન આપો: ${businessTags}` : ''}। 2-4 વાક્યો લખો। વાતચીત જેવું અને પ્રામાણિક બનાવો। મહત્વપૂર્ણ: ફક્ત ગુજરાતીમાં લખો।`,
      gu: `${businessName}${businessType ? ` (${businessType})` : ''} માટે એક સાચી, માનવીય ગ્રાહક સમીક્ષા લખો${businessTags ? ` આના પર ધ્યાન આપો: ${businessTags}` : ''}। 2-4 વાક્યો લખો। વાતચીત જેવું અને પ્રામાણિક બનાવો। મહત્વપૂર્ણ: ફક્ત ગુજરાતીમાં લખો।`
    };

    const prompt = languagePrompts[languageCode];
    if (!prompt) {
      throw new Error(`Unsupported language: ${languageCode}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for cron job

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
              content: 'You are a real customer writing an authentic review. Make it unique, personal, and human-like.'
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

      if (response.ok) {
        const data = await response.json();
        const feedback = data.choices?.[0]?.message?.content?.trim();
        
        if (feedback) {
          return feedback
            .replace(/^["']|["']$/g, '')
            .replace(/\n+/g, ' ')
            .trim();
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }

    return null;
  }

  // Template-based feedback generation
  private generateTemplateFeedback(businessName: string, languageCode: string): string {
    const templates: Record<string, string[]> = {
      english: [
        `Visited ${businessName} recently and had a wonderful experience! The staff was very helpful and professional.`,
        `${businessName} provides excellent service. I've been a customer for a while now and they never disappoint.`,
        `Great experience at ${businessName}! The quality is consistently good and the team is friendly.`,
        `Highly recommend ${businessName}. They go above and beyond to ensure customer satisfaction.`,
        `${businessName} has become my go-to place. The service is reliable and the staff is knowledgeable.`
      ],
      en: [
        `Visited ${businessName} recently and had a wonderful experience! The staff was very helpful and professional.`,
        `${businessName} provides excellent service. I've been a customer for a while now and they never disappoint.`,
        `Great experience at ${businessName}! The quality is consistently good and the team is friendly.`,
        `Highly recommend ${businessName}. They go above and beyond to ensure customer satisfaction.`,
        `${businessName} has become my go-to place. The service is reliable and the staff is knowledgeable.`
      ],
      hindi: [
        `हाल ही में ${businessName} गया और बहुत अच्छा अनुभव रहा! स्टाफ बहुत सहायक और पेशेवर था।`,
        `${businessName} उत्कृष्ट सेवा प्रदान करता है। मैं कुछ समय से ग्राहक हूं और वे कभी निराश नहीं करते।`,
        `${businessName} में बहुत अच्छा अनुभव! गुणवत्ता लगातार अच्छी है और टीम मित्रवत है।`,
        `${businessName} की अत्यधिक अनुशंसा करता हूं। वे ग्राहक संतुष्टि सुनिश्चित करने के लिए अतिरिक्त प्रयास करते हैं।`,
        `${businessName} मेरी पसंदीदा जगह बन गई है। सेवा विश्वसनीय है और स्टाफ जानकार है।`
      ],
      hi: [
        `हाल ही में ${businessName} गया और बहुत अच्छा अनुभव रहा! स्टाफ बहुत सहायक और पेशेवर था।`,
        `${businessName} उत्कृष्ट सेवा प्रदान करता है। मैं कुछ समय से ग्राहक हूं और वे कभी निराश नहीं करते।`,
        `${businessName} में बहुत अच्छा अनुभव! गुणवत्ता लगातार अच्छी है और टीम मित्रवत है।`,
        `${businessName} की अत्यधिक अनुशंसा करता हूं। वे ग्राहक संतुष्टि सुनिश्चित करने के लिए अतिरिक्त प्रयास करते हैं।`,
        `${businessName} मेरी पसंदीदा जगह बन गई है। सेवा विश्वसनीय है और स्टाफ जानकार है।`
      ],
      gujarati: [
        `તાજેતરમાં ${businessName} ગયો અને અદ્ભુત અનુભવ થયો! સ્ટાફ ખૂબ મદદરૂપ અને વ્યાવસાયિક હતો.`,
        `${businessName} ઉત્કૃષ્ટ સેવા પ્રદાન કરે છે. હું થોડા સમયથી ગ્રાહક છું અને તેઓ ક્યારેય નિરાશ કરતા નથી.`,
        `${businessName} માં સરસ અનુભવ! ગુણવત્તા સતત સારી છે અને ટીમ મિત્રતાપૂર્ણ છે.`,
        `${businessName} ની ખૂબ ભલામણ કરું છું. તેઓ ગ્રાહક સંતુષ્ટિ સુનિશ્ચિત કરવા વધારાના પ્રયાસો કરે છે.`,
        `${businessName} મારી પસંદીદા જગ્યા બની ગઈ છે. સેવા વિશ્વસનીય છે અને સ્ટાફ જાણકાર છે.`
      ],
      gu: [
        `તાજેતરમાં ${businessName} ગયો અને અદ્ભુત અનુભવ થયો! સ્ટાફ ખૂબ મદદરૂપ અને વ્યાવસાયિક હતો.`,
        `${businessName} ઉત્કૃષ્ટ સેવા પ્રદાન કરે છે. હું થોડા સમયથી ગ્રાહક છું અને તેઓ ક્યારેય નિરાશ કરતા નથી.`,
        `${businessName} માં સરસ અનુભવ! ગુણવત્તા સતત સારી છે અને ટીમ મિત્રતાપૂર્ણ છે.`,
        `${businessName} ની ખૂબ ભલામણ કરું છું. તેઓ ગ્રાહક સંતુષ્ટિ સુનિશ્ચિત કરવા વધારાના પ્રયાસો કરે છે.`,
        `${businessName} મારી પસંદીદા જગ્યા બની ગઈ છે. સેવા વિશ્વસનીય છે અને સ્ટાફ જાણકાર છે.`
      ]
    };

    const languageTemplates = templates[languageCode] || templates.english;
    return languageTemplates[Math.floor(Math.random() * languageTemplates.length)];
  }

  // Insert generated feedbacks into database
  private async insertFeedbacks(businessId: string, feedbacks: string[], languageCode: string): Promise<void> {
    const insertQuery = `
      INSERT INTO business_feedbacks (business_id, feedback, language_code, created_at)
      VALUES ($1, $2, $3, NOW())
    `;

    for (const feedback of feedbacks) {
      try {
        await pool.query(insertQuery, [businessId, feedback, languageCode]);
      } catch (error) {
        console.error(`Error inserting feedback: ${error}`);
        // Continue with next feedback
      }
    }
  }

  // Utility method for delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check if the service is currently running
  public isCurrentlyRunning(): boolean {
    return this.isRunning;
  }
}