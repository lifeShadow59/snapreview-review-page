import { notFound } from "next/navigation";
import pool from "@/lib/db";
import AddFeedbackForm from "@/components/feedback/AddFeedbackForm";

interface FeedbackPageProps {
    params: Promise<{ id: string }>;
}

async function getBusinessWithFeedbacks(businessId: string) {
    try {
        // Get business details
        const businessQuery = `
      SELECT 
        b.id, 
        b.name, 
        b.description, 
        b.address,
        b.website,
        bt.name as business_type_name
      FROM businesses b
      LEFT JOIN business_types bt ON b.business_type_id = bt.id
      WHERE b.id = $1 AND b.status = 'active'
    `;

        const businessResult = await pool.query(businessQuery, [businessId]);

        if (businessResult.rows.length === 0) {
            return null;
        }

        const business = businessResult.rows[0];

        // Get existing feedbacks
        const feedbackQuery = `
      SELECT id, feedback, created_at
      FROM business_feedbacks
      WHERE business_id = $1
      ORDER BY created_at DESC
    `;

        const feedbackResult = await pool.query(feedbackQuery, [businessId]);

        return {
            ...business,
            feedbacks: feedbackResult.rows
        };
    } catch (error) {
        console.error("Error fetching business with feedbacks:", error);
        return null;
    }
}

export default async function FeedbackManagePage({ params }: FeedbackPageProps) {
    const resolvedParams = await params;
    const businessData = await getBusinessWithFeedbacks(resolvedParams.id);

    if (!businessData) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                Feedback Management
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Manage feedback templates for {businessData.name}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    {/* Add New Feedback Form */}
                    <div>
                        <AddFeedbackForm
                            businessId={businessData.id}
                            onFeedbackAdded={() => {
                                // In a real app, you'd refresh the data here
                                window.location.reload();
                            }}
                        />
                    </div>

                    {/* Existing Feedbacks List */}
                    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Existing Feedback Templates ({businessData.feedbacks.length})
                        </h3>

                        {businessData.feedbacks.length === 0 ? (
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
                                {businessData.feedbacks.map((feedback: any) => (
                                    <div
                                        key={feedback.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <p className="text-sm text-gray-800 mb-2">
                                            {feedback.feedback}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Added: {new Date(feedback.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Business Info */}
                <div className="mt-8 bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Business Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-gray-700">Name:</span>
                            <span className="ml-2 text-gray-600">{businessData.name}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Type:</span>
                            <span className="ml-2 text-gray-600">{businessData.business_type_name || 'Not specified'}</span>
                        </div>
                        {businessData.address && (
                            <div className="md:col-span-2">
                                <span className="font-medium text-gray-700">Address:</span>
                                <span className="ml-2 text-gray-600">{businessData.address}</span>
                            </div>
                        )}
                        {businessData.description && (
                            <div className="md:col-span-2">
                                <span className="font-medium text-gray-700">Description:</span>
                                <span className="ml-2 text-gray-600">{businessData.description}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}