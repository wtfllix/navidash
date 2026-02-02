import type { Metadata } from "next";
import { Inter, DM_Serif_Display, Outfit, Bebas_Neue } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const dmSerif = DM_Serif_Display({ weight: "400", subsets: ["latin"], variable: '--font-dm-serif' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: '--font-bebas' });

export const metadata: Metadata = {
  title: "Navidash",
  description: "Personal Navigation Dashboard",
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
      <body className={`${inter.variable} ${dmSerif.variable} ${outfit.variable} ${bebas.variable} font-sans`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
