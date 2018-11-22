var main_tab;

var video_filelist;
var thumb_filelist;
var video_info = {title: "", description: "", tags: []};

function convertCategory(c) {
	console.log("converting "+c);
	var convert = {
		"animation": 14, "auto": 20, "music":5, "pets":16, "sports":8,
		"travel":21, "blogs":10, "comedy":12, "entertainment":12, "news":1,
		"howto":6, "education":6, "tech":7, "nonprofit":11
	}
	return convert[c] || 11;
}

function onlyUnique(value, index, self) { 
	return self.indexOf(value) === index;
}

// 0. wait for everything to be loaded
if(window.location.href == "https://d.tube/#!/upload")
	wait( function waitLoad() {return Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="file").length>=2}, importFilesFromStorage, 10000 );
else
	chrome.runtime.sendMessage({closeThis: true});
//importFilesFromStorage();

function fuckingMuteVideo() {
	if(document.getElementsByTagName("video")[0])
		document.getElementsByTagName("video")[0].muted = true
	else
		setTimeout(fuckingMuteVideo, 10);
}
fuckingMuteVideo();

// 1. get all files imported
function importFilesFromStorage() {
	console.log("loading files")
	
	loadVidInfoFromStorage_Video(function() {
		console.log("all files loaded");
		Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="file")[0].files = video_filelist
		// stagger
		setTimeout(function() {
			Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="file")[1].files = thumb_filelist_small
			setVidInfo();
		}, 2000);
	});
}
// 2. set vid info
function setVidInfo() {
	console.log("setting video info");
	
	Array.from(document.getElementsByTagName("input")).filter(i=>i.getAttribute("name")=="title")[0].focus();
	simulateClearTextbox(function() {
		simulateTypeText(video_info.title, function() {
			
			document.getElementsByTagName("textarea")[0].focus();
			
			simulateClearTextbox(function() {
				simulateTypeText(video_info.description, function() {
					
					var tag_input = Array.from(document.getElementsByTagName("input")).filter(i=>i.classList=="search")[0];
					
					let tags = video_info.tags.filter(tag => !tag.includes(",") && !tag.includes(" ")).filter(onlyUnique).slice(0,4);
					
					function doNextInQueue() {
						if(tags.length > 0) {
							simulateTypeText(tags.shift(), function() {
								simulateTypeText("\n", doNextInQueue)
							})
						}
						else {	
							window.scrollTo(0,document.body.scrollHeight);
							
							let cur_url = window.location.href;
							
							function snapUploaded() { return document.getElementById("uploadSnap").getElementsByClassName("checkmark green")[0] }
							function queueWaitDone() { return Array.from(document.getElementsByClassName("indicating progress")).filter(ui=>ui.getAttribute("data-percent") != 100).length == 0; }
							
							wait(function uploadDone() { return snapUploaded() && queueWaitDone(); }, function() {
								// DTUBE IS BUGGY!! pls work
								setTimeout(function() {
									document.getElementsByClassName("uploadsubmit")[0].click();
								}, 1000);
								
								wait(function urlChanged() {
									return window.location.href != cur_url;
								}, function() {
									console.log("URL CHANGED URL CHANGED URL CHANGED URL CHANGED URL CHANGED URL CHANGED URL CHANGED URL CHANGED URL CHANGED URL CHANGED ");
									chrome.runtime.sendMessage({closeThis: true});
								});
							}, -1, 10000);
						}
					}
					
					tag_input.focus();
					doNextInQueue();
				});
			});
		});
	});
}
