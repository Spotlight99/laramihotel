import type { Metadata } from "next";
import "./gloals.css";
import { AuthProvider } from "@/lib/authContext";


export const metadata: Metadata = {
  title: "Larami Holiday Hotel | Port Harcourt",
  description:
    "Comfortable & Affordable Stay in Port Harcourt. Modern rooms, restaurant, lounge, karaoke club, and premium facilities at Larami Holiday Hotel.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Lato:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <AuthProvider> {children} </AuthProvider>
        </body>
    </html>
  );
}
