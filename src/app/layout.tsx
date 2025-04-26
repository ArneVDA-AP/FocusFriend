import type { Metadata } from 'next';
import { VT323 } from 'next/font/google'; // Import VT323
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

// Configure VT323 font
const vt323 = VT323({
  weight: '400', // VT323 only supports 400 weight
  subsets: ['latin'],
  variable: '--font-vt323', // Define CSS variable
  display: 'swap', // Ensure text is visible during font load
});


export const metadata: Metadata = {
  title: 'StudyQuest',
  description: 'Track your studying with tasks, pomodoro timer, and gamification.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply the font variable to the body */}
      <body className={`${vt323.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
