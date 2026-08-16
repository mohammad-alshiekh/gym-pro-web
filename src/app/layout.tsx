import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "GymBro — Performance Management Portal",
  description:
    "Professional gym management portal for Super Admins and Gym Managers.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            className: "toast-dark",
            duration: 3000,
            style: {
              background: "#20201f",
              color: "#ffffff",
              border: "1px solid #2a2a2a",
              borderRadius: "0.75rem",
              fontFamily: "Manrope, sans-serif",
            },
            success: {
              iconTheme: {
                primary: "#cafd00",
                secondary: "#3a4a00",
              },
            },
            error: {
              iconTheme: {
                primary: "#ff6e81",
                secondary: "#5c1620",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
