import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import {
  ClerkProvider,
  SignIn,
  ClerkLoaded,
  Show as SignedIn,
  Show as SignedOut,
} from "@clerk/nextjs";

import Header from "@/components/Header";
import { UserProvider } from "@/contexts/UserContext";

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
      <html lang="en">
        <body className={inter.className}>
          <ClerkLoaded>

          
            <SignedIn when={(auth: any) => auth}>
              <UserProvider>
                <Header />
                <main className="mx-auto">
                  {children}
                </main>
              </UserProvider>
            </SignedIn>

            <SignedOut when={(auth: any) => !auth}>
              <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="p-6 w-full max-w-md">
                  <SignIn routing="hash" />
                </div>
              </div>
            </SignedOut>

          </ClerkLoaded>
        </body>
      </html>
    </ClerkProvider>
  );
}