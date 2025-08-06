"use client";

import { useEffect } from "react";

interface QRScanTrackerProps {
  businessId: string;
}

export default function QRScanTracker({ businessId }: QRScanTrackerProps) {
  useEffect(() => {
    // Track QR scan when component mounts (page loads)
    const trackQRScan = async () => {
      try {
        await fetch(`/api/businesses/${businessId}/track-scan`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        // Silent tracking - no need to handle response or show errors to user
      } catch (error) {
        // Silent fail - QR tracking shouldn't interfere with user experience
        console.log("QR scan tracking failed:", error);
      }
    };

    trackQRScan();
  }, [businessId]);

  // This component doesn't render anything visible
  return null;
}
