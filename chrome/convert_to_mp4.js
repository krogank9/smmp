var worker;
var sampleImageData;
var sampleVideoData;
var outputElement;
var filesElement;
var running = false;
var isWorkerLoaded = false;
var isSupported = true;

function sliceMp4(videoBlob, videoName, startSec, endSec, cb) {
	var aab;
	var buffersReady;
	var workerReady;
	var posted;
	
	videoName = videoName.replace(/\s/g, '')

	var fileReader = new FileReader();
	fileReader.onload = function() {
		aab = this.result;
		postMessage();
	};
	fileReader.readAsArrayBuffer(videoBlob);

	if (!worker) {
		worker = new Worker("worker-asm.js");
	}
	
	worker.onmessage = function(event) {
		var message = event.data;
		if (message.type == "ready") {
			console.log('ffmpeg-all-codecs.js file has been loaded.');

			workerReady = true;
			if (buffersReady)
				postMessage();
		} else if (message.type == "stdout") {
			console.log(message.data);
		} else if (message.type == "start") {
			console.log('ffmpeg-all-codecs.js file received ffmpeg command.');
		} else if (message.type == "done") {
			console.log(JSON.stringify(message));

			var result = message.data[0];
			console.log(JSON.stringify(result));

			var blob = new File([result.data], 'test.mp4', {
				type: 'video/mp4'
			});

			console.log(JSON.stringify(blob));

			cb(blob);
		}
	};
	var postMessage = function() {
		posted = true;

		worker.postMessage({
			type: 'command',
			// ffmpeg -i INFILE.mp4 -vcodec copy -acodec copy -ss 00:01:00.000 -t 00:00:10.000 OUTFILE.mp4
			arguments: [
				'-i', videoName,
				//'-vcodec', 'copy',
				//'-acodec', 'copy',
				'-c:v', 'h264',
				'-preset', 'ultrafast',
				'-c:a', 'aac',
				'-b:a', '192k',
				'-strict', '-2',
				'-ss', parseFloat(startSec).toFixed(2),
				'-t', parseFloat(endSec).toFixed(2),
				'output.mp4'
			],
			files: [
				{
					data: new Uint8Array(aab),
					name: videoName
				}
			],
			TOTAL_MEMORY: 536870912
		});
	};
}
