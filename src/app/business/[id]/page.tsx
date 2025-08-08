import { notFound } from "next/navigation";
import pool from "@/lib/db";
import BusinessFeedbackManager from "@/components/business/BusinessFeedbackManager";

interface BusinessPageProps {
  params: Promise<{ id: string }>;
}

async function getBusinessWithDetails(businessId: string) {
  try {
    // Get business details with tags
    const businessQuery = `
      SELECT 
        b.id, 
        b.name, 
        b.description, 
        b.address,
        b.website,
        b.google_maps_url,
        bt.name as business_type_name,
        COALESCE(
          STRING_AGG(btags.tag, ', '), 
          ''
        ) as business_tags
      FROM businesses b
      LEFT JOIN business_types bt ON b.business_type_id = bt.id
      LEFT JOIN business_tags btags ON b.id = btags.business_id
      WHERE b.id = $1 AND b.status = 'active'
      GROUP BY b.id, b.name, b.description, b.address, b.website, b.google_maps_url, bt.name
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
    console.error("Error fetching business with details:", error);
    return null;
  }
}

export default async function BusinessManagePage({ params }: BusinessPageProps) {
  const resolvedParams = await params;
  const businessData = await getBusinessWithDetails(resolvedParams.id);

  if (!businessData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Business Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage feedback templates for {businessData.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href={`/review/${businessData.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                View Review Page
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Business Info Card */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Business Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <span className="ml-2 text-gray-600">{businessData.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <span className="ml-2 text-gray-600">{businessData.business_type_name || 'Not specified'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tags:</span>
              <span className="ml-2 text-gray-600">{businessData.business_tags || 'None'}</span>
            </div>
            {businessData.address && (
              <div className="md:col-span-2 lg:col-span-3">
                <span className="font-medium text-gray-700">Address:</span>
                <span className="ml-2 text-gray-600">{businessData.address}</span>
              </div>
            )}
            {businessData.description && (
              <div className="md:col-span-2 lg:col-span-3">
                <span className="font-medium text-gray-700">Description:</span>
                <span className="ml-2 text-gray-600">{businessData.description}</span>
              </div>
            )}
            {businessData.website && (
              <div>
                <span className="font-medium text-gray-700">Website:</span>
                <a 
                  href={businessData.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-700"
                >
                  {businessData.website}
                </a>
              </div>
            )}
            {businessData.google_maps_url && (
              <div>
                <span className="font-medium text-gray-700">Google Reviews:</span>
                <a 
                  href={businessData.google_maps_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-700"
                >
                  View on Google
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Management */}
        <BusinessFeedbackManager businessData={businessData} />
      </div>
    </div>
  );
}