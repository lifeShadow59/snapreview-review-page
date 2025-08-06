import { notFound } from "next/navigation";
import pool from "@/lib/db";
import ReviewForm from "@/components/review/ReviewForm";
import QRScanTracker from "@/components/review/QRScanTracker";

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

async function getBusinessForReview(businessId: string) {
  try {
    const query = `
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

    const result = await pool.query(query, [businessId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching business for review:", error);
    return null;
  }
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const resolvedParams = await params;
  const business = await getBusinessForReview(resolvedParams.id);

  if (!business) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-white font-bold text-lg sm:text-2xl">
                {business.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 px-2">
              {business.name}
            </h1>
            {business.business_type_name && (
              <p className="text-base sm:text-lg text-gray-600 mt-1 sm:mt-2 px-2">
                {business.business_type_name}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Business Info */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
            About Us
          </h2>

          {business.description && (
            <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">
              {business.description}
            </p>
          )}

          {business.address && (
            <div className="mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                Location
              </h3>
              <p className="text-gray-600 text-sm sm:text-base break-words">
                {business.address}
              </p>
            </div>
          )}

          {business.website && (
            <div className="mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                Website
              </h3>
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-sm sm:text-base break-all"
              >
                {business.website}
              </a>
            </div>
          )}
        </div>

        {/* QR Scan Tracker */}
        <QRScanTracker businessId={business.id} />

        {/* Review Form */}
        <ReviewForm business={business} />
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8 sm:mt-12">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1 sm:mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold mr-2">
                QR
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                Powered by ReviewQR
              </span>
            </div>
            <p className="text-xs text-gray-500 px-2">
              Digital review management for modern businesses
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
