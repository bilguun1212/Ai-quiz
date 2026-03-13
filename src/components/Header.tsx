"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Quiz App
          </Link>
          <div className="flex items-center">
          
          </div>
        </div>
      </div>
    </header>
  );
}
