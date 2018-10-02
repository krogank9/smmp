var main_tab;

var video_filelist;
var thumb_filelist;
var video_info = {title: "", description: "", tags: []};

function convertCategory(c) {
	console.log("converting "+c);
	var convert = {
		"animation": "Animation", "auto": "Cars", "music":"Music", "pets":"Pets", "sports":"Sports",
		"travel":"Travel", "blogs":"Vloggers", "comedy":"Comedy", "entertainment":"Entertainment", "news":"News",
		"howto":"E-Learning", "education":"E-Learning", "tech":"Technology", "nonprofit":"Others"
	}
	return convert[c] || 11;
}

function onlyUnique(value, index, self) { 
	return self.indexOf(value) === index;
}

// 0. wait for everything to be loaded
importFilesFromStorage();

// 1. get all files imported
function importFilesFromStorage() {
	console.log("loading files")
	
	loadVidInfoFromStorage_Video(function() {
		console.log("all files loaded");
		Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="file")[0].files = video_filelist
		
		wait(function waitInfoAppear() {
			return !! document.getElementById("job_title_1")
				&& !! document.getElementById("job_title_1").offsetParent;
		}, function() {
			document.getElementById("ThumbnailPicker1").files = thumb_filelist;
			setVidInfo();
		});
	});
}
// 2. set vid info
function setVidInfo() {
	console.log("setting video info");
	
	document.getElementById("job_title_1").focus();
	simulateClearTextbox(function() {
		
		simulateTypeText(video_info.title, function() {
			
			document.getElementsByClassName("ngx-editor-textarea")[0].focus();
			
			simulateClearTextbox(function() {
				// metacafe does not allow links anyway, just put title as descr
				simulateTypeText(video_info.description, function() {
					
					document.getElementsByTagName("tag-input")[0].getElementsByTagName("input")[0].focus();
					
					var tags = video_info.tags.filter(tag => !tag.includes(",")).filter(onlyUnique).slice(0,50).join("\n");
						
					simulateClearTextbox(function() {
						simulateTypeText(tags, function() {
							//set category
							var category = convertCategory(video_info.category);
							
							// open categories box
							document.getElementById("job_Category_1").click()
							
							setTimeout(function() {
								// click category
								Array.from(document.getElementsByTagName("mat-option")).filter(m=>m.innerText.trim().startsWith(category))[0].click()
								if( document.getElementById("job_AgeVerification_1").checked ) {
									document.getElementById("job_AgeVerification_1").click();
								}
								
								Array.from(document.getElementsByTagName("button")).filter(b=>b.classList.contains("publishButton"))[0].click()
								
								wait(function editDisappear() { return ! document.getElementById("job_title_1"); }, function cb() {
									chrome.runtime.sendMessage({closeThis: true});
								}, -1, 2000);
							}, 1000);
						});
					});
				});
			});
		});
	});
}
