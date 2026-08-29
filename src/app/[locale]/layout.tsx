import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import ThemeManager from '@/components/settings/ThemeManager';
import DataSyncer from '@/components/layout/DataSyncer';
import SnapshotConflictDialog from '@/components/layout/SnapshotConflictDialog';

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: "Navidash",
  description: "Personal Navigation Dashboard",
  icons: {
    icon: '/favicon.svg',
  },
};

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        <NextIntlClientProvider messages={messages}>
          <DataSyncer />
          <SnapshotConflictDialog />
          <ThemeManager />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
