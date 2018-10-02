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
		
		wait(function uploadFinished() {
			// uplaod bar green & title input visible
			return !! Array.from(document.getElementsByClassName("setting_input"))[0].offsetParent
				&& !! document.getElementsByClassName("rainbow_bar_animation rainbow_bar_animation--green")[0]
		}, setVidInfo);
	});
}

// 2. set vid info
function setVidInfo() {
	console.log("setting video info");
	
	Array.from(document.getElementsByClassName("setting_input"))[0].focus();
	//title
	simulateClearTextbox();
	simulateTypeText(video_info.title, function() {

		Array.from(document.getElementsByClassName("setting_input"))[1].focus();
		//descr
		simulateClearTextbox();
		simulateTypeText(video_info.description, function() {

			Array.from(document.getElementsByClassName("setting_input"))[2].focus();
			
			var tags = video_info.tags.filter(tag => !tag.includes(",")).filter(onlyUnique).slice(0,50).join(",");
			if(tags.length > 0)
				tags += "\n";
			
			//tags
			simulateClearTextbox();
			simulateTypeText(tags, function() {
				
				// now set langauge
				document.getElementsByClassName("Select")[0].getElementsByTagName("input")[0].focus()
				
				simulateClearTextbox(function(){
					simulateTypeText("english\n", function() {
						
						// click save
						Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="submit")[0].click();
						
						var vimeo_link_ = Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="text" && i.value.includes("vimeo.com"))[0].value

						video_info.vimeo_link = vimeo_link_;
						chrome.storage.local.set({"vid_info": video_info}, function(){
							setTimeout(function() {
								chrome.runtime.sendMessage({closeThis: true});
							}, 1000);
						});
					})
				});
			});
		});
	});
}
