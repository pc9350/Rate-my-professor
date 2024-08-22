"use client"

import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import Hero from "./components/Hero";

export default function RootLayout({ children }) {
  return (
      <html lang="en">
        <body>
          {/* <Hero /> */}
          <ClerkProvider>
          {children}
          </ClerkProvider>
        </body>
      </html>
  );
}