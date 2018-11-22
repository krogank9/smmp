var video_filelist = null;
var imgs_filelist = null;
var video_info = {title: "", description: "", tags: []};

function timer_tick() {
	setTimeout(timer_tick, 2000);
	console.log('tick')
}
timer_tick();

function onlyUnique(value, index, self) { 
	return self.indexOf(value) === index;
}

// 0. wait for everything to be loaded
wait( function waitLoad() {return !! document.getElementById("global-new-tweet-button")}, importFilesFromStorage, -1, 1000);
//importFilesFromStorage();

// 1. get all files imported
function importFilesFromStorage() {
	console.log("loading files")
	
	loadVidInfoFromStorage_Social(function() {
		console.log("all files loaded");
		console.log(video_filelist)
		
		document.getElementById("global-new-tweet-button").click();
		
		wait(function tweetBoxAppear() {
				return !! document.getElementById("Tweetstorm-dialog-dialog")
				&& !! document.getElementById("Tweetstorm-dialog-dialog").offsetParent
		}, function() {
			if(video_filelist || imgs_filelist)
				setTimeout(uploadVideo, 1500);
			else
				setTimeout(makeTextPost, 1500);
		}, 10000, 1000);
		//wait(function waitTextboxShow() { return !! document.getElementById("tweet-box-home-timeline").childNodes[0] }, uploadVideo, -1);
	});
}

// 2b. make text post

function makeTextPost() {
	setTimeout(function() {
		simulateClearTextbox(function() {
			document.activeElement.innerText = getSocialHeadline();
			
			setTimeout(function() {
				simulateCtrlEnter(function() {
					setTimeout(function() {
						chrome.runtime.sendMessage({closeThis: true});
					}, 2000);
				});
			}, 2000);
		});
	}, 1000);
}

// 2. upload video
function uploadVideo() {
	console.log("in uploadVideo()")
	
	//document.getElementsByClassName("tweet-box rich-editor")[0].focus();
	
	setTimeout(function() {
		simulateClearTextbox(function() {
			document.activeElement.innerText = getSocialHeadline(280);
			
			let file_list = video_filelist || imgs_filelist
			console.log(file_list)
			for(var i=0; i<file_list.length; i++) {
				let i_ = i;
				setTimeout(function() {
					Array.from(document.getElementById("Tweetstorm-dialog-dialog").getElementsByTagName("input")).filter(function(inp) { return inp.type=="file"})[0].files = fileListFromFile(file_list[i_])
				}, i*50);
			}
			
			wait(function thumbnailAppeared() {
				return window.getComputedStyle( document.getElementById("Tweetstorm-dialog-dialog").getElementsByClassName("TweetBoxAttachments")[0] ).display != "none"
			}, function() {
				//document.getElementsByClassName("timeline-tweet-box")[0].getElementsByClassName("tweet-button")[0].children[1].click();
				setTimeout(function() {
					simulateCtrlEnter(function(){})
				}, 2000); // NEED timeout or else image posting glitches and only posts 1 for some reason
				
				wait(function finishedUploading() {
					// check if tweet toolbar buttons still there, if not it's done uploading & posting all
					return (!document.getElementById("Tweetstorm-dialog-dialog") || !document.getElementById("Tweetstorm-dialog-dialog").offsetParent)
						&& Array.from(document.getElementsByClassName("message-text")).length > 0
						&& Array.from(document.getElementsByClassName("message-text")).filter(m => !m.innerText.includes("%")).length > 0
				}, function() {
					// all done w/ tweet
					setTimeout(function() {
						chrome.runtime.sendMessage({closeThis: true});
					}, 1000);
				}, -1, 500);
				
			}, -1, 100);
		});
	}, 1000);
}
