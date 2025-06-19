/**
 * 音声ファイルの情報を取得
 */
export async function getAudioInfo(file: File): Promise<{
	duration: number;
	format: string;
	size: number;
}> {
	return new Promise((resolve, reject) => {
		const audio = new Audio();
		const url = URL.createObjectURL(file);

		audio.onloadedmetadata = () => {
			URL.revokeObjectURL(url);
			resolve({
				duration: audio.duration,
				format: file.type,
				size: file.size,
			});
		};

		audio.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("音声ファイルの読み込みに失敗しました"));
		};

		audio.src = url;
	});
}

/**
 * 音声ファイルを指定形式に変換
 */
export async function convertAudioFormat(
	audioBlob: Blob,
	targetFormat: "webm" | "mp3" | "wav",
): Promise<Blob> {
	// 実際の実装では、Web Audio APIやFFmpeg.wasmを使用
	// ここでは簡単な実装例を示す

	if (targetFormat === "webm") {
		return audioBlob;
	}

	// 他の形式への変換は実装が必要
	throw new Error(`${targetFormat}への変換は未実装です`);
}

/**
 * 音声の音量レベルを計算
 */
export async function calculateAudioLevel(audioBlob: Blob): Promise<number[]> {
	return new Promise((resolve, reject) => {
		const audioContext = new (
			window.AudioContext ||
			(window as typeof window & { webkitAudioContext?: typeof AudioContext })
				.webkitAudioContext ||
			AudioContext
		)();
		const fileReader = new FileReader();

		fileReader.onload = async (e) => {
			try {
				const arrayBuffer = e.target?.result as ArrayBuffer;
				const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

				const channelData = audioBuffer.getChannelData(0);
				const levels = [];
				const chunkSize = Math.floor(channelData.length / 100); // 100個のサンプル

				for (let i = 0; i < channelData.length; i += chunkSize) {
					const chunk = channelData.slice(i, i + chunkSize);
					const rms = Math.sqrt(
						chunk.reduce((sum, val) => sum + val * val, 0) / chunk.length,
					);
					levels.push(Math.min(100, rms * 100));
				}

				resolve(levels);
			} catch (error) {
				reject(error);
			}
		};

		fileReader.onerror = () =>
			reject(new Error("音声ファイルの読み込みに失敗しました"));
		fileReader.readAsArrayBuffer(audioBlob);
	});
}

/**
 * 音声ファイルのメタデータを抽出
 */
export function extractAudioMetadata(file: File): {
	name: string;
	size: number;
	type: string;
	lastModified: number;
} {
	return {
		name: file.name,
		size: file.size,
		type: file.type,
		lastModified: file.lastModified,
	};
}

/**
 * 音声ファイルを圧縮
 */
export async function compressAudio(
	audioBlob: Blob,
	quality = 0.8,
): Promise<Blob> {
	// 実際の実装では、Web Audio APIを使用して音声を圧縮
	// ここでは簡単な実装例を示す

	if (quality >= 1.0) {
		return audioBlob;
	}

	// 圧縮ロジックは実装が必要
	return audioBlob;
}

/**
 * 音声ファイルの形式を判定
 */
export function detectAudioFormat(
	file: File,
): "webm" | "mp3" | "wav" | "unknown" {
	const type = file.type.toLowerCase();

	if (type.includes("webm")) return "webm";
	if (type.includes("mp3") || type.includes("mpeg")) return "mp3";
	if (type.includes("wav")) return "wav";

	return "unknown";
}

/**
 * 時間を表示用の文字列に変換
 */
export function formatDuration(seconds: number): string {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	const milliseconds = Math.floor((seconds % 1) * 100);

	return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
}
