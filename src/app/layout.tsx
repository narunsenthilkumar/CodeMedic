import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "CodeMedic — Don't just fix the code. Prove the fix works.",
  description:
    'AI-powered repository debugging, closed-loop software repair, and isolated automated verification.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen selection:bg-medic-500/30 selection:text-medic-200">
        {children}
      </body>
    </html>
  );
}
