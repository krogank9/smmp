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

function timer_tick() {
	setTimeout(timer_tick, 2000);
	console.log('tick')
}
timer_tick();

function onlyUnique(value, index, self) { 
	return self.indexOf(value) === index;
}

// 0. wait for everything to be loaded
wait( function waitLoad() {return !!document.getElementById("fileupload")}, importFilesFromStorage, 10000 );

// 1. get all files imported
function importFilesFromStorage() {
	console.log("loading files")
	
	loadVidInfoFromStorage_Video(function() {
		console.log("all files loaded");
		doPageSpecific();
	});
}

// 2. on video upload tab, set info, on video page set tags & category
function doPageSpecific() {
	if(window.location.href.includes("/videos/upload")) {
		setVidInfo();
	}
	else if(window.location.href.includes("/video")) {
		Array.from(document.getElementsByTagName("a")).filter(function(a) { return a.getAttribute('href')=="#video-settings"})[0].click()
		var tags = video_info.tags.filter(tag => !tag.includes(" ") && !tag.includes(",")).filter(onlyUnique).slice(0,3).join(" ")
		var category = convertCategory(video_info.category);
		console.log(video_info)
		console.log("tags: "+video_info.tags);
		console.log("category: "+video_info.category);
		console.log(document.getElementById("id_hashtags"));
		console.log(document.getElementById("id_category"));
		document.getElementById("id_hashtags").value = tags
		document.getElementById("id_category").value = category
		
		Array.from(document.getElementById("save-settings").getElementsByTagName("button"))[0].click()
		
		wait(function saveSuccess() {return !!document.getElementsByClassName("toast-success")[0]}, function() {
			// resave video link if bitchute selected
			video_info.bitchute_video_link = simplifyUrl(window.location.href)
			chrome.storage.local.set({"vid_info": video_info}, function(){
				chrome.runtime.sendMessage({closeThis: true});
			});
		}, 5000);
	}
}

// 3. set vid info
function setVidInfo() {
	console.log("setting video info");
	document.getElementsByName("upload_title")[0].value = video_info.title;
	document.getElementsByName("upload_description")[0].value = video_info.description;
	
	document.getElementById("coverupload").files = thumb_filelist;
	wait( function waitCoverUpload() { return document.getElementById("cover_image").src.includes("/media")}, function() {
		console.log("cover done");
		document.getElementById("fileupload").files = video_filelist;
		wait( function waitVidUpload() { return document.getElementById("upload_file_name").textContent.length > 0}, function() {
			// goto next page
			document.getElementById("finish-button").click()
		}, -1);
	}, -1);
}
