import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "热点营销工作台",
  description: "从新闻热点到商品匹配，再到微博文案生成、审核与模拟发布的电商媒体运营工作台。",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="h-full bg-[#f4f5f7] text-[#1c1f2a]">
        <TooltipProvider delay={300}>
          {children}
          <Toaster position="top-center" />
        </TooltipProvider>
      </body>
    </html>
  )
}
