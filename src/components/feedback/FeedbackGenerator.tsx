"use client";

import { useState, useEffect, useCallback } from "react";

interface Business {
  id: string;
  name: string;
  business_type_name?: string;
  business_tags?: string;
  google_maps_url?: string;
}

type Language = 'english' | 'hindi' | 'gujarati';

export default function FeedbackGenerator({ business }: { business: Business }) {
  const [currentFeedback, setCurrentFeedback] = useState("Great service and excellent experience! Highly recommended.");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english');
  const [isLoading, setIsLoading] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // Load initial feedback on component mount
  useEffect(() => {
    const loadInitialFeedback = async () => {
      try {
        // First try to get from database
        const dbResponse = await fetch(`/api/businesses/${business.id}/feedback`);
        const dbData = await dbResponse.json();

        if (dbResponse.ok && dbData.feedbacks && dbData.feedbacks.length > 0) {
          // Use random feedback from database
          const randomFeedback = dbData.feedbacks[Math.floor(Math.random() * dbData.feedbacks.length)];
          setCurrentFeedback(randomFeedback);
        } else {
          // Generate new feedback if no database feedback exists
          const response = await fetch(`/api/businesses/${business.id}/generate-live-feedback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              language: selectedLanguage,
              businessName: business.name,
              businessType: business.business_type_name,
              businessTags: business.business_tags
            }),
          });

          const data = await response.json();

          if (response.ok && data.feedback) {
            setCurrentFeedback(data.feedback);
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
  }, [business.id, business.name, business.business_type_name, business.business_tags]);

  const generateNewFeedback = useCallback(async (language: Language) => {
    setIsShuffling(true);
    try {
      const response = await fetch(`/api/businesses/${business.id}/generate-live-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language,
          businessName: business.name,
          businessType: business.business_type_name,
          businessTags: business.business_tags
        }),
      });

      const data = await response.json();

      if (response.ok && data.feedback) {
        setCurrentFeedback(data.feedback);
      } else {
        throw new Error(data.error || 'Failed to generate feedback');
      }
    } catch (error) {
      console.error("Error generating feedback:", error);
      // Fallback feedback based on language
      const fallbackFeedbacks = {
        english: "Excellent service and great experience! Highly recommended.",
        hindi: "बहुत अच्छी सेवा और शानदार अनुभव! अत्यधिक अनुशंसित।",
        gujarati: "ઉત્કૃષ્ટ સેવા અને મહાન અનુભવ! ખૂબ ભલામણ કરેલ છે।"
      };
      setCurrentFeedback(fallbackFeedbacks[language]);
    } finally {
      setIsShuffling(false);
    }
  }, [business.id, business.name, business.business_type_name, business.business_tags]);

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
  };

  const handleShuffle = () => {
    // Show immediate placeholder while generating
    const placeholders = {
      english: "Generating your personalized review...",
      hindi: "आपकी व्यक्तिगत समीक्षा तैयार की जा रही है...",
      gujarati: "તમારી વ્યક્તિગત સમીક્ષા તૈયાર કરવામાં આવી રહી છે..."
    };

    setCurrentFeedback(placeholders[selectedLanguage]);
    generateNewFeedback(selectedLanguage);
  };

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

  const languageLabels = {
    english: 'English',
    hindi: 'हिंदी',
    gujarati: 'ગુજરાતી'
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
          {isLoading ? (
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading feedback...</span>
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
        <div className="flex flex-col space-y-3 w-full sm:w-1/2">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Language</h3>
          <div className="flex sm:flex-col gap-3">
            {(['english', 'hindi', 'gujarati'] as Language[]).map((language) => (
              <button
                key={language}
                onClick={() => handleLanguageSelect(language)}
                className={`flex-1 p-2.5 text-center border rounded-lg text-sm font-medium transition-all duration-300 shadow-sm ${selectedLanguage === language
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600'
                  }`}
              >
                {languageLabels[language]}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side - Action Buttons */}
        <div className="flex flex-col space-y-3 w-full sm:w-1/2">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Actions</h3>

          {/* Copy Review Button */}
          <button
            onClick={handleCopyReview}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-teal-400 to-green-500 hover:from-teal-500 hover:to-green-600 
      disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed 
      text-white p-2.5 rounded-lg text-sm font-medium shadow-md transition-all duration-300"
          >
            Copy Review
          </button>

          {/* Change Review Button */}
          <button
            onClick={handleShuffle}
            disabled={isLoading || isShuffling}
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
          Use &quot;Shuffle Review&quot; to generate a new review in your selected language.
        </p>
      </div>
    </div>
  );
}