export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import pool from '@/lib/db';
import QRNotActivatedClient from '@/components/qr/QRNotActivatedClient';
import Image from 'next/image';

export default async function CodePage({ params }: { params: any }) {
  const resolvedParams = await params;
  const code = String(resolvedParams?.code ?? '');

  let businessId: string | null = null;
  try {
    let result = await pool.query(
      'SELECT business_id FROM public.qr_codes WHERE LOWER(code) = LOWER($1) LIMIT 1;',
      [code]
    );

    if (!result.rows[0]) {
      result = await pool.query(
        'SELECT business_id FROM public.barcodes WHERE LOWER(code) = LOWER($1) LIMIT 1;',
        [code]
      );
    }

    businessId = result.rows[0]?.business_id ?? null;
  } catch (error) {
    // Log DB lookup error and continue to render the not-activated page below
    console.error('QR lookup DB error for code:', code, error);
  }

  if (businessId) {
    redirect(`/review/${businessId}`);
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg ring-1 ring-slate-200 dark:ring-0 p-8 text-center">
        <div className="mx-auto w-40">
          <Image src="/logo-design-5-modern-geometric.svg" alt="SnapReview" width={200} height={60} className="w-full h-auto" priority />
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-slate-100">QR Code Not Activated</h1>

        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          This code is not linked to any business yet. Share it with the admin to activate the QR.
        </p>

        <div className="mt-6">
          <div className="inline-block bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-md font-mono text-lg font-medium text-slate-900 dark:text-slate-100">
            {code}
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Admin phone: <a className="text-indigo-600 dark:text-indigo-300 underline" href="tel:+919512899907">+91 9512899907</a></p>

        <QRNotActivatedClient code={code} />
      </div>
    </main>
  );
}
