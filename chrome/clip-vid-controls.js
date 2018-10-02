// dbg

function getVideoClip(cb) {
	if(!vid_blob) {
		cb(null)
		return;
	}
	
	sliceMp4(vid_blob, vid_file_name, getVideoClipPos(), getVideoClipDur(), function(mp4Blob) {
		console.log("vid done clipping")
		cb(mp4Blob);
	});
}

//util

function isFullscreen() {
	var isInFullScreen = (document.fullscreenElement && document.fullscreenElement !== null) ||
	(document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
	(document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
	(document.msFullscreenElement && document.msFullscreenElement !== null);
	return isInFullScreen;
}

function secToPct(seconds) {
	return seconds/$("social_vid").duration;
}

function pctToSec(pct) {
	return $("social_vid").duration*pct;
}

// updaters

function setVideoPosPct(pct) {
	$("social_vid").loopInClip = false;
	$("social_vid").currentTime = ($("social_vid").duration * pct) || 0;
}

function setVideoClipPct(pct) {
	$("custom_controls_clipper_container").style.width = pct+"%";
}

function setVideoClipDur(sec) {
	sec = clamp(parseFloat(sec), 1, $("social_vid").duration);
	$("custom_controls_clipper_container").style.width = (secToPct(sec)*100)+"%";
}

function getVideoClipDur() {
	var dur = ((parseFloat($("custom_controls_clipper_container").style.width)||0)/100) * $("social_vid").duration;
	return Math.min($("social_vid").duration, dur);
}

function getVideoClipPos() {
	return ((parseFloat($("custom_controls_clipper_container").style.left)||0)/100) * $("social_vid").duration;
}

function setVideoClipPos(sec) {
	sec = clamp(parseFloat(sec), 0, $("social_vid").duration);
	$("custom_controls_clipper_container").style.left = (secToPct(sec)*100)+"%";
}

function updateVideoClipPos() {
	var min = parseInt($("social_preview_pos_min").value);
	setVideoClipPos(min*60 + parseInt($("social_preview_pos").value));
}

// vid events

function addPosMins(m) {
	var cur = parseInt($("social_preview_pos_min").value)
	$("social_preview_pos_min").value = parseInt(cur + m);
}

$("social_preview_pos_min").oninput = function() {
	if(this.value != parseInt(this.value))
		this.value = parseInt(this.value);
		
	updateVideoClipPos();
}

$("social_preview_pos").oninput = function() {
	var val = parseFloat(this.value).toFixed(2);
	val = parseFloat(clamp(val, 0, $("social_vid").duration||0)).toFixed(2);
	
	if(val >= 60) {
		var m = Math.floor(val/60);
		val = val%60;
		addPosMins(m);
	}
	else
		updateVideoClipPos();
	
	if( parseFloat(this.value).toFixed(2) != val )
		this.value = parseFloat(val).toFixed(2);
}

$("social_preview_duration").oninput = function() {
	var val = parseFloat(this.value).toFixed(2);
	val = parseFloat(clamp(val, 1, $("social_vid").duration||0)).toFixed(2);
	val = Math.min(44, val) // twitter max length is 44
	setVideoClipDur(val);
	
	if( parseFloat(this.value).toFixed(2) != val )
		this.value = parseFloat(val).toFixed(2);
}

$("social_vid").addEventListener("click", function(){
	if (this.paused)
		this.play();
	else
		this.pause();
})

$("social_vid").addEventListener("loadedmetadata", function(){
	this.paused = true;
	$("play_button").src = "img/play.svg"
	this.muted = $("volume_button").src == "img/volume-off.svg";
	setVideoClipDur($("social_preview_duration").value);
	setVideoClipPos(0)
	$("social_preview_pos").value = "00";
	$("social_preview_pos_min").value = 0;
});
$("social_vid").addEventListener("timeupdate", function(){
	var pct = this.currentTime / this.duration;
	
	_G("custom_controls_seeker").style.left = clamp(pct*100, 0, 100)+"%";
	
	var inClip = this.currentTime >= getVideoClipPos() && this.currentTime <= (getVideoClipPos()+getVideoClipDur());
	if( $("social_vid").loopInClip && !inClip ) {
		this.currentTime = getVideoClipPos();
	}
	
	$("social_vid").loopInClip = inClip;
})

// controls

_G("custom_controls_timeline_div").onmousedown = function(e) {
	var rect = this.getBoundingClientRect();
	var curMouseX = parseInt(e.clientX - rect.left);
	var curMouseY = parseInt(e.clientY - rect.top);
	
	var inBounds = curMouseX > 0 && curMouseX < rect.width && curMouseY > 0 && curMouseY < rect.height;
	
	this.isSeeking = curMouseY > 0 && inBounds;
	this.isMovingClip = curMouseY <= 0 && _G("custom_controls_clipper_container").contains(e.target);
	
	this.lastMouseX = curMouseX;
	this.lastMouseY = curMouseY;
	
	var pctAcross = (curMouseX/rect.width) * 100;
	if(this.isSeeking) {
		_G("custom_controls_seeker").style.left = clamp(pctAcross, 0, 100)+"%";
		setVideoPosPct(pctAcross/100);
	}
	else if (this.isMovingClip) {
		this.style.cursor = "-webkit-grabbing";
		_G("custom_controls_grab_handle").style.cursor = "-webkit-grabbing";
	}
}
_G("custom_controls_timeline_div").onmouseup = _G("custom_controls_timeline_div").onmouseleave = function(e) {
	var rect = this.getBoundingClientRect();
	var curMouseX = parseInt(e.clientX - rect.left);
	var curMouseY = parseInt(e.clientY - rect.top);
	
	if(this.isSeeking && curMouseX <= 0) {
		// set to 0 if go past
		_G("custom_controls_seeker").style.left = clamp(0, 0, 100)+"%";
		setVideoPosPct(0);
	}
	else if(this.isSeeking && curMouseX >= (rect.width-1)) {
		// set to 100 if go past
		_G("custom_controls_seeker").style.left = clamp(100, 0, 100)+"%";
		setVideoPosPct(100);
	}
	
	if(this.isMovingClip) {
		//setVideoPosPct((parseFloat(_G("custom_controls_clipper_container").style.left)||0)/100)
	}
	
	this.isSeeking = false;
	this.isMovingClip = false;
	this.style.cursor = "auto";
	_G("custom_controls_grab_handle").style.cursor = "-webkit-grab";
}
_G("custom_controls_timeline_div").onmousemove = function(e) {
	var rect = this.getBoundingClientRect();
	var curMouseX = parseInt(e.clientX - rect.left);
	var curMouseY = parseInt(e.clientY - rect.top);
	
	var inBounds = curMouseX > 0 && curMouseX < rect.width && curMouseY > 0 && curMouseY < rect.height;
	
	var moveX = curMouseX - this.lastMouseX;
	var moveY = curMouseY - this.lastMouseY;
	
	var pctAcross = (curMouseX/rect.width) * 100;
	var pctMove = (moveX/rect.width) * 100;
	if(this.isSeeking && inBounds) {
		_G("custom_controls_seeker").style.left = clamp(pctAcross, 0, 100)+"%";
		setVideoPosPct(pctAcross/100);
	}
	else if(this.isMovingClip) {
		var curPctLeft = parseFloat(_G("custom_controls_clipper_container").style.left)||0;
		
		curPctLeft = clamp(curPctLeft + pctMove, 0, 100 - parseFloat(_G("custom_controls_clipper_container").style.width))
		_G("custom_controls_clipper_container").style.left = curPctLeft+"%";
		
		var sec = pctToSec(curPctLeft/100);
		var min = Math.floor(sec/60.0)
		sec = sec%60;
		$("social_preview_pos_min").value = min||0;
		$("social_preview_pos").value = sec||"00";
	}

	this.lastMouseX = curMouseX;
	this.lastMouseY = curMouseY;
	
	_G("social_vid")
}

$("fullscreen_button").onclick = function(e) {
	 var isInFullScreen = isFullscreen();

	if ( !isInFullScreen ) {
		$("video_container").webkitRequestFullScreen();
	}
	else {
		console.log('aa')
		document.webkitExitFullscreen();
	}
}

$("video_container").addEventListener("webkitfullscreenchange", function(e){
	// The event object doesn't carry information about the fullscreen state of the browser,
	// but it is possible to retrieve it through the fullscreen API
	if (  isFullscreen() ) {
		// The target of the event is always the document,
		// but it is possible to retrieve the fullscreen element through the API
		$("fullscreen_button").src = "img/fullscreen-exit.svg";
	}
	else
		$("fullscreen_button").src = "img/fullscreen-enter.svg";
});

$("volume_button").onclick = function(e) {
	$("social_vid").muted = !$("social_vid").muted;
}

$("play_button").onclick = function(e) {
	if( $("social_vid").paused ) {
		$("social_vid").play();
	}
	else {
		$("social_vid").pause();
	}
}


$("social_vid").addEventListener("pause", function(){
	$("play_button").src = 'img/play.svg';
})
$("social_vid").addEventListener("play", function(){
	$("play_button").src = 'img/pause.svg';
})
$("social_vid").addEventListener("volumechange", function(){
	if(this.muted) {
		$("volume_button").src = "img/volume-off.svg";
	}
	else {
		$("volume_button").src = "img/volume-up.svg";
	}
})
