"use client";

import { useState } from "react";

interface BusinessData {
  id: string;
  name: string;
  business_type_name?: string;
  business_tags?: string;
  description?: string;
  address?: string;
  website?: string;
  feedbacks: Array<{
    id: number;
    feedback: string;
    created_at: string;
  }>;
}

interface BusinessFeedbackManagerProps {
  businessData: BusinessData;
}

export default function BusinessFeedbackManager({ businessData }: BusinessFeedbackManagerProps) {
  const [feedback, setFeedback] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [feedbacks, setFeedbacks] = useState(businessData.feedbacks);

  const generateAIFeedback = async () => {
    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch(`/api/businesses/${businessData.id}/generate-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setFeedback(data.feedback);
      } else {
        setError(data.error || "Failed to generate feedback");
      }
    } catch (error) {
      console.error("Error generating feedback:", error);
      setError("An unexpected error occurred while generating feedback");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedback.trim()) {
      setError("Please enter feedback or generate AI feedback");
      return;
    }

    if (feedback.trim().length > 1000) {
      setError("Feedback must be 1000 characters or less");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/businesses/${businessData.id}/add-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: feedback.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFeedback("");
        
        // Add new feedback to the list
        const newFeedback = {
          id: data.feedback.id,
          feedback: data.feedback.feedback,
          created_at: data.feedback.created_at
        };
        setFeedbacks([newFeedback, ...feedbacks]);
        
        // Reset success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || "Failed to add feedback");
      }
    } catch (error) {
      console.error("Error adding feedback:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteFeedback = async (feedbackId: number) => {
    if (!confirm("Are you sure you want to delete this feedback?")) {
      return;
    }

    try {
      const response = await fetch(`/api/businesses/${businessData.id}/feedback/${feedbackId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFeedbacks(feedbacks.filter(f => f.id !== feedbackId));
      } else {
        setError("Failed to delete feedback");
      }
    } catch (error) {
      console.error("Error deleting feedback:", error);
      setError("An unexpected error occurred while deleting feedback");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
      {/* Add New Feedback Form */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Add New Feedback
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Feedback Textarea */}
          <div>
            <label
              htmlFor="feedback"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Feedback Content
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
              placeholder="Enter feedback content or generate AI feedback based on your business details..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                {feedback.length}/1000 characters
              </p>
            </div>
          </div>

          {/* AI Generate Button */}
          <button
            type="button"
            onClick={generateAIFeedback}
            disabled={isGenerating}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-md font-medium flex items-center justify-center transition-colors text-sm mb-3"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating AI Feedback...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Generate AI Feedback
              </>
            )}
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !feedback.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-md font-medium flex items-center justify-center transition-colors text-sm"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adding Feedback...
              </>
            ) : (
              "Add Feedback to List"
            )}
          </button>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-green-800 text-sm flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Feedback added successfully!
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </form>

        {/* Info Box */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-800">
            💡 <strong>AI Generation:</strong> Based on your business name ({businessData.name}), 
            type ({businessData.business_type_name || 'Not specified'}), 
            {businessData.business_tags && ` tags (${businessData.business_tags}),`} 
            and description to create realistic customer feedback.
          </p>
        </div>
      </div>

      {/* Existing Feedbacks List */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Feedback Templates ({feedbacks.length})
          </h3>
        </div>

        {feedbacks.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.697-.413l-2.725.688c-.442.111-.905-.111-.905-.587l.688-2.725A8.955 8.955 0 014 12C4 7.582 7.582 4 12 4s8 3.582 8 8z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">
              No feedback templates yet. Add your first one using the form on the left.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {feedbacks.map((feedbackItem) => (
              <div
                key={feedbackItem.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-gray-800 flex-1 pr-2">
                    {feedbackItem.feedback}
                  </p>
                  <button
                    onClick={() => deleteFeedback(feedbackItem.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Delete feedback"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 012 0v4a1 1 0 11-2 0V9zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V9z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Added: {new Date(feedbackItem.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}