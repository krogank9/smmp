var video_filelist = null;
var imgs_filelist = null;
var video_info = {title: "", description: "", tags: []};

function onlyUnique(value, index, self) { 
	return self.indexOf(value) === index;
}

// 0. wait for everything to be loaded
if(window.location.href.endsWith("submit.html"))
	importFilesFromStorage();
else
	chrome.runtime.sendMessage({closeThis: true});

// 1. get all files imported
function importFilesFromStorage() {
	console.log("loading files")
	
	loadVidInfoFromStorage_Social(function() {
		console.log("all files loaded");
		console.log(video_filelist)
		
		setTimeout(uploadVideo, 1000);
		//wait(function waitTextboxShow() { return !! document.getElementById("tweet-box-home-timeline").childNodes[0] }, uploadVideo, -1);
	});
}

// 2. upload video
function uploadVideo() {
	console.log("in uploadVideo()")
	
	// append the video link if enabled & one was set
	var appendLink = getVideoLink();
	if(appendLink && appendLink.length > 0)
		appendLink = appendLink+"\n\n";
	
	// need to simulate type title
	document.getElementsByClassName("ReplyEditor__title")[0].value = "";
	document.getElementsByClassName("ReplyEditor__title")[0].focus();
	simulateClearTextbox();
	setTimeout(function() {
		simulateTypeText(video_info.headline);
		
		setTimeout(function() {
			//need to simulate type tags
			var tags = video_info.tags.filter(tag => !tag.includes(" ") && !tag.includes(",")).filter(onlyUnique).slice(0,5).join(" ")
			Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="text"&&i.name&&i.name=="category")[0].focus();
			Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="text"&&i.name&&i.name=="category")[0].value = "";
			simulateClearTextbox();
			
			setTimeout(function() {
				simulateTypeText(tags);
				
				setTimeout(function() {
					// need to simulate type descr
					document.getElementsByTagName("textarea")[0].focus();
					simulateClearTextbox();
					
					setTimeout(function() {
						simulateTypeText(appendLink + video_info.description);
						
						setTimeout(function() {
							Array.from(document.getElementsByTagName("button")).filter(b=>b.type=="submit")[1].click();
						}, 3000);
					}, 1000);
				}, 1000);
			}, 1000);
		}, 1000);
	}, 1000);
}
