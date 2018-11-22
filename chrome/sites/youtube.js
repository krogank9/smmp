var main_tab;

var video_filelist;
var thumb_filelist;
var video_info = {title: "", description: "", tags: []};

function convertCategory(c) {
	var convert = {
		"animation": "string:1", "auto": "string:2", "music": "string:10", "pets": "string:15", "sports": "string:17",
		"travel": "string:19", "blogs": "string:22", "comedy": "string:23", "entertainment": "string:24", "news": "string:25",
		"howto": "string:26", "education": "string:27", "tech": "string:28", "nonprofit": "string:29"
	}
	return convert[c] || "string:22";
}

function timer_tick() {
	setTimeout(timer_tick, 2000);
	console.log('tick')
}
timer_tick();

function onlyUnique(value, index, self) { 
	return self.indexOf(value) === index;
}

// 0. wait for everything to be loaded
wait( function waitLoad() {return !! Array.from(document.getElementById("upload-prompt-box").getElementsByTagName("input")).filter(inp => inp.type=="file")[0]}, importFilesFromStorage, 10000 );
//importFilesFromStorage();

// 1. get all files imported
function importFilesFromStorage() {
	console.log("loading files")
	
	loadVidInfoFromStorage_Video(function() {
		console.log("all files loaded");
		uploadVideo();
	});
}

// 2. upload video
function uploadVideo() {
	Array.from(document.getElementById("upload-prompt-box").getElementsByTagName("input")).filter(inp => inp.type=="file")[0].files = video_filelist;
	wait(function onVidInfoPage() {
		return !! Array.from(document.getElementsByClassName("custom-thumb-area horizontal-custom-thumb-area small-thumb-dimensions"))[0].getElementsByTagName("input")[0];
	}, setBasicVidInfo, 10000);
	//setTimeout(setVidInfo, 1000);
}

function addYouTubeTag(name) {
	const enterPress = new KeyboardEvent("keydown", {
		bubbles: true, cancelable: true, keyCode: 13
	});
	
	document.getElementsByClassName("video-settings-add-tag")[0].value += name;
	document.getElementsByClassName("video-settings-add-tag")[0].dispatchEvent(enterPress);
}

// 3. set vid info
function setBasicVidInfo() {
	document.getElementsByClassName("yt-uix-form-input-text video-settings-title")[0].value = video_info.title;
	
	var tags_short = video_info.tags.filter(tag => !tag.includes(" ") && !tag.includes(",")).filter(onlyUnique).slice(0,3).map(t=>"#"+t).join(" ")
	if(tags_short.length > 0)
		tags_short = "\n\n" + tags_short
	
	document.getElementsByClassName("yt-uix-form-input-textarea video-settings-description")[0].value = video_info.description + tags_short;
	
	var tags = video_info.tags.filter(tag => !tag.includes(",")).filter(onlyUnique);
	tags.forEach(function(t){addYouTubeTag(t)});
	
	// uncheck sharing to gplus, there is an option to post to gplus directly w/ hashtags + photos
	Array.from(document.getElementsByTagName("input")).filter(i => i.type == "checkbox" && i.name == "creator_share_gplus")[0].checked = false;
	
	Array.from(document.getElementsByClassName("custom-thumb-area horizontal-custom-thumb-area small-thumb-dimensions"))[0].getElementsByTagName("input")[0].files = thumb_filelist;
	
	wait(function waitThumbUploaded() {return !! Array.from(document.getElementsByTagName("img")).filter(img => img.src.includes("preview_image"))[0]}, function() {
		document.getElementById("advanced-settings").children[0].children[0].click()
		wait(function waitAdvancedPageLoad() {return true}, setAdvancedVidInfo, -1);
	}, 10000);
}

function setAdvancedVidInfo() {
	var category = convertCategory(video_info.category);
	Array.from(document.getElementsByTagName("ng-form")).filter(ng => ng.getAttribute("data-initial-category"))[0].getElementsByTagName("select")[0].value = category
	
	var publishButton = Array.from(Array.from(document.getElementById("active-uploads-contain").getElementsByClassName("save-cancel-buttons"))[0].children).slice(-1)[0];
	
	// wait for publish to not be disabled so we can save vid
	wait( function publishNotDisabled() { return !publishButton.disabled }, function() {
		publishButton.click();
		console.log("clicked publish")
		
		// now have to wait again, after it's not disabled again it will have finished saving
		wait( function waitUploaded() {
			return parseInt(document.getElementsByClassName("progress-bar-processing")[1].getAttribute("aria-valuenow")) > 0;
		},
		function() {
			console.log("saving & closing")
			// done posting save video link if needed & close after small delay
			setTimeout(function() {
				video_info.youtube_video_link = simplifyUrl(document.getElementsByClassName("watch-page-link")[0].children[0].innerText);
				chrome.storage.local.set({"vid_info": video_info}, function(){
					console.log("saved")
					console.log(video_info)
					publishButton.click()
					// wait for "saving..." text to be gone
					setTimeout(function() {
						chrome.runtime.sendMessage({closeThis: true});
					}, 3000);
				});
			}, 500);
		}, -1, 3000);
	}, -1, 10000);
}
