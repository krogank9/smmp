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

console.log(window.location.href)
// 0. wait for everything to be loaded
wait( function waitLoad() {return !! document.getElementById("title")}, importFilesFromStorage, 10000 );

// 1. get all files imported
function importFilesFromStorage() {
	console.log("loading files")
	
	Array.from(document.getElementsByTagName("button")).filter(b=>b.getAttribute("format")=="alternative" && b.parentElement.parentElement.tagName.toLowerCase()=="a")[0].click()
	
	loadVidInfoFromStorage_Video(function() {
		console.log("all files loaded");
		
		Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="file")[0].files = thumb_filelist
		
		wait(function uploadFinished() {
			// uplaod bar green & title input visible
			return !! Array.from(document.getElementsByTagName("button")).filter(b=>b.type=="submit" && b.getAttribute("format")=="primary")[0]
				&& !! Array.from(document.getElementsByTagName("button")).filter(b=>b.type=="submit" && b.getAttribute("format")=="primary")[0].offsetParent
		}, function() {
			Array.from(document.getElementsByTagName("button")).filter(b=>b.type=="submit" && b.getAttribute("format")=="primary")[0].click();
			setTimeout(function() {
				chrome.runtime.sendMessage({closeThis: true});
			}, 3000);
		});
	});
}
