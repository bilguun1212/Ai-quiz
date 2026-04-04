import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";

import Header from "@/components/Header";
import { UserProvider } from "@/contexts/UserContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quiz App",
  description: "Test your knowledge with our quiz app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      <html lang="mn">
        <body className={inter.className}>
          <Header />
          <main className="mx-auto">
            {children}
          </main>
          <Toaster richColors position="top-center" />
        </body>
      </html>
    </ClerkProvider>
  );
}