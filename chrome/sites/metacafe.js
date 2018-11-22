var main_tab;

var video_filelist;
var thumb_filelist;
var video_info = {title: "", description: "", tags: []};

function convertCategory(c) {
	console.log("converting "+c);
	var convert = {
		"animation": "anim", "auto": "wheels", "music":"music", "pets":"pets", "sports":"sports",
		"travel":"travel", "blogs":"people", "comedy":"comedy", "entertainment":"entertain", "news":"news",
		"howto":"how", "education":"how", "tech":"tech", "nonprofit":"other"
	}
	return convert[c] || 11;
}

function onlyUnique(value, index, self) { 
	return self.indexOf(value) === index;
}

// 0. import on video page, login when redirected to login page, close after uploaded
if(window.location.href.includes("metacafe.com/upload-video")) {
	importFilesFromStorage();
}
else if (window.location.href.includes("metacafe.com/?login")) {
	setTimeout(function() {
		document.getElementById("login_email").focus();
		simulateTypeAndBackspace(function() {
			Array.from(document.getElementsByTagName("button")).filter(b=>b.getAttribute("type")=="submit")[0].click();
		});
	}, 4000);
}
else if (window.location.href.endsWith("www.metacafe.com/")) {
	//login redirects to here
	window.location.href = "http://www.metacafe.com/upload-video/";
}
else {
	setTimeout(function() {
		chrome.runtime.sendMessage({closeThis: true});
	}, 500);
}
	

// 1. get all files imported
function importFilesFromStorage() {
	console.log("loading files")
	
	loadVidInfoFromStorage_Video(function() {
		console.log("all files loaded");
		Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="file")[0].files = video_filelist
		
		wait(function waitInfoAppear() {
			return !! document.getElementById("edit_video_title").offsetParent;
		}, setVidInfo);
	});
}
// 2. set vid info
function setVidInfo() {
	console.log("setting video info");
	
	document.getElementById("edit_video_title").focus();
	simulateClearTextbox(function() {
		
		// metacafe is strict, make sure no @ symbols
		video_info.title = video_info.title.replace("@", "")
		
		simulateTypeText(video_info.title, function() {
			
			document.getElementsByTagName("textarea")[0].focus();
			
			simulateClearTextbox(function() {
				// metacafe does not allow links anyway, just put title as descr
				simulateTypeText(video_info.title, function() {
					
					document.getElementById("edit_video_tags").focus();
					
					var tags = video_info.tags.filter(tag => !tag.includes(",")).filter(onlyUnique).slice(0,50).join(",");
						
					simulateClearTextbox(function() {
						simulateTypeText(tags, function() {
							//set category
							var category = convertCategory(video_info.category);
							
							Array.from(document.getElementsByTagName("div")).filter(d=>d.id&&d.id.endsWith("edit_video_categories"))[0].getElementsByTagName("input")[0].focus();
							
							simulateTypeText(category, function() {
								simulateTypeText("\n", function() {
									Array.from(document.getElementsByTagName("button")).filter(b=>b.type=="submit")[0].click()
									
									wait(function okDialogAppear(){
										return Array.from(document.getElementsByTagName("button")).filter(b=>b.getAttribute("data-close-fancybox"))[0]
											&& Array.from(document.getElementsByTagName("button")).filter(b=>b.getAttribute("data-close-fancybox"))[0].offsetParent
									}, function() {
										Array.from(document.getElementsByTagName("button")).filter(b=>b.getAttribute("data-close-fancybox"))[0].click();
									});
								});
							});
						});
					});
				});
			});
		});
	});
}
