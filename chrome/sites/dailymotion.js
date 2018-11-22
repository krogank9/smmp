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
wait( function waitLoad() {
	// sometimes it makes you relogin the directs to home page. change back to upload page if that happens
	if(!(window.location.href.includes("dailymotion.com/partner/") && window.location.href.includes("/video/upload"))) {
		setTimeout(function() {
			//give it a sec then don't change back twice? just incase
			if(!(window.location.href.includes("dailymotion.com/partner/") && window.location.href.includes("/video/upload")))
				window.location.href = "https://www.dailymotion.com/partner/media/video/upload";
		}, 2000);
		return false;
	}
	return !! Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="file")[0]
}, importFilesFromStorage, 10000, 3000 );

// 1. get all files imported
function importFilesFromStorage() {
	console.log("loading files")
	
	loadVidInfoFromStorage_Video(function() {
		console.log("all files loaded");
		
		Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="file")[0].files = video_filelist
		
		wait(function thumbAppear() {
			return !! document.getElementsByClassName("progress percent-100")[0]
		}, setCategory, -1, 2000);
	});
}

//1.5 set category
function setCategory() {
	// now set category
	var category_val = convertCategory(video_info.category);
	
	simulateHoverElem(Array.from(document.getElementsByTagName("div")).filter(d=>d.getAttribute("class") && d.getAttribute("class").startsWith("select__input"))[1], function() {
		Array.from(document.getElementsByTagName("div")).filter(d=>d.getAttribute("class") && d.getAttribute("class").startsWith("select__input"))[1].click()
		
		setTimeout(function() {

			var lis = Array.from(Array.from(document.getElementsByTagName("div")).filter(d=>d.getAttribute("class") && d.getAttribute("class").startsWith("select__list"))[1].getElementsByTagName("li"))

			var filtered_lis = lis.filter(li=>li.getAttribute("value")==category_val);
			if (filtered_lis.length == 0)
				filtered_lis = lis.filter(li=>li.getAttribute("value")=="fun");

			var li_to_select = filtered_lis[0];

			lis.forEach(function(li) {
				if (li != filtered_lis[0])
					li.style.display = "none"
			});
			
			setTimeout(function() {
				simulateHoverElem(li_to_select, function() {
					li_to_select.click();
					
					setTimeout(setVidInfo, 1000);
				});
			}, 1000);
		}, 500)
	});
}

// 2. set vid info
function setVidInfo() {
	console.log("setting video info");
	Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="text" && i.name=="title")[0].focus();
	
	//title
	simulateClearTextbox();
	simulateTypeText(video_info.title, function() {
		Array.from(document.getElementsByTagName("textarea")).filter(i=>i.name=="description")[0].focus();
		//descr
		
		simulateClearTextbox();
		simulateTypeText(video_info.description, function() {
			Array.from(document.getElementsByTagName("input")).filter(i=>i.type=="text" && i.name=="tags")[0].focus();
			
			var tags = video_info.tags.filter(tag => !tag.includes(",")).filter(onlyUnique).slice(0,50).join("\n");
			if(tags.length > 0)
				tags += "\n";
			
			//tags
			simulateClearTextbox();
			simulateTypeText(tags, function() {
				// click publish
				document.getElementsByClassName("salad-button")[2].click();
				
				setTimeout(function() {
					chrome.runtime.sendMessage({closeThis: true});
				}, 6000);
			});
		});
	});
}
