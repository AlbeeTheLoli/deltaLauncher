import extract from 'extract-zip';
//@ts-expect-error
import getFolderSize from 'get-folder-size';

async function getSize(dir: any): Promise<number> {
	return new Promise((resolve, reject) => {
		getFolderSize(dir, (err: any, size: number) => {
			if (err) throw err;
			resolve(size);
		})
	})
}

const bToMB = (val: any) => (val / 1024 / 1024)
const bToGB = (val: any) => (val / 1024 / 1024) * 0.001
const millisToSecs = (val: any) => val * 0.001
const lerp = (a: any, b: any, t: any) => a + (b - a) * t

function formatTime(secs: any) {
	if (secs > 60) {
		const mins = (secs / 60).toFixed(0)
		const suffix = mins === '1' ? "" : "s"
		return `${mins} minute${suffix}`
	} else {
		secs = secs.toFixed(0)
		const suffix = secs == '1' ? "" : "s"
		return `${secs} second${suffix}`
	}
}

const defaultProgressCallback = (data: any) => {
	const { elapsedBytes, totalBytes, progress, speed, remainingSecs } = data
	//@ts-expect-error
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	const elapsedGB = bToGB(elapsedBytes).toFixed(2)
	const totalGB = bToGB(totalBytes).toFixed(2)
	process.stdout.write(`extracting... ${elapsedGB} / ${totalGB} GB\t\t${(progress * 100).toFixed(2)}%\t\tspeed: ${speed.toFixed(2)} MB/s\t\tETA: ${formatTime(remainingSecs)}`)
}

export interface IProgress {
    percent: number,
    total_size: number,
    received_size: number,
    status: string,
    from: 'downloader' | 'extract' | 'copy',
}

export async function extractWithProgress(src: string, dest: string, onProgress: (progress: IProgress) => void, interval: number, smoothing = 0.1) {
    const sizeSrc: number = await getSize(src);
    const initialSizeDest: number = await getSize(dest);
    const startTime: number = Date.now();
    let lastSize = 0;
    let lastTime = startTime;
    let speed = 0;

    const intervalId = setInterval(async () => {
        try {
			const sizeDest = await getSize(dest) - initialSizeDest;
			const deltaBytes = sizeDest - lastSize;
			if (deltaBytes == 0) return;
			const now = Date.now();
			const deltaTime = now - lastTime;

			const newSpeed = bToMB(deltaBytes) / millisToSecs(deltaTime); //MB/s
			speed = lerp(speed, newSpeed, smoothing);
			const secsPerMB = 1 / speed;
			const remainingMB = bToMB(sizeSrc - sizeDest);
			const remainingSecs = secsPerMB * remainingMB;

			const progress = sizeDest / sizeSrc;

			lastSize = sizeDest;
			lastTime = now;

			onProgress({
				received_size: sizeDest,
				total_size: sizeSrc,
				percent: progress,
				status: 'extracting',
    			from: 'extract',
			});
		} catch (err) {
			console.error(err)
		}
    }, interval);

    await extract(src, { dir: dest });
    clearInterval(intervalId);
    console.log(`\ncopy extract in ${millisToSecs(Date.now() - startTime).toFixed(0)} seconds`);
};