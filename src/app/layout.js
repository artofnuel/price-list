import './globals.css'

export const metadata = {
  title: 'PriceForge — AI-Powered Pricing for Professionals',
  description:
    'Generate structured, realistic price lists for your professional services using AI. Tailored to your experience, market, and location.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
