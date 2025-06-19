/**
 * 音声ピンの基本データ型
 */
export interface SoundPinData {
	id: string;
	latitude: number;
	longitude: number;
	primaryLabel: string;
	primaryConfidence: number;
	recordedAt: string;
	audioFilePath?: string;
	classificationResults?: unknown[];
	weatherData?: {
		temperature: number;
		condition: string;
		windSpeed?: number;
		humidity?: number;
	};
	timeTag?: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * 音声分類結果
 */
export interface AudioClassification {
	label: string;
	confidence: number;
	category: "music" | "speech" | "nature" | "urban" | "mechanical" | "other";
}

/**
 * 音声録音データ
 */
export interface AudioData {
	blob: Blob;
	url: string;
	duration: number;
	format: string;
	size: number;
	createdAt: Date;
}

/**
 * 録音状態
 */
export type RecordingStatus =
	| "idle"
	| "recording"
	| "processing"
	| "completed"
	| "error";

/**
 * 音声ピンマーカーのプロパティ
 */
export interface SoundPinMarkerProps {
	soundPin: SoundPinData;
	isSelected?: boolean;
	onClick?: (soundPin: SoundPinData) => void;
	onPlay?: (soundPin: SoundPinData) => void;
}

/**
 * 地理的境界
 */
export interface GeoBounds {
	north: number;
	south: number;
	east: number;
	west: number;
}

/**
 * 位置情報
 */
export interface LocationData {
	latitude: number;
	longitude: number;
	accuracy: number;
	timestamp: number;
}

/**
 * 音声ピンストアの状態
 */
export interface SoundPinStore {
	pins: SoundPinData[];
	selectedPin: SoundPinData | null;
	isLoading: boolean;
	error: string | null;

	// アクション
	addPin: (pin: SoundPinData) => void;
	removePin: (id: string) => void;
	updatePin: (id: string, updates: Partial<SoundPinData>) => void;
	selectPin: (pin: SoundPinData | null) => void;
	loadPins: (bounds: GeoBounds) => Promise<void>;
	clearPins: () => void;
	setError: (error: string | null) => void;
}
