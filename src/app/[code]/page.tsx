import { redirect } from 'next/navigation';
import pool from '@/lib/db';

interface CodePageProps {
  params: Promise<{ code: string }>;
}

export default async function CodePage({ params }: CodePageProps) {
  const resolvedParams = await params;
  const code = resolvedParams.code;

  let businessId: string | undefined;
  try {
    // Case-insensitive lookup in public.qr_codes
    let result = await pool.query(
      'SELECT business_id FROM public.qr_codes WHERE LOWER(code) = LOWER($1) LIMIT 1;',
      [code]
    );

    // fallback to barcodes table
    if (!result.rows[0]) {
      result = await pool.query(
        'SELECT business_id FROM public.barcodes WHERE LOWER(code) = LOWER($1) LIMIT 1;',
        [code]
      );
    }

    businessId = result.rows[0]?.business_id;
  } catch (error) {
    // Log DB lookup error and fall through to not-found redirect below
    console.error('QR lookup DB error for code:', code, error);
  }

  // perform redirect outside of try/catch to avoid catching Next's RedirectError
  if (businessId) {
    redirect(`/review/${businessId}`);
  }

  redirect('/not-found');

  return null; // never rendered
}
