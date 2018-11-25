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
	}, 1000);
}
else if(window.location.href.endsWith("/accounts/activity/")) {
	chrome.runtime.sendMessage({focusThis: true});
	
	importFilesFromStorage(function() {
		console.log(video_filelist);
		setTimeout(function() {
			var uploadButton = Array.from(document.getElementsByTagName("div")).filter(d=>d.getAttribute('role')=="menuitem")[0];
			uploadButton.click();
			simulateClickElem(uploadButton, function() {
				console.log("SETTING");
				Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="file")[0].files = imgs_filelist || video_filelist;
			});
		}, 1000);
	});
}
else if(window.location.href.endsWith("/create/style/")) {
	simulateHoverElem(document.getElementsByTagName("header")[0].getElementsByTagName("button")[1], function() {
		setTimeout(function() {
			document.getElementsByTagName("header")[0].getElementsByTagName("button")[1].click();
		}, 1000);
	});
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
	// wait for video dismiss/photo was popup
	wait(function dismissAppear() {
		return (Array.from(document.getElementsByTagName("button")).filter(b=>b.parentElement.children[0].tagName=="P" && b.parentElement.children.length == 2)[0]
			&& Array.from(document.getElementsByTagName("button")).filter(b=>b.parentElement.children[0].tagName=="P" && b.parentElement.children.length == 2)[0].innerText.trim() == "Dismiss")
			||
			(Array.from(document.getElementsByTagName("p"))[0]
			&& Array.from(document.getElementsByTagName("p"))[0].innerText.includes("photo was"));
	}, function() {
		// unspoof after done insta tab
		chrome.runtime.sendMessage({unspoofMobile: true});
		setTimeout(function() {
			chrome.runtime.sendMessage({closeThis: true});
		}, 1000);
	});
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
