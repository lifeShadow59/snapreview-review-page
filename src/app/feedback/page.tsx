'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface FeedbackData {
  review: string;
  language: string;
  tags: string[];
}

export default function FeedbackPage() {
  const [currentReview, setCurrentReview] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tags] = useState<string[]>(['service', 'quality', 'experience']); // Default tags
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  
  // You can customize this Google Review URL for your business
  const googleReviewUrl = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || 'https://www.google.com/search?q=write+a+review';

  const languages = [
    { code: 'english', label: 'English' },
    { code: 'hindi', label: 'Hindi' },
    { code: 'gujarati', label: 'Gujarati' }
  ];

  const generateReview = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: selectedLanguage,
          tags: tags
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentReview(data.review);
      } else {
        // Fallback review if API fails
        setCurrentReview(getFallbackReview(selectedLanguage));
      }
    } catch (error) {
      console.error('Error generating review:', error);
      setCurrentReview(getFallbackReview(selectedLanguage));
    } finally {
      setIsLoading(false);
    }
  }, [selectedLanguage, tags]);

  // Load initial review on component mount
  useEffect(() => {
    generateReview();
  }, [generateReview]);

  const getFallbackReview = (language: string): string => {
    const fallbackReviews = {
      english: "The service is very good and the staff is professional. Highly recommended!",
      hindi: "सेवा बहुत अच्छी है और स्टाफ पेशेवर है। अत्यधिक अनुशंसित!",
      gujarati: "સેવા ખૂબ સારી છે અને સ્ટાફ વ્યાવસાયિક છે. ખૂબ ભલામણ!"
    };
    return fallbackReviews[language as keyof typeof fallbackReviews] || fallbackReviews.english;
  };

  const copyReview = async () => {
    // Helper: send tracking/delete request with timeout so redirect isn't blocked
    const postTrackCopy = async (reviewText: string, language: string) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1200); // 1.2s timeout
      try {
        await fetch('/api/track-copy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ review: reviewText, language }),
          signal: controller.signal
        });
      } catch (e) {
        // swallow errors — tracking is best-effort
        console.warn('track-copy request failed or timed out', e);
      } finally {
        clearTimeout(timeout);
      }
    };

    try {
      // Copy to clipboard (modern API)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentReview);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = currentReview;
        textArea.style.position = 'fixed';
        textArea.style.left = '-99999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      // trigger backend delete/tracking but don't block the UX for long
      postTrackCopy(currentReview, selectedLanguage);

      // show visual confirmation
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);

      // Redirect to Google Review in a new tab shortly after copy
      setTimeout(() => {
        window.open(googleReviewUrl, '_blank');
      }, 500);
    } catch (error) {
      console.error('Failed to copy review (and fallback):', error);
      // still try to notify backend even if copy fails
      postTrackCopy(currentReview, selectedLanguage);
      // open google review anyway
      setTimeout(() => {
        window.open(googleReviewUrl, '_blank');
      }, 500);
    }
  };

  const shuffleReview = () => {
    generateReview();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-white font-bold text-lg sm:text-2xl">F</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 px-2">
              Feedback Generator
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mt-1 sm:mt-2 px-2">
              Generate authentic reviews in multiple languages
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Review Display Box */}
        <div className="bg-white rounded-lg border-4 border-black p-8 sm:p-12 mb-8 min-h-[250px] flex items-center justify-center shadow-lg">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Generating review...</span>
            </div>
          ) : (
            <p className="text-xl sm:text-2xl text-gray-800 text-center leading-relaxed font-medium">
              {currentReview}
            </p>
          )}
        </div>

        {/* Controls Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Language Selection */}
          <div>
            {/* <div className="space-y-4">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => setSelectedLanguage(language.code)}
                  className={`w-full p-4 text-left border-4 border-black rounded-lg transition-colors font-semibold text-lg ${
                    selectedLanguage === language.code
                      ? 'bg-gray-800 text-white'
                      : 'bg-white text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {language.label}
                </button>
              ))}
            </div> */}
          </div>

          {/* Action Buttons */}
          <div>
            <div className="space-y-4">
              <button
                onClick={copyReview}
                className="w-full p-4 bg-white border-4 border-black rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg text-gray-800"
              >
                {copySuccess ? '✓ Copied!' : 'Copy review'}
              </button>
              <button
                onClick={shuffleReview}
                disabled={isLoading}
                className="w-full p-4 bg-white border-4 border-black rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Generating...' : 'Shuffle review with symble'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8 sm:mt-12">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1 sm:mb-2">
              <Image 
                src="/logo-design-5-modern-geometric.svg" 
                alt="SnapReview.ai" 
                width={200}
                height={60}
                className="h-12 sm:h-16 w-auto"
              />
            </div>
            <p className="text-xs text-gray-500 px-2">
              AI review management for modern businesses
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}