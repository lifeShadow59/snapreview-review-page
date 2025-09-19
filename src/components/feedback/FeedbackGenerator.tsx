"use client";

import { useState, useEffect, useCallback } from "react";

interface Business {
  id: string;
  name: string;
  business_type_name?: string;
  business_tags?: string;
  google_maps_url?: string;
}

interface LanguagePreference {
  language_code: string;
  language_name: string;
}

type Language = 'english' | 'hindi' | 'gujarati';

interface FeedbackItem {
  id: number;
  text: string;
}

export default function FeedbackGenerator({ business }: { business: Business }) {
  const [currentFeedback, setCurrentFeedback] = useState("Great service and excellent experience! Highly recommended.");
  const [currentFeedbackId, setCurrentFeedbackId] = useState<number | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english');
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>('en');
  const [availableLanguages, setAvailableLanguages] = useState<LanguagePreference[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // Load language preferences on component mount
  useEffect(() => {
    const loadLanguagePreferences = async () => {
      try {
        const response = await fetch(`/api/businesses/${business.id}/language-preferences`);
        const data = await response.json();

        if (response.ok && data.languages) {
          setAvailableLanguages(data.languages);
          // Set first language as default
          if (data.languages.length > 0) {
            const firstLang = data.languages[0];
            setSelectedLanguageCode(firstLang.language_code);
            // Map language code to old language format for backward compatibility
            const langMap: Record<string, Language> = {
              'en': 'english',
              'hi': 'hindi',
              'gu': 'gujarati'
            };
            setSelectedLanguage(langMap[firstLang.language_code] || 'english');
          }
        }
      } catch (error) {
        console.error("Error loading language preferences:", error);
        // Fallback to all three languages
        const defaultLanguages = [
          { language_code: 'en', language_name: 'English' },
          { language_code: 'hi', language_name: 'हिंदी' },
          { language_code: 'gu', language_name: 'ગુજરાતી' }
        ];
        setAvailableLanguages(defaultLanguages);
        setSelectedLanguageCode('en');
        setSelectedLanguage('english');
      }
    };

    loadLanguagePreferences();
  }, [business.id]);

  // Load initial feedback when language is set
  useEffect(() => {
    if (!selectedLanguageCode) return;

    const loadInitialFeedback = async () => {
      try {
        // First try to get from database with language filter
        const dbResponse = await fetch(`/api/businesses/${business.id}/feedback?language_code=${selectedLanguageCode}`);
        const dbData = await dbResponse.json();

        if (dbResponse.ok && dbData.feedbacks && dbData.feedbacks.length > 0) {
          // Use random feedback from database for the selected language
          const randomFeedback = dbData.feedbacks[Math.floor(Math.random() * dbData.feedbacks.length)];
          setCurrentFeedback(randomFeedback.text);
          setCurrentFeedbackId(randomFeedback.id);
        } else {
          // Generate new feedback if no database feedback exists
          const response = await fetch(`/api/businesses/${business.id}/generate-live-feedback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              language_code: selectedLanguageCode,
              businessName: business.name,
              businessType: business.business_type_name,
              businessTags: business.business_tags
            }),
          });

          const data = await response.json();

          if (response.ok && data.feedback) {
            setCurrentFeedback(data.feedback);
            setCurrentFeedbackId(null); // Generated feedback doesn't have an ID
          } else {
            throw new Error('Failed to generate initial feedback');
          }
        }
      } catch (error) {
        console.error("Error loading initial feedback:", error);
        // Keep the default fallback that's already set
      }
    };

    loadInitialFeedback();
  }, [business.id, business.name, business.business_type_name, business.business_tags, selectedLanguageCode]);

  const generateNewFeedback = useCallback(async (languageCode: string) => {
    setIsShuffling(true);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second client timeout to allow API to respond

    try {
      const response = await fetch(`/api/businesses/${business.id}/generate-live-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language_code: languageCode,
          businessName: business.name,
          businessType: business.business_type_name,
          businessTags: business.business_tags
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok && data.feedback) {
        setCurrentFeedback(data.feedback);
      } else {
        throw new Error(data.error || 'Failed to generate feedback');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Error generating feedback:", error);
      
      // Enhanced human-like fallback feedback with more variety (2-4 sentences)
      const fallbackFeedbacks: Record<string, string[]> = {
        en: [
          "Had an amazing experience here last week! The staff was incredibly helpful and made sure I got exactly what I needed. Definitely coming back soon.",
          "I've been a customer for months now and they never disappoint. The quality is consistently excellent and the service feels personal. My whole family loves this place.",
          "Stumbled upon this place by accident and what a pleasant surprise! The atmosphere is welcoming and the attention to detail is impressive. Already planning my next visit.",
          "Visited with friends yesterday and we all had a great time. The service was prompt, quality was top-notch, and prices were very reasonable. We'll definitely be regulars now!"
        ],
        english: [
          "Had an amazing experience here last week! The staff was incredibly helpful and made sure I got exactly what I needed. Definitely coming back soon.",
          "I've been a customer for months now and they never disappoint. The quality is consistently excellent and the service feels personal. My whole family loves this place.",
          "Stumbled upon this place by accident and what a pleasant surprise! The atmosphere is welcoming and the attention to detail is impressive. Already planning my next visit.",
          "Visited with friends yesterday and we all had a great time. The service was prompt, quality was top-notch, and prices were very reasonable. We'll definitely be regulars now!"
        ],
        hi: [
          "पिछले हफ्ते यहां का अनुभव शानदार रहा! स्टाफ बहुत मददगार था और यह सुनिश्चित किया कि मुझे वही मिले जिसकी जरूरत थी। जल्द ही वापस आऊंगा।",
          "कई महीनों से यहां का ग्राहक हूं और कभी निराश नहीं हुआ। क्वालिटी हमेशा बेहतरीन रहती है और सर्विस व्यक्तिगत लगती है। मेरे पूरे परिवार को यह जगह पसंद है।",
          "गलती से यहां पहुंचा था और क्या सुखद आश्चर्य मिला! माहौल स्वागत करने वाला है और बारीकियों पर ध्यान प्रभावशाली है। अगली विज़िट की योजना बना रहा हूं।",
          "कल दोस्तों के साथ गया था और हम सभी का बहुत अच्छा समय बीता। सर्विस तुरंत मिली, क्वालिटी टॉप-नॉच थी, और दाम भी बहुत उचित थे। अब हम नियमित ग्राहक बनेंगे!"
        ],
        hindi: [
          "पिछले हफ्ते यहां का अनुभव शानदार रहा! स्टाफ बहुत मददगार था और यह सुनिश्चित किया कि मुझे वही मिले जिसकी जरूरत थी। जल्द ही वापस आऊंगा।",
          "कई महीनों से यहां का ग्राहक हूं और कभी निराश नहीं हुआ। क्वालिटी हमेशा बेहतरीन रहती है और सर्विस व्यक्तिगत लगती है। मेरे पूरे परिवार को यह जगह पसंद है।",
          "गलती से यहां पहुंचा था और क्या सुखद आश्चर्य मिला! माहौल स्वागत करने वाला है और बारीकियों पर ध्यान प्रभावशाली है। अगली विज़िट की योजना बना रहा हूं।",
          "कल दोस्तों के साथ गया था और हम सभी का बहुत अच्छा समय बीता। सर्विस तुरंत मिली, क्वालिटी टॉप-नॉच थी, और दाम भी बहुत उचित थे। अब हम नियमित ग्राहक बनेंगे!"
        ],
        gu: [
          "ગયા અઠવાડિયે અહીંનો અનુભવ શાનદાર રહ્યો! સ્ટાફ ખૂબ મદદગાર હતો અને ખાતરી કરી કે મને જે જોઈએ તે મળે. જલ્દી જ પાછા આવીશ.",
          "ઘણા મહિનાઓથી અહીંનો ગ્રાહક છું અને ક્યારેય નિરાશ થયો નથી. ક્વોલિટી હંમેશા ઉત્કૃષ્ટ રહે છે અને સર્વિસ વ્યક્તિગત લાગે છે. મારા આખા પરિવારને આ જગ્યા ગમે છે.",
          "ભૂલથી અહીં પહોંચ્યો હતો અને શું સુખદ આશ્ચર્ય મળ્યું! વાતાવરણ સ્વાગત કરનારું છે અને વિગતોનું ધ્યાન પ્રભાવશાળી છે. આગલી મુલાકાતની યોજના બનાવી રહ્યો છું.",
          "ગઈકાલે મિત્રો સાથે ગયો હતો અને અમારો ખૂબ સારો સમય પસાર થયો. સર્વિસ તુરંત મળી, ક્વોલિટી ટોપ-નોચ હતી, અને ભાવ પણ ખૂબ વાજબી હતા. હવે અમે નિયમિત ગ્રાહક બનીશું!"
        ],
        gujarati: [
          "ગયા અઠવાડિયે અહીંનો અનુભવ શાનદાર રહ્યો! સ્ટાફ ખૂબ મદદગાર હતો અને ખાતરી કરી કે મને જે જોઈએ તે મળે. જલ્દી જ પાછા આવીશ.",
          "ઘણા મહિનાઓથી અહીંનો ગ્રાહક છું અને ક્યારેય નિરાશ થયો નથી. ક્વોલિટી હંમેશા ઉત્કૃષ્ટ રહે છે અને સર્વિસ વ્યક્તિગત લાગે છે. મારા આખા પરિવારને આ જગ્યા ગમે છે.",
          "ભૂલથી અહીં પહોંચ્યો હતો અને શું સુખદ આશ્ચર્ય મળ્યું! વાતાવરણ સ્વાગત કરનારું છે અને વિગતોનું ધ્યાન પ્રભાવશાળી છે. આગલી મુલાકાતની યોજના બનાવી રહ્યો છું.",
          "ગઈકાલે મિત્રો સાથે ગયો હતો અને અમારો ખૂબ સારો સમય પસાર થયો. સર્વિસ તુરંત મળી, ક્વોલિટી ટોપ-નોચ હતી, અને ભાવ પણ ખૂબ વાજબી હતા. હવે અમે નિયમિત ગ્રાહક બનીશું!"
        ]
      };
      
      const templates = fallbackFeedbacks[languageCode] || fallbackFeedbacks.en;
      const randomFallback = templates[Math.floor(Math.random() * templates.length)];
      setCurrentFeedback(randomFallback);
    } finally {
      setIsShuffling(false);
    }
  }, [business.id, business.name, business.business_type_name, business.business_tags]);

  const handleLanguageSelect = useCallback(async (languageCode: string, languageName: string) => {
    // Don't regenerate if same language is selected
    if (languageCode === selectedLanguageCode) return;

    setSelectedLanguageCode(languageCode);

    // Map language code to old language format for backward compatibility
    const langMap: Record<string, Language> = {
      'en': 'english',
      'hi': 'hindi',
      'gu': 'gujarati'
    };
    setSelectedLanguage(langMap[languageCode] || 'english');

    // First check database for existing feedback in selected language
    try {
      const dbResponse = await fetch(`/api/businesses/${business.id}/feedback?language_code=${languageCode}`);
      const dbData = await dbResponse.json();

      if (dbResponse.ok && dbData.feedbacks && dbData.feedbacks.length > 0) {
        // Use random feedback from database for the selected language
        const randomFeedback = dbData.feedbacks[Math.floor(Math.random() * dbData.feedbacks.length)];
        setCurrentFeedback(randomFeedback.text);
        setCurrentFeedbackId(randomFeedback.id);
        return; // Exit early, no need to generate new feedback
      }
    } catch (error) {
      console.error("Error fetching database feedback:", error);
    }

    // If no database feedback found, show placeholder and generate new feedback
    const placeholders: Record<string, string> = {
      en: "Generating your personalized review...",
      hi: "आपकी व्यक्तिगत समीक्षा तैयार की जा रही है...",
      gu: "તમારી વ્યક્તિગત સમીક્ષા તૈયાર કરવામાં આવી રહી છે...",
      english: "Generating your personalized review...",
      hindi: "आपकी व्यक्तिगत समीक्षा तैयार की जा रही है...",
      gujarati: "તમારી વ્યક્તિગત સમીક્ષા તૈયાર કરવામાં આવી રહી છે..."
    };

    setCurrentFeedback(placeholders[languageCode] || placeholders.en);
    generateNewFeedback(languageCode);
  }, [selectedLanguageCode, generateNewFeedback, business.id]);

  const handleShuffle = useCallback(() => {
    // Show immediate placeholder while generating
    const placeholders: Record<string, string> = {
      en: "Generating your personalized review...",
      hi: "आपकी व्यक्तिगत समीक्षा तैयार की जा रही है...",
      gu: "તમારી વ્યક્તિગત સમીક્ષા તૈયાર કરવામાં આવી રહી છે...",
      english: "Generating your personalized review...",
      hindi: "आपकी व्यक्तिगत समीक्षा तैयार की जा रही है...",
      gujarati: "તમારી વ્યક્તિગત સમીક્ષા તૈયાર કરવામાં આવી રહી છે..."
    };

    setCurrentFeedback(placeholders[selectedLanguageCode] || placeholders.en);
    generateNewFeedback(selectedLanguageCode);
  }, [selectedLanguageCode, generateNewFeedback]);

  const handleCopyReview = async () => {
    try {
      // Copy feedback to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentFeedback);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = currentFeedback;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      // Track the copy action (async, don't wait for it)
      console.log('Sending copy tracking request with data:', {
        language_code: selectedLanguageCode,
        business_id: business.id,
        feedback_id: currentFeedbackId
      });
      
      fetch(`/api/businesses/${business.id}/track-copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language_code: selectedLanguageCode,
          feedback_id: currentFeedbackId // Include feedback ID for deletion
        }),
      })
      .then(response => {
        console.log('Copy tracking response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('Copy tracking response:', data);
        if (data.success) {
          console.log('✅ Copy tracking successful!');
          console.log('📊 Analytics:', data.analytics);
          console.log('📈 Business Metrics:', data.businessMetrics);
        } else {
          console.error('❌ Copy tracking failed:', data.error, data.details);
        }
      })
      .catch(error => {
        console.error('Error tracking copy:', error);
        // Don't interrupt user experience if tracking fails
      });

      // Show success message
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);

      // Redirect to Google Reviews in same tab
      setTimeout(() => {
        if (business.google_maps_url) {
          window.location.href = business.google_maps_url;
        }
      }, 500);

    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Still redirect even if clipboard fails
      if (business.google_maps_url) {
        window.location.href = business.google_maps_url;
      }
    }
  };



  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
      {/* Copy Success Message */}
      {showCopySuccess && (
        <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Review copied to clipboard! Redirecting to Google Reviews...
          </p>
        </div>
      )}

      {/* Main Feedback Display */}
      <div className="mb-8">
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-xl p-6 sm:p-8 min-h-[100px] flex items-center justify-center">
          {isShuffling ? (
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Generating feedback...</span>
            </div>
          ) : (
            <p className="text-sm text-gray-800 leading-relaxed text-center font-medium">
              {currentFeedback}
            </p>
          )}

          {/* Decorative elements */}
          <div className="absolute top-3 left-3 w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
          <div className="absolute top-5 right-4 w-3 h-3 bg-indigo-400 rounded-full opacity-40"></div>
          <div className="absolute bottom-4 left-6 w-2 h-2 bg-purple-400 rounded-full opacity-50"></div>
          <div className="absolute bottom-3 right-3 w-2 h-2 bg-blue-500 rounded-full opacity-60"></div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mt-6">
        {/* Left Side - Language Selection */}
        {/* <div className="flex flex-col space-y-3 w-full sm:w-1/2">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Language</h3>
          <div className="flex sm:flex-col gap-3">
            {availableLanguages.map((lang) => (
              <button
                key={lang.language_code}
                onClick={() => handleLanguageSelect(lang.language_code, lang.language_name)}
                disabled={isShuffling}
                className={`flex-1 p-2.5 text-center border rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
                  selectedLanguageCode === lang.language_code
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md border-transparent'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100'
                } ${isShuffling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {lang.language_name}
              </button>
            ))}
          </div>
        </div> */}

        {/* Right Side - Action Buttons */}
        <div className="flex flex-col space-y-3 w-full sm:w-1/2">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Actions</h3>

          {/* Copy Review Button */}
          <button
            onClick={handleCopyReview}
            disabled={isShuffling}
            className="w-full bg-gradient-to-r from-teal-400 to-green-500 hover:from-teal-500 hover:to-green-600 
      disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed 
      text-white p-2.5 rounded-lg text-sm font-medium shadow-md transition-all duration-300"
          >
            Copy Review
          </button>

          {/* Change Review Button */}
          <button
            onClick={handleShuffle}
            disabled={isShuffling}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
      disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed 
      text-white p-2.5 rounded-lg text-sm font-medium shadow-md transition-all duration-300"
          >
            {isShuffling ? "Generating..." : "Change Review"}
          </button>
        </div>
      </div>



      {/* Privacy Notice */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 leading-relaxed text-center">
          Click &quot;Copy Review&quot; to copy the feedback to your clipboard and be redirected to Google Reviews.
          Use &quot;Change Review&quot; to generate a new review in your selected language.
        </p>
      </div>
    </div>
  );
}