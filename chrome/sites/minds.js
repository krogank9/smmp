var video_filelist = null;
var imgs_filelist = null;
var video_info = {title: "", description: "", tags: []};

function onlyUnique(value, index, self) { 
	return self.indexOf(value) === index;
}

// 0. wait for everything to be loaded
importFilesFromStorage();

// 1. get all files imported
function importFilesFromStorage() {
	console.log("loading files")
	
	loadVidInfoFromStorage_Social(function() {
		console.log("all files loaded");
		console.log(video_filelist)
		
		wait(function postBoxAppear() { return !! Array.from(document.getElementsByTagName("textarea")).length > 0 }, function() {
			document.getElementsByTagName("textarea")[0].focus();
			document.getElementsByTagName("textarea")[0].value = getSocialHeadline();
			
			simulateTypeText(" ", function() {
				simulateBackspace(function() { // need type space at end and backspace or doesn't work for some reason
					// minds does not autoplay videos, might as well post full
					if(getSocialPostType() == "video" && !getVideoLink())
						setTimeout(uploadVideo, 1000);
					else if(getSocialPostType() == "images")
						setTimeout(uploadVideo, 1000);
					else
						publishPost();
				});
			});
		}, -1);
		//wait(function waitTextboxShow() { return !! document.getElementById("tweet-box-home-timeline").childNodes[0] }, uploadVideo, -1);
	});
}

// 2b. upload images

// 2c. upload video
function uploadVideo() {
	console.log("in uploadVideo()")
	
	console.log(imgs_filelist)
	Array.from(document.getElementsByTagName("input")).filter(function(inp) { return inp.type=="file" })[0].files = video_filelist || imgs_filelist
	
	wait(function finishedUploading() {
		// check if tweet toolbar buttons still there, if not it's done uploading & posting all
		return document.getElementsByClassName("post-preview")[0]
			&& document.getElementsByClassName("post-preview")[0].getElementsByClassName("progressbar")[0]
			&& document.getElementsByClassName("post-preview")[0].getElementsByClassName("progressbar")[0].style.width == "100%"
	}, function() {
		publishPost();
	}, -1, 1000);
}

function publishPost() {
	setTimeout(function() {
		Array.from(document.getElementsByClassName("mdl-card__actions")[0].getElementsByTagName("button")).filter(b => b.type == "submit")[0].click();
		// all done w/ tweet
		setTimeout(function() {
			chrome.runtime.sendMessage({closeThis: true});
		}, 3000);
	}, 1000);
}
