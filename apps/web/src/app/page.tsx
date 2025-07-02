"use client";

import { UIOverlay } from "@/components/organisms/UIOverlay";
import { useDebugStore } from "@/store/useDebugStore";
import dynamic from "next/dynamic";
import Head from "next/head";
import type { ReactElement } from "react";
import { useEffect } from "react";
import { useHomePage } from "./hooks/useHomePage";

// MapComponentをクライアントサイドのみでロードするために動的インポート（SSRなし）
const MapComponent = dynamic(
	() =>
		import("@/components/organisms/MapComponent").then(
			(mod) => mod.MapComponent,
		),
	{ ssr: false },
);

/**
 * Sonoryのホーム画面コンポーネント
 *
 * フルスクリーンマップとUIオーバーレイを表示する
 *
 * @returns ホーム画面のJSX要素
 */
export default function Home(): ReactElement {
	const {
		position,
		debugTimeOverride,
		mapBearing,
		handleSettingsClick,
		handleCompassClick,
		handleGeolocationReady,
		handleReturnToLocationReady,
		handleBearingChange,
	} = useHomePage();

	const { setDebugMode } = useDebugStore();

	// 統合テスト用にデバッグモードを有効化
	useEffect(() => {
		if (process.env.NODE_ENV === "development") {
			setDebugMode(true);
		}
	}, [setDebugMode]);

	return (
		<>
			<Head>
				<script type="application/ld+json">
					{`
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Sonory",
            "url": "https://sonory.vercel.app",
            "applicationCategory": "Productivity",
            "operatingSystem": "All",
            "browserRequirements": "Requires JavaScript"
          }
          `}
				</script>
			</Head>
			<div className="relative h-screen w-screen overflow-hidden">
				<div className="pointer-events-auto absolute inset-0 z-0">
					<MapComponent
						onGeolocationReady={handleGeolocationReady}
						onReturnToLocationReady={handleReturnToLocationReady}
						onBearingChange={handleBearingChange}
					/>
				</div>
				<div className="pointer-events-none absolute inset-0 z-10">
					<UIOverlay
						onSettingsClick={handleSettingsClick}
						onCompassClick={handleCompassClick}
						latitude={position?.latitude}
						longitude={position?.longitude}
						debugTimeOverride={debugTimeOverride}
						mapBearing={mapBearing}
					/>
				</div>
			</div>
		</>
	);
}
