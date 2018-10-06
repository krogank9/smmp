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

// 1. Page specific
if(window.location.href.includes("tumblr.com/dashboard/")) {
	loadVidInfoFromStorage_Social(function() {
		if(video_filelist)
			document.getElementById("new_post_label_video").click();
		else if(imgs_filelist)
			document.getElementById("new_post_label_photo").click();
		else
			document.getElementById("new_post_label_text").click();
	});
}
else if(window.location.href.includes("tumblr.com/new/text")) {
	loadVidInfoFromStorage_Social(makeTextPost);
}
else if(window.location.href.includes("tumblr.com/new/photo")) {
	loadVidInfoFromStorage_Social(uploadPhotos);
}
else if(window.location.href.includes("tumblr.com/new/video")) {
	loadVidInfoFromStorage_Social(uploadVideo);
}
else if(window.location.href.includes("tumblr.com/dashboard")) { // with no / at the end means redirected back
	chrome.runtime.sendMessage({closeThis: true});
}

// 2a. make text post

function makeTextPost() {
	
	console.log("text post")

	
	setTimeout(function() {
		setForceFocusElement(document.getElementsByClassName("editor editor-plaintext")[2]);
		
		// find any tags in headline to put in the proper tags section tumblr has
		var headline_tags = video_info.headline.split(" ").filter(w=>w[0]=="#"&&w.indexOf(" ")==-1)
		
		var tags = video_info.tags.slice().concat(headline_tags);
		var tags_str = tags.join("\n");
		if(tags_str.length > 0)
			tags_str += "\n";
			
		console.log("typing tags: "+tags_str);
			
		simulateTypeText(tags_str, function() {
			setForceFocusElement(document.getElementsByClassName("editor editor-richtext")[0]);
			
			document.getElementsByClassName("editor editor-richtext")[0].innerText = getSocialHeadline(0);
			
			var post_button = document.getElementsByClassName("create_post_button")[0];
			wait(function buttonEnabled() { return !post_button.disabled }, function() {
				clearForceFocusElement();
				post_button.click();
			}, -1, 1000);
		}, document.getElementsByClassName("editor editor-plaintext")[2]);
	}, 1000);
}

// 2b. upload photos
function uploadPhotos() {
	setTimeout(function() {
		Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="file")[0].files = imgs_filelist;
		
		makeTextPost();
	}, 1000);
}

// 2c. upload video
function uploadVideo() {
	setTimeout(function() {
		Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="file")[0].files = video_filelist;
		
		setTimeout(function() {
			if(!document.getElementsByClassName("confirm-tos--checkbox")[0].checked)
				document.getElementsByClassName("confirm-tos--checkbox")[0].click()
			makeTextPost();
		}, 1000);
	}, 1000);
}
