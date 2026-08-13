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
              background: "#23272e",
              color: "#e9ecf1",
              border: "1px solid #2f3742",
              borderRadius: "0.75rem",
              fontFamily: "Inter, sans-serif",
            },
            success: {
              iconTheme: {
                primary: "#c8f323",
                secondary: "#293500",
              },
            },
            error: {
              iconTheme: {
                primary: "#ffb4ab",
                secondary: "#690005",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
