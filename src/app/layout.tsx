import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PaywallProvider } from "@/context/PaywallContext";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Framia - Professional Product Photography",
  description: "Transform your product photos into professional, ready-to-use images with AI",
  keywords: ["product photography", "AI image generation", "e-commerce photos", "product photoshoot"],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${poppins.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <PaywallProvider>
            {children}
          </PaywallProvider>
        </AuthProvider>
        
        {/* Lemon Squeezy checkout script */}
        <Script 
          src="https://assets.lemonsqueezy.com/lemon.js" 
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
