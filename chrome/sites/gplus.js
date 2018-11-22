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

// 1. Click post box and wait for popup
wait( function waitLoad() {return !! Array.from(document.getElementsByTagName("span")).filter(s=>s.tabIndex==0)[0]}, function() {
	Array.from(document.getElementsByTagName("span")).filter(s=>s.tabIndex==0)[0].click()
	wait( function waitPopup() {return !! document.getElementsByTagName("textarea")[0]}, importFilesFromStorage, 10000);
}, 10000 );

function importFilesFromStorage() {
	console.log("loading files")
	
	loadVidInfoFromStorage_Social(function() {
		console.log("all files loaded");
		console.log(video_filelist);
		
		wait(function postBoxAppear() { return !! Array.from(document.getElementsByTagName("c-wiz")).filter(c=>c.getAttribute('role')=="dialog")[0] }, function() {
			
			if(imgs_filelist)
				setTimeout(uploadPhotos, 1500);
			else
				setTimeout(makeTextPost, 1500);
		}, -1, 1000);
		//wait(function waitTextboxShow() { return !! document.getElementById("tweet-box-home-timeline").childNodes[0] }, uploadVideo, -1);
	});
}

// 0.5. upload photos
function uploadPhotos() {
	var post_dialog = Array.from(document.getElementsByTagName("c-wiz")).filter(c=>c.getAttribute('role')=="dialog")[0];

	// click photo button
	Array.from(post_dialog.getElementsByTagName("div")).filter(d=>d.getAttribute('role')=="button")[0].click()
	
	wait( function waitLoad() {return !! Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="file")[0]}, function() {
		Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="file")[0].files = imgs_filelist;
		
		wait( function photosDoneUpload() {
			var any_photos_visible = Array.from(post_dialog.getElementsByTagName("img")).filter(i=>i.getAttribute("alt")=="Photo").length > 0;
			var all_photos_loaded = Array.from(post_dialog.getElementsByTagName("img")).filter(i=>i.getAttribute("alt")=="Photo").every(i=>i.parentElement.parentElement.parentElement.children[0].getAttribute("role")=="option");
			return any_photos_visible && all_photos_loaded;
		}, function() {
			// close photo upload box -- actually not needed can just focus & type behind
			
			//var photo_container = Array.from(document.getElementsByTagName("c-wiz")).filter(c=>c.getAttribute('role')=="dialog")[1].parentElement.parentElement.parentElement;
			//var overlay_cover = photo_container.previousSibling;
			//photo_container.remove();
			//overlay_cover.remove()
			
			setTimeout(makeTextPost, 2000);
		}, -1, 2000)
	});
}

// 1. make text post

function makeTextPost() {
	var post_dialog = Array.from(document.getElementsByTagName("c-wiz")).filter(c=>c.getAttribute('role')=="dialog")[0];
	
	post_dialog.getElementsByTagName("textarea")[0].focus();
	
	var head = getSocialHeadline(1000, false, true);
	head = head.split(getVideoLink());
	if(head.length >= 2 && getVideoLink()) {
		post_dialog.getElementsByTagName("textarea")[0].value = head.shift();
		head.unshift(getVideoLink());
		simulateTypeText(head.join(""), function() {
			simulateTypeAndBackspace(function() {
				simulateCtrlEnter(function() {
					wait(function finishPost() {
						return ! post_dialog.offsetParent;
					}, function() {
						chrome.runtime.sendMessage({closeThis: true});
					}, -1, 4000);
				});
			});
		});
	}
	else {
		post_dialog.getElementsByTagName("textarea")[0].value = getSocialHeadline(1000, true);
		var separator = ""
		if(getSocialTags(1000))
			separator = "\n\n"
		simulateTypeText(separator+getSocialTags(1000), function() {
			simulateTypeAndBackspace(function() {
				simulateCtrlEnter(function() {
					wait(function finishPost() {
						return ! post_dialog.offsetParent;
					}, function() {
						chrome.runtime.sendMessage({closeThis: true});
					}, -1, 4000);
				});
			});
		});
	}
}
