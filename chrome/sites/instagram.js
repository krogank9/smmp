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
//wait( function waitLoad() {return !!document.getElementById("fileupload")}, importFilesFromStorage, 10000 );
if(window.location.href.includes("instagram.com/logan_krumbhaar/")) {
	chrome.runtime.sendMessage({spoofMobile: true});
	setTimeout(function() {
		window.location.href = "https://www.instagram.com/accounts/activity/";
	});
}
else if(window.location.href.endsWith("/accounts/activity/")) {
	importFilesFromStorage(function() {
		Array.from(document.getElementsByTagName("div")).filter(d=>d.getAttribute('role')=="menuitem")[0].click();
		Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="file")[0].files = imgs_filelist || video_filelist;
	});
}
else if(window.location.href.endsWith("/create/style/")) {
	//document.getElementsByTagName("header")[0].getElementsByTagName("button")[1].click();
}
else if(window.location.href.endsWith("/create/details/")) {
	document.getElementsByTagName("textarea")[0].focus();
	
	importFilesFromStorage(function() {
		simulateTypeText(getSocialHeadline(), function() {
			// click share
			document.getElementsByTagName("header")[0].getElementsByTagName("button")[1].click();
		});
	});
}
else {
	chrome.runtime.sendMessage({closeThis: true});
}

// 1. get all files imported
function importFilesFromStorage(cb) {
	console.log("loading files")
	
	loadVidInfoFromStorage_Social(function() {
		console.log("all files loaded");
		console.log(video_filelist)
		
		cb();
	});
}
