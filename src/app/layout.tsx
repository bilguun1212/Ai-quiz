"use client";

import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";


import {
  ClerkProvider,
  SignIn,
  ClerkLoaded,
  Show,
} from "@clerk/nextjs";


import HeaderComponent from "@/components/Header";
import { UserProvider } from "@/contexts/UserContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="mn">
        <body className={inter.className}>
          <ClerkLoaded>
            
            <Show when="signed-in">
              <UserProvider>
                <HeaderComponent />
                <main className="mx-auto">
                  {children}
                </main>
              </UserProvider>
            </Show>

            <Show when="signed-out">
              <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="p-6 w-full max-w-md">
                  <SignIn routing="hash" />
                </div>
              </div>
            </Show>

          </ClerkLoaded>
          <Toaster richColors position="top-center" />
        </body>
      </html>
    </ClerkProvider>
  );
}