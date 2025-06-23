import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const arialRoundedMTPro = localFont({
	src: "../../public/fonts/Arial-Rounded-MT-Pro-Bold.woff2",
	weight: "700",
	style: "normal",
	variable: "--font-arial-rounded-mt-pro",
	display: "swap",
});

export const metadata: Metadata = {
	title: "Sonory",
	description:
		"周りの音を録音して、AI が分析し、時間・天気と一緒に記録するアプリ",
	manifest: "/manifest.json",
	metadataBase: new URL("https://sonory.vercel.app"),
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Sonory",
		startupImage: [
			{
				url: "/icons/icon-512x512.png",
				media:
					"(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
			},
		],
	},
	applicationName: "Sonory",
	keywords: [
		"音声録音",
		"AI分析",
		"地図",
		"PWA",
		"オフライン",
		"Sonory",
		"環境音",
		"スタンプ",
	],
	authors: [{ name: "TeamONY" }],
	category: "lifestyle",
	icons: {
		icon: [
			{
				url: "/icons/icon-192x192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				url: "/icons/icon-512x512.png",
				sizes: "512x512",
				type: "image/png",
			},
		],
		apple: [
			{
				url: "/icons/icon-152x152.png",
				sizes: "152x152",
				type: "image/png",
			},
			{
				url: "/icons/icon-192x192.png",
				sizes: "192x192",
				type: "image/png",
			},
		],
	},
	openGraph: {
		type: "website",
		title: "Sonory",
		description:
			"周りの音を録音して、AI が分析し、時間・天気と一緒に記録するアプリ",
		siteName: "Sonory",
		images: [
			{
				url: "/icons/icon-512x512.png",
				width: 512,
				height: 512,
				alt: "Sonory アプリアイコン",
			},
		],
	},
	twitter: {
		card: "summary",
		title: "Sonory",
		description:
			"周りの音を録音して、AI が分析し、時間・天気と一緒に記録するアプリ",
		images: ["/icons/icon-512x512.png"],
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	viewportFit: "cover",
	themeColor: "#1a202c",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ja">
			<head>
				{/* PWA メタタグ */}
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="Sonory" />
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="msapplication-TileColor" content="#1a202c" />
				<meta name="msapplication-tap-highlight" content="no" />

				{/* PWA スプラッシュスクリーン用アイコン */}
				<link
					rel="apple-touch-icon"
					sizes="152x152"
					href="/icons/icon-152x152.png"
				/>
				<link
					rel="apple-touch-icon"
					sizes="192x192"
					href="/icons/icon-192x192.png"
				/>

				{/* その他のPWAアイコン */}
				<link
					rel="icon"
					type="image/png"
					sizes="32x32"
					href="/icons/icon-32x32.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="16x16"
					href="/icons/icon-16x16.png"
				/>
				<link rel="mask-icon" href="/Sonory-App-Icon.svg" color="#1a202c" />

				{/* プリロード重要リソース */}
				<link rel="preconnect" href="https://api.mapbox.com" />
				<link rel="preconnect" href="https://api.open-meteo.com" />
			</head>
			<body
				className={`${arialRoundedMTPro.variable} antialiased touch-manipulation`}
			>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
