"use client";

import Image from 'next/image';
import type { SubscriptionStatus } from '@/lib/subscription';


interface SubscriptionErrorProps {
  status: SubscriptionStatus;
  paymentUrl?: string;
}

export default function SubscriptionError({ status, paymentUrl }: SubscriptionErrorProps) {
  const getErrorIcon = () => {
    switch (status.subscriptionStatus) {
      case 'cancelled':
        return '🚫';
      case 'expired':
        return '⏰';
      case 'suspended':
        return '⚠️';
      case 'not_found':
        return '❓';
      default:
        return '🔒';
    }
  };

  const getErrorTitle = () => {
    switch (status.subscriptionStatus) {
      case 'cancelled':
        return 'Subscription Cancelled';
      case 'expired':
        return 'Subscription Expired';
      case 'suspended':
        return 'Account Suspended';
      case 'not_found':
        return 'Business Not Found';
      default:
        return 'Access Unavailable';
    }
  };

  const getErrorMessage = () => {
    if (status.reason) {
      return status.reason;
    }

    switch (status.subscriptionStatus) {
      case 'cancelled':
        return 'This business subscription has been cancelled. The QR code is no longer active.';
      case 'expired':
        return 'This business subscription has expired. Please contact the business to renew their subscription.';
      case 'suspended':
        return 'This business account has been temporarily suspended.';
      case 'not_found':
        return 'The QR code you scanned is invalid or the business no longer exists.';
      default:
        return 'QR code access is currently unavailable for this business.';
    }
  };

  const getActionMessage = () => {
    switch (status.subscriptionStatus) {
      case 'cancelled':
      case 'expired':
        return 'Please contact the business directly for assistance.';
      case 'suspended':
        return 'Please contact SnapReview.ai support for more information.';
      case 'not_found':
        return 'Please verify the QR code and try again.';
      default:
        return 'Please try again later or contact support.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">{getErrorIcon()}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {getErrorTitle()}
          </h1>
          <p className="text-gray-600">
            {status.businessName !== 'Unknown' && (
              <span className="font-medium">{status.businessName}</span>
            )}
          </p>
        </div>

        {/* Error Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center">
            <p className="text-gray-700 mb-4 leading-relaxed">
              {getErrorMessage()}
            </p>
            
            {status.expiresAt && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Subscription expired:</span>{' '}
                  {new Date(status.expiresAt).toLocaleDateString()}
                </p>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600">
                {getActionMessage()}
              </p>
            </div>
            {/* Action Button: allow business to go to payment page to reactivate */}
            {paymentUrl && (
              <div className="mt-4 text-center">
                <a
                  href={paymentUrl}
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Pay now to active QR Code
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">Need Help?</h3>
          <p className="text-sm text-blue-700 mb-2">
            If you believe this is an error, please contact:
          </p>
            <div className="text-sm text-blue-700">
            <p>📧 support@snapreview.ai</p>
              <a href="https://snapreview.ai" target="_blank" rel="noopener noreferrer">🌐 snapreview.ai</a>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center">
          <div className="flex items-center justify-center mb-2">
            <a href="https://snapreview.ai" target="_blank" rel="noopener noreferrer">
              <Image 
                src="/logo-design-5-modern-geometric.svg" 
                alt="SnapReview.ai" 
                width={150}
                height={45}
                className="h-10 w-auto"
              />
            </a>
          </div>
          <p className="text-xs text-gray-500">
            AI review management for modern businesses
          </p>
        </footer>
      </div>
    </div>
  );
}