import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developer Training System | Adaptive Learning & Middle Gate',
  description: 'Adaptive developer training platform with spaced repetition, AI grading, and Middle readiness tracking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0b0f19] text-gray-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
