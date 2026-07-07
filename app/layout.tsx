import type { Metadata } from 'next';
import { Inter, Syne } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['500', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Jawaab AI - Never Miss Another Customer',
  description: 'When you can\'t answer the phone, Jawaab AI answers for you, captures every lead, and instantly sends you a WhatsApp summary.',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable} dark antialiased`}>
      <body className="bg-background text-primary min-h-screen relative overflow-x-hidden">
        {/* Subtle Radial Glow */}
        <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(214,255,0,0.03)] to-transparent z-[-2] blur-3xl pointer-events-none"></div>

        <main className="relative z-0">
          {children}
        </main>
      </body>
    </html>
  );
}
