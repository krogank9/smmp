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
			return !! document.getElementById("title")
				&& !! document.getElementById("title").offsetParent
		}, setVidInfo);
	});
}

// 2. set vid info
function setVidInfo() {
	console.log("setting video info");
	
	document.getElementById("title").focus();
	//title
	simulateClearTypeText(video_info.title, function() {
		document.getElementById("longDescription").focus();
		
		simulateClearTypeText(video_info.description, function() {
			var tags = video_info.tags.filter(tag => !tag.includes(" ") && !tag.includes(",")).filter(onlyUnique).join(",");
			document.getElementById("keywords").focus();
			
			simulateClearTypeText(tags, uploadThumb);
		});
	});
}

function uploadThumb() {
	Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="file").slice(-1)[0].files = thumb_filelist;
	
	wait(function vidUploaded() {
		return document.getElementsByClassName("green-bar")[0]
			&& document.getElementsByClassName("green-bar")[0].style.width
			&& document.getElementsByClassName("green-bar")[0].style.width.trim() == "100%"
	}, function() {
		console.log("clicking submit")
		Array.from(document.getElementsByTagName("button")).slice(-1)[0].click();
		
		wait(function offSettingsPage() {
			return !document.getElementById("longDescription");
		}, function() {
			chrome.runtime.sendMessage({closeThis: true});
		});
	}, -1, 4000);
}
