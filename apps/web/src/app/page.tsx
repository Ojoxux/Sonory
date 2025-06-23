"use client";

import { UIOverlay } from "@/components/organisms/UIOverlay";
import dynamic from "next/dynamic";
import Head from "next/head";
import type { ReactElement } from "react";
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
				<div className="absolute inset-0 z-0 pointer-events-auto">
					<MapComponent
						onGeolocationReady={handleGeolocationReady}
						onReturnToLocationReady={handleReturnToLocationReady}
						onBearingChange={handleBearingChange}
					/>
				</div>
				<div className="absolute inset-0 z-10 pointer-events-none">
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
