import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../app/globals.css";

import {
  ClerkProvider,
  SignIn,
  ClerkLoaded,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";

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
    <ClerkProvider>
      <html lang="mn">
        <body className={inter.className}>
          <ClerkLoaded>
            
            <SignedIn>
              <UserProvider>
                <Header />
                <main className="mx-auto">
                  {children}
                </main>
              </UserProvider>
            </SignedIn>

            <SignedOut>
              <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="p-6 w-full max-w-md">
                  <SignIn routing="hash" />
                </div>
              </div>
            </SignedOut>

          </ClerkLoaded>
          <Toaster richColors position="top-center" />
        </body>
      </html>
    </ClerkProvider>
  );
}