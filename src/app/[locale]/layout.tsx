import type { Metadata } from "next";
import { Inter, Outfit, Bebas_Neue, Slabo_27px } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import ThemeManager from '@/components/settings/ThemeManager';
import DataSyncer from '@/components/layout/DataSyncer';

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: '--font-bebas' });
const slabo = Slabo_27px({ weight: "400", subsets: ["latin"], variable: '--font-slabo' });

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
      <body className={`${inter.variable} ${outfit.variable} ${bebas.variable} ${slabo.variable} font-sans`}>
        <NextIntlClientProvider messages={messages}>
          <DataSyncer />
          <ThemeManager />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
