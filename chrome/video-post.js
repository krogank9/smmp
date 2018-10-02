var ONE_MEGABYTE = 1000000
var vid_blob = null;
var vid_blob_name = "";
var vid_file_name = "";

var file_input = getId("file_input")
var thumbnail_upload = getId("thumbnail_upload")

var thumbnail_canvas = getId("thumbnail_canvas");
var thumbnail_canvas_ctx = thumbnail_canvas.getContext("2d");
var thumbnail_file_url = null;
var thumbnail_img = null;
var thumbnail_text_pos = {x: 200, y: 100};

////////// yt tut
_G("close_yt_tut").onclick = function() {
	_G("youtube_tut_overlay").style.display = "none";
	_G("yt_tut_frame").src = "";
	chrome.storage.local.set({"closed_tut_once": true}, function() {
	});
}

chrome.storage.local.get(["closed_tut_once"], function(result) {
	var tut_closed_once = result["closed_tut_once"];
	if(!tut_closed_once) {
		_G("youtube_tut_overlay").style.display = "block";
		_G("yt_tut_frame").src = "http://www.youtube.com/embed/R5WsAy7bZmA?autoplay=true";
	}
});
//////////

$("facebook_page_url").onchange = function() {
	var s = this.value;
	if (s.includes("facebook.com/")) {
		s = s.substring(s.indexOf("facebook.com/"));
		var arr = s.split("/")
		s = arr[0] + "/" + arr[1];
	}
	else if(!s.includes("/")) {
		s = "facebook.com/"+s;
	}
	
	if(s != this.value) {
		this.value = s;
	}
}

$("video_tags_input").tagsChanged = $("title_input").oninput = function() {
	// set social headline when title & tags are changed
	var headline = $("title_input").value.trim();
	var tags = $("video_tags_input").getTags().filter(tag => !tag.includes(" ") && !tag.includes(",")).filter(onlyUnique).map(t => "#" + t)
	if (tags.length > 0)
		headline += " " + tags.join(" ");
		
	while(headline.length > 230) {
		// remove last word
		headline = headline.split(" ")
		if(headline.length > 1)
			headline = headline.slice(0,headline.length-1).join(" ")
		else {
			headline = headline.join(" ")
			break;
		}
	}
	$("social_headline").value = headline + " Full vid:"
}

function addSocialPreviewImg(url, name) {
	let container = document.createElement("div");
	container.style.width = "200pt";
	container.style.height = "200pt";
	container.style.marginRight = "4px";
	container.style.textAlign = "center";
	container.style.border = "1px solid #aaaaaa";
	container.style.display = "inline-block";
	container.style.position = "relative";
	container.style.overflow = "hidden";
	
	let close_button = document.createElement("div");
	close_button.style.position = "absolute";
	close_button.style.top = "0px";
	close_button.style.right = "0px";
	close_button.classList.add("close_button");
	close_button.onclick = function() {
		container.parentElement.removeChild(container);
		var curCount = parseInt(_G("social_image_count").innerHTML);
		_G("social_image_count").innerHTML = curCount-1 + " image"+(curCount-1==1?"":"s");
		_G("social_preview_upload").value = ""; //incase want to reupload
	}

	let social_preview_img = document.createElement("img");
	social_preview_img.style.maxWidth = "200pt";
	social_preview_img.style.maxHeight = "200pt";
	social_preview_img.style.margin = "auto";
	social_preview_img.style.overflow = "hidden";
	social_preview_img.src = url;
	social_preview_img.fileName = name;
	social_preview_img.classList.add("social_preview_img_elem");

	let spaceDiv = document.createElement("div")
	spaceDiv.style.height = "0px";

	container.appendChild(spaceDiv)
	container.appendChild(social_preview_img)
	container.appendChild(close_button)
	_G("social_image_preview").appendChild(container)

	social_preview_img.onload = function() {
		this.onload = null;
		spaceDiv.style.height = Math.floor((container.offsetHeight - social_preview_img.height)/2 - 1/*-1 for border*/)+"px";
	}
	
	var curCount = parseInt(_G("social_image_count").innerHTML);
	_G("social_image_count").innerHTML = curCount+1 + " image"+(curCount+1==1?"":"s");
}

function setStep(num) {
	$("step1_card").classList.remove("selected")
	$("step2_card").classList.remove("selected")
	$("step3_card").classList.remove("selected")
	
	$("step1").style.display = num==1?"block":"none";
	if(num==1)
		$("step1_card").classList.add("selected")
	
	$("step2").style.display = num==2?"block":"none";
	if(num==2)
		$("step2_card").classList.add("selected")
	
	$("step3").style.display = num==3?"block":"none";
	if(num==3)
		$("step3_card").classList.add("selected")
	
	$("social_vid").pause();
	$("thumbnail_vid").pause();
}

$("step1_card").onclick = function() { setStep(1) }
$("step2_card").onclick = function() { setStep(2) }
$("step3_card").onclick = function() { setStep(3) }

getClass("goto_step1").forEach(function(c){c.onclick = function() {
	setStep(1);
}})
getClass("goto_step2").forEach(function(c){c.onclick = function() {
	setStep(2);
}})
getClass("goto_step3").forEach(function(c){c.onclick = function() {
	setStep(3);
}})

_G("social_preview_select").onchange = function() {
	if(this.value == "Clip") {
		$("social_vid_preview").style.display = "block"
		$("social_image_preview").style.display = "none"
	}
	else if(this.value == "Images"){
		$("social_vid_preview").style.display = "none"
		$("social_image_preview").style.display = "block"
	}
	else {
		$("social_vid_preview").style.display = "none"
		$("social_image_preview").style.display = "none"
	}
}
document.addEventListener("DOMContentLoaded", function(){
	setTimeout(function(){_G("social_preview_select").onchange()},1000);
});

_G("social_preview_grab").onclick = function() {
	chooseVideoFrame(addSocialPreviewImg);
}
_G("social_preview_upload").onchange = function() {
	Array.from(this.files).forEach(function(file) {
		addSocialPreviewImg(URL.createObjectURL(new  Blob([file])), file.name);
	});
}

getId("cancel_grab_thumbnail").onclick = function() {
	getId("frame_grab_overlay").style.display = "none";
}
getId("close_grab_thumbnail").onclick = function() {
	getId("frame_grab_overlay").style.display = "none";
}
getId("frame_grab_overlay").onclick = function() {
	getId("frame_grab_overlay").style.display = "none";
}
getId("frame_grab_window").onclick = function(evt) {
	evt.stopPropagation();
}

function setThumbnailFromUrl(url) {
	thumbnail_img = new Image();
	thumbnail_img.src = thumbnail_file_url;
	thumbnail_upload.value = "";
	//getId("thumbnail_canvas").width = getId("thumbnail_vid").videoWidth/2;
	//getId("thumbnail_canvas").height = getId("thumbnail_vid").videoHeight/2;
}

getId("show_grab_thumbnail").onclick = function() {
	getId("frame_grab_overlay").style.display = "block";
	chooseVideoFrame(setThumbnailFromUrl);
}

var cur_frame_callback = setThumbnailFromUrl;
function chooseVideoFrame(callback) {
	cur_frame_callback = callback;
	getId("frame_grab_overlay").style.display = "block";
}
getId("grab_frame_thumbnail").onclick = function() {
	thumbnail_file_url = videoFrameToUrl(getId("thumbnail_vid"));

	cur_frame_callback(thumbnail_file_url, "img.png");

	getId("frame_grab_overlay").style.display = "none";
}

function drawThumbnailCanvas() {
	if(_G("step1").style.display == "none") {
		//setTimeout(drawThumbnailCanvas, 3000);
		//return;
	}
	
	var ctx = thumbnail_canvas_ctx;
	ctx.clearRect(0,0,thumbnail_canvas.width,thumbnail_canvas.height)
	
	var text = getId("thumbnail_text").value;
	var posX = thumbnail_canvas.width/2;
	var posY = 0;
	
	ctx.textAlign = "center";
	if(_G("thumbnail_font_pos").value == "bottom") {
		ctx.textBaseline = "bottom";
		posY = thumbnail_canvas.height*0.975;
	}
	else if(_G("thumbnail_font_pos").value == "top") {
		posY = thumbnail_canvas.height*0.025;
		ctx.textBaseline = "top";
	}
	else {
		posY = thumbnail_canvas.height/2;
		ctx.textBaseline = "middle";
	}
	
	// draw image
	if(thumbnail_img) {
		var canvas_ratio = thumbnail_canvas.width/thumbnail_canvas.height;
		var img_ratio = thumbnail_img.width/thumbnail_img.height;
		var img_is_wider = img_ratio > canvas_ratio;
		
		var drawWidth = 0;
		var drawHeight = 0;
		
		if(img_is_wider) {
			drawWidth = thumbnail_canvas.width;
			drawHeight = drawWidth / img_ratio;
		}
		else {
			drawHeight = thumbnail_canvas.height;
			drawWidth = drawHeight * img_ratio;
		}
		
		ctx.fillStyle = "black";
		ctx.fillRect(0,0,thumbnail_canvas.width, thumbnail_canvas.height)
		ctx.drawImage(thumbnail_img,
					0,0, thumbnail_img.width, thumbnail_img.height, // clip
					(thumbnail_canvas.width-drawWidth)/2, (thumbnail_canvas.height-drawHeight)/2,
					drawWidth, drawHeight);
	}

	// draw text
	var font_str = _G("thumbnail_font").value;
	var font_style_str = _G("thumbnail_font_style").value + " " + _G("thumbnail_font_weight").value;

	var font_size = 0;
	if (text != "") {
		font_size = getOptimalSize(ctx, text, font_str, 0.02, font_style_str)[1];
	}
	
	var font_color = _G("thumbnail_font_color").value
	var shadow_color = _G("thumbnail_font_shadow").value;
	
	// shadow
	if(shadow_color == "match")
		shadow_color = font_color;
		
	if (shadow_color != "none") {
		var double = false;
		if(shadow_color.startsWith("dark ") || shadow_color.startsWith("bright ")) {
			double = true;
			shadow_color = shadow_color.split(" ")[1];
		}
		ctx.fillStyle = shadow_color;
		ctx.filter = "blur("+(font_size/25)+"px)";
		ctx.fillText(getId("thumbnail_text").value,posX,posY)
		if(double)
			ctx.fillText(getId("thumbnail_text").value,posX,posY)
		ctx.filter = "none";
	}
	
	// text
	ctx.fillStyle = font_color;
	ctx.fillText(getId("thumbnail_text").value,posX,posY)
	
	setTimeout(drawThumbnailCanvas, _G("step1").style.display == "none"? 2000:500);
}
drawThumbnailCanvas()

function saveFile (name, type, data) {
	console.log("saving")
    if (data != null && navigator.msSaveBlob)
        return navigator.msSaveBlob(new Blob([data], { type: type }), name);
    var a = document.createElement("a")
    a.style = "display: none";
    var url = window.URL.createObjectURL(new Blob([data], {type: type}));
    a.href = url
    a.download = name
    document.body.append(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
}

getId("thumbnail_vid").onclick = function(evt) {
	this.focus();
	
	this.lastClick = Date.now();
	
	if(this.paused)
		this.play()
	else
		this.pause()
	
	this.controls = true;
}

thumbnail_upload.onchange = function(evt) {
	var file = this.files[0];
	thumbnail_img = new Image();
	thumbnail_img.onload = function() {
		//getId("thumbnail_canvas").width = thumbnail_img.width;
		//getId("thumbnail_canvas").height = thumbnail_img.height;
		this.onload = null;
	}
	thumbnail_img.src = URL.createObjectURL(new  Blob([file]));
}

file_input.onchange = function(evt) {
	var file = this.files[0];
	
	if(!file)
		return;
	
	$("video_disabled_overlay").style.display = "none";
	
	_G("file_input_text").innerHTML = "Uploaded file: <b>"+file.name+"</b>";
	
	vid_file_name = file.name;
	vid_blob = new Blob([file]);
	getId("social_vid_source").src = URL.createObjectURL(vid_blob);
	getId("thumbnail_vid_source").src = URL.createObjectURL(vid_blob);
	getId("thumbnail_vid").load();
	getId("social_vid").load();
	getId("thumbnail_vid").addEventListener( "loadedmetadata", function (e) {		
		this.currentTime = this.duration/2;
}, false );
	getId("social_vid").addEventListener( "loadedmetadata", function (e) {		
		//this.currentTime = this.duration/2;
}, false );
	getId("thumbnail_vid").onseeked = function() {
		if (thumbnail_img == null) {
			getId("grab_frame_thumbnail").click();
		}
	}
	//getId("thumbnail_vid").play();
	
	return;
	
	saveFileToStorageChunked(file, "myFile", function() {
		//send message to be received by bitchute tab
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {contents: "fileReady"}, function(response) {
				console.log("sent fileReady")
			});
		});
	});

/*
	console.log("starting save...")
	saveFileToStorageChunked(file, "fileMy", function() {
		console.log("starting load...")
		loadFileFromStorageChunked("fileMy", function(file_list) {
			file_input2.files = file_list;
			file_input2.files = file_input.files;
			saveFile(file_list[0].name, file_list[0].type, file_list[0])
			//console.log('aaa')
		});
	});
*/
}
