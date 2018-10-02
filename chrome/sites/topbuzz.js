var main_tab;

var video_filelist;
var thumb_filelist;
var video_info = {title: "", description: "", tags: []};

function convertCategory(c) {
	console.log("converting "+c);
	var convert = {
		"animation": "tv", "auto": "auto", "music":"music", "pets":"animals", "sports":"sport",
		"travel":"travel", "blogs":"fun", "comedy":"fun", "entertainment":"fun", "news":"news",
		"howto":"lifestyle", "education":"lifestyle", "tech":"tech", "nonprofit":"news"
	}
	return convert[c] || "fun";
}

function onlyUnique(value, index, self) { 
	return self.indexOf(value) === index;
}

// 0. wait for everything to be loaded
wait( function waitLoad() {return !! Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="file")[0]}, importFilesFromStorage, 10000 );

// 1. get all files imported
function importFilesFromStorage() {
	console.log("loading files")
	
	loadVidInfoFromStorage_Video(function() {
		console.log("all files loaded");
		
		Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="file")[0].files = video_filelist
		
		wait(function onSettingsPage() {
			// uplaod bar green & title input visible
			return !! document.getElementsByClassName("player-cover-container")[0]
				&& !! document.getElementsByClassName("player-cover-container")[0].offsetParent
		}, setVidInfo);
	});
}

// 2. set vid info
function setVidInfo() {
	console.log("setting video info");
	
	document.getElementsByTagName("textarea")[0].focus();
	//title
	simulateClearTextbox();
	simulateTypeText(video_info.title, function() {

		document.getElementsByTagName("textarea")[1].focus();
		//descr
		simulateClearTextbox();
		simulateTypeText(video_info.description.replace(/\n/g, " "), function() {
			
			// now set thumb
			document.getElementsByClassName("img")[0].click()			
			setTimeout(uploadThumb, 1000);
		});
	});
}

function uploadThumb() {
	// click 'customized thumbnail'
	Array.from(document.getElementsByClassName("tab-item tab-large-item")).slice(-1)[0].click()
	
	Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="file").slice(-1)[0].files = thumb_filelist;
	
	wait(function thumbUploaded() {
		return !! document.getElementsByClassName("image-ss-reupload")[0]
			&& !! document.getElementsByClassName("image-ss-reupload")[0].offsetParent;
	}, function() {
		document.getElementsByClassName("change-video-cover-modal")[0].getElementsByClassName("tb-btn tb-btn-primary tb-btn-middle")[0].click()
		
		wait(function thumbUploadClosed() {
			return ! document.getElementsByClassName("change-video-cover-modal")[0]
		}, function() {
			var cur_url = window.location.href;
			
			window.scrollTo(0,document.body.scrollHeight);
			document.getElementsByClassName("editor-footer")[0].getElementsByTagName("button")[0].click()
			
			wait(function urlChanged() {
				return window.location.href != cur_url;
			}, function() {
				chrome.runtime.sendMessage({closeThis: true});
			}, -1, 2000);
		}, -1, 1000);
	});
}
