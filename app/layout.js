import "./globals.css";

export const metadata = {
  title: "Watchr — AI Tracking Agent",
  description: "Monitor news, prices, and events with AI-powered weekly digests",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
