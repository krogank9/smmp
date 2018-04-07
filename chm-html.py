###############
# HTML PARSER #
###############

UNCLOSED_TAGS = [
	"!--", "meta", "!doctype", "area", "base", "br", "col", "command", 
	"embed", "hr", "img", "input", "keygen", "link", "menuitem", "param", 
	"source", "track", "wbr"
]
ONLY_OPEN_TAGS = ["br", "hr"] # treat as open tag if encounter a close tag (error tolerance)
SKIP_TAGS = [ "style", "script" ]
CHAIN_CLOSE_TAGS = ["li"] # close if try to make same tag inside tag

WHITESPACE_CHARS = [" ", "\t", "\n", "\r", "\v"]

# HELPER FUNCTIONS
def cleanArray(arr):
	return list(filter(None, arr))

def stripCleanArray(arr):
	newArr = []
	for e in arr:
		stripped = e.strip()
		if e:
			newArr.append(e)
	return newArr
	
def splitStrByWhitespace(string):
	return cleanArray(string.split())

def charIsWhitespace(c):
	return c in WHITESPACE_CHARS

def indexOfWhitespace(string):
	index = -1
	for whitespace in WHITESPACE_CHARS:
		index = string.find(whitespace)
		if index != -1:
			break
	return index

#HTMLNode
class HTMLNode():
	def __init__(self, tagInfo=None):
		self.children = []
		self.tagName = ""
		self.outerHTML = ""
		self.innerHTML = ""
		self.openingTag = ""
		self.closingTag = ""
		self.attrs = ""
		self.attrsObj = {}
		self.startPos = 0
		self.firstChild = None
		self.lastChild = None
		self.nextChild = None
		self.previousChild = None
		self.parent = None
		self.childReplaced = False
		if tagInfo:
			self.tagName = tagInfo["tagName"]
			self.outerHTML = tagInfo["wholeTag"]
			self.openingTag = tagInfo["wholeTag"]
			self.attrs = tagInfo["attrs"]
			self.attrsObj = tagInfo["attrsObj"]
			self.startPos = tagInfo["startPos"]
	
	def addChild(self, node):
		if not self.firstChild:
			self.firstChild = node
		node.parent = self
		node.previousChild = self.lastChild
		if node.previousChild:
			node.previousChild.nextChild = node;
		self.lastChild = node
		self.children.append(node)
		return node
	
	def getNodeChildren(self):
		nodes = []
		child = self.firstChild
		while child:
			nodes.append(child)
			child = child.nextChild
		return nodes
	
	def replaceHTML(self, new_html):
		self.outerHTML = new_html
		parent = self.parent
		while parent:
			parent.childReplaced = True
			parent = parent.parent
			
	def remakeHTML(self):
		if self.childReplaced:
			updatedHTML = self.openingTag
			for child in self.children:
				if isinstance(child, basestring):
					updatedHTML += child
				else:
					updatedHTML += child.remakeHTML()
			updatedHTML += self.closingTag
			return updatedHTML
		else:
			return self.outerHTML
	
	def findChildrenByTagName(self, name):
		found = []
		name_lower = name.lower()
		for child in self.getNodeChildren():
			if child.tagName.lower() == name_lower:
				found.append(child)
		return found
	
	def recurseFindChildrenByTagName(self, name):
		found = []
		name_lower = name.lower()
		for child in self.getNodeChildren():
			if child.tagName.lower() == name_lower:
				found.append(child)
			found = found + child.recurseFindChildrenByTagName(name)
		return found
		
	#debug functions
	def getPrint(self, indent=0):
		string = ""
		for child in self.getNodeChildren():
			string += "\n"+("  "*indent)+"> "+child.tagName
			string += child.getPrint(indent+1)
		return string
	def printMe(self):
		print(self.getPrint().strip())
		
# ATTRIBUTE PARSER
def parseAttrs(attrs):
	attrsObj = {}
	pos = 0
	attrs = attrs.split("=")
	def setEmptyAttrs(string, noMoreAttrs=False):
		components = splitStrByWhitespace(string)
		sliceTo = len(components) - 1
		#treat last word as an empty (implicitly true) attribute if 
		#there are no more explictly assigned attributes following it
		if noMoreAttrs:
			sliceTo += 1
		for attrName in components[0:sliceTo]:
			attrsObj[attrName] = True
		return components[-1]
	
	#loop through all attributes. after setting all empty ones,
	#remove them from before the attribute so it can be used on
	#next loop iteration as the key for the first word/quotation (value)
	#on other side of = sign
	attrs = stripCleanArray(attrs)
	attrs[0] = setEmptyAttrs(attrs[0]).lower()
	for i in range(1,len(attrs)):
		attrs[i] = attrs[i].strip()
		if attrs[i][0] == '"' or attrs[i][0] == "'":
			sep = attrs[i][0]
			lastIndex = attrs[i].rfind(sep)
			prevAttrsValue = attrs[i][1:lastIndex]
			attrsObj[attrs[i-1]] = prevAttrsValue
			attrs[i] = attrs[i][len(prevAttrsValue)+2:] #+2 for 2 quotes
		else:
			spaceIndex = indexOfWhitespace(attrs[i])
			prevAttrsValue = ""
			if spaceIndex > -1:
				prevAttrsValue = attrs[i][0:spaceIndex]
			else:
				prevAttrsValue = attrs[i]
			attrsObj[attrs[i-1]] = prevAttrsValue
			attrs[i] = attrs[i][len(prevAttrsValue):] #remove value after set
		if len(attrs[i]) > 0:
			attrs[i] = setEmptyAttrs(attrs[i], i==(len(attrs)-1)).lower()
			
	return attrsObj

# HTML PARSER
cursor_pos = 0
def parseHTML(html):
	html_lower = html.lower()
	global cursor_pos
	cursor_pos = 0 # global to modify in nested func
	rootNode = HTMLNode()
	curNode = rootNode
	# navigate past > of tag and get tags info
	def parseTagStartingHere():
		global cursor_pos
		tagInfo = {'wholeTag':"", 'insideTag':"", 'tagName':"", 'isClosing':False, 'attrs':"", 'attrsObj':{}, 'startPos':cursor_pos}
		endPos = html.find(">", cursor_pos)
		if endPos > -1:
			tagInfo["wholeTag"] = html[cursor_pos:endPos+1]
			cursor_pos = endPos+1
		else:
			cursor_pos = len(html)
			return tagInfo
		
		tagInfo["insideTag"] = tagInfo["wholeTag"][1:-1]
		if tagInfo["insideTag"][0] == "/":
			tagInfo["insideTag"] = tagInfo["insideTag"][1:]
			tagInfo["isClosing"] = tagInfo["insideTag"].lower().strip() not in ONLY_OPEN_TAGS
		if tagInfo["insideTag"][-1] == "/":
			tagInfo["insideTag"] = tagInfo["insideTag"][0:-1]
		
		split_tag = splitStrByWhitespace(tagInfo["insideTag"])
		tagInfo["tagName"] = split_tag[0]
		if len(split_tag) > 1 and tagInfo["tagName"] != "!--":
			tagInfo["attrs"] = tagInfo["insideTag"][len(tagInfo["tagName"]):].strip()
			tagInfo["attrsObj"] = parseAttrs(tagInfo["attrs"])
		
		return tagInfo
	
	# loop through whole html file
	while cursor_pos < len(html):
		nextTagPos = html.find("<", cursor_pos)
		if nextTagPos > -1:#found a tag
			if nextTagPos - cursor_pos > 0:#make sure not at last character
				curNode.children.append(html[cursor_pos:nextTagPos])
				cursor_pos = nextTagPos
		else: #no more tags
			if cursor_pos < len(html) - 1: #save remaining text if any
				curNode.children.append(html[cursor_pos:])
			break
		
		#now at a tag, parse then create its node and descend into it
		tagInfo = parseTagStartingHere()
		if tagInfo["isClosing"]:
			tagWasOpened = False
			walkUpParents = curNode
			while walkUpParents and tagWasOpened is False:
				if walkUpParents.tagName.lower() == tagInfo["tagName"].lower():
					tagWasOpened = True
				walkUpParents = walkUpParents.parent
			if tagWasOpened: #auto close all unclosed tags opened inside
				while curNode is not rootNode:
					if curNode.tagName.lower() == tagInfo["tagName"].lower():
						curNode.closingTag = tagInfo["wholeTag"]
					curNode.innerHTML = html[curNode.startPos+len(curNode.openingTag):tagInfo["startPos"]]
					curNode.outerHTML = curNode.openingTag+curNode.innerHTML+curNode.closingTag
					if curNode.tagName.lower() == tagInfo["tagName"].lower():
						curNode = curNode.parent
						break
					curNode = curNode.parent
			else: #broken html.. but append tag as string for remaking
				curNode.children.append( parseTagStartingHere()["wholeTag"] )
		else: #tagInfo["isClosing"] == False:
			if (curNode.tagName.lower() == tagInfo["tagName"].lower() 
				and tagInfo["tagName"].lower() in CHAIN_CLOSE_TAGS):
				curNode.innerHTML = html[curNode.startPos+len(curNode.openingTag):tagInfo["startPos"]]
				curNode.outerHTML = curNode.openingTag+curNode.innerHTML
				curNode = curNode.parent #chainable tags.. such as <li>
				curNode = curNode.addChild( HTMLNode(tagInfo) ) #close prev and add next as sibling in parent
			else:
				curNode = curNode.addChild( HTMLNode(tagInfo) )
				if curNode.tagName.lower() in UNCLOSED_TAGS:
					#unclosed tags can be optionally closed e.g. <img></img>
					#check for the </img>
					opt_close = html_lower.find("</"+curNode.tagName.lower(), cursor_pos)
					if opt_close > -1 and len(html[cursor_pos:opt_close].strip()) == 0:
						lastChar = html[opt_close+2+len(curNode.tagName)+1]
						# make sure optional close is valid and for right tag name
						if lastChar == ">" or charIsWhitespace(lastChar):
							curNode.innerHTML = html[cursor_pos:opt_close]
							cursor_pos = opt_close
							curNode.closingTag = parseTagStartingHere()["wholeTag"]
					curNode.outerHTML = curNode.openingTag+curNode.innerHTML+curNode.closingTag
					curNode = curNode.parent
				elif curNode.tagName.lower() in SKIP_TAGS:
					#skip over entirely the contents in script/style tags
					#as their syntax is not html. just jump to close tag
					newPos = html_lower.find(curNode.tagName.lower(), cursor_pos)
					if newPos < 0:
						newPos = html.length
					curNode.innerHTML = html[cursor_pos, newPos]
					curNode.closingTag = parseTagStartingHere()["wholeTag"]
					curNode.outerHTML = curNode.openingTag+curNode.innerHTML+curNode.closingTag
					cursor_pos = newPos
					
	while curNode is not rootNode: # close any tags still open
		curNode.innerHTML = html[curNode.startPos+len(curNode.openingTag):]
		curNode.outerHTML = curNode.openingTag+curNode.innerHTML
		curNode = curNode.parent
		
	for child in rootNode.children:
		if isinstance(child, basestring):
			rootNode.outerHTML += child
		else:
			rootNode.outerHTML += child.outerHTML
	
	return rootNode


########################
# CHM TO HTML COMPILER #
########################

import os, sys, codecs

WWW_INDEX_NAMES = ["index.html", "index.htm", "default.html", "default.htm", "home.html", "home.htm"]

# HELPER FUNCTIONS

def strMatch(string, compareTo):
	sPos = 0
	while sPos < len(string) and sPos < len(compareTo):
		if string[sPos] == "*": # if there is a wildcard, replace 
			wildcard = "*"
			wildcardText = ""
			nextChar = string[sPos+1:]
			for c in nextChar:
				if c == "*":
					wildcard += "*"
				else:
					nextChar = c
					break
			if len(nextChar) > 1:
				nextChar = ""
			for c in compareTo[sPos:]:
				if c != nextChar:
					wildcardText += c
				else:
					break
			string = string.replace(wildcard, wildcardText, 1)
		if string[sPos] != compareTo[sPos]:
			return False
		sPos += 1
	# would have returned False already if they aren't the same,
	#  unless one string ended before the other
	return len(string) == len(compareTo)
		

def codecsReadAuto(name):
	try:
		return codecs.open(name, "r", encoding="utf-8").read()
	except:
		return codecs.open(name, "r", encoding="gbk").read()

def readFileCaseInsensitive(name):
	# first make sure leading folders are correct case
	folders = name.split("/")
	name = folders[-1]
	folders = folders[:-1]
	for i in range(len(folders)):
		curPath = "/".join(folders[0:i+1])
		if i == 0:
			curPath = os.getcwd()
		files = os.listdir(curPath)
		for f in files:
			if f.lower() == folders[i].lower():
				folders[i] = f
				break
	# then open file
	files = []
	if folders:
		files = os.listdir("/".join(folders))
	else:
		files = os.listdir(os.getcwd())
	for f in files:
		if strMatch(name.lower(), f.lower()):
			name = f
	if folders:
		return codecsReadAuto("/".join(folders)+"/"+name)
	else:
		return codecsReadAuto(name)
	
def isDirCaseInsensitive(name):
	files = os.listdir(os.getcwd())
	for f in files:
		if os.path.isdir(f) and strMatch(name.lower(), f.lower()):
			return True
	return False
	
def isFileCaseInsensitive(name):
	files = os.listdir(os.getcwd())
	for f in files:
		if os.path.isfile(f) and strMatch(name.lower(), f.lower()):
			return True
	return False
	
def ensurePathIsFile(path):
	if isDirCaseInsensitive(path):
		if path[-1] != "/":
			path += "/"
		possible_files = [s + path for s in WWW_INDEX_NAMES]
		for f in possible_files:
			if isFileCaseInsensitive(f):
				return f
	else:
		return path
		
def escapeStringForJS(string):
	string = string.replace("</script", "<\\/script")
	return string
	
def replaceAfterIndex(string, text, replacement, index=0):
	textPos = string.find(text)
	if textPos == -1:
		return string
	pre = string[0:textPos]
	post = string[textPos:]
	return pre+post.replace(text, replacement)
	
def getUniqueItems(iterable):
	result = []
	for item in iterable:
		if item not in result:
			result.append(item)
	return result
	
def str_arr(arr):
	elem_strs = []
	for elem in arr:
		if isinstance(elem, list):
			elem_strs.append( str_arr(elem) )
		else:
			elem_str = repr(elem)
			if len(elem_str) == 0:
				continue
			if elem_str[0] == "u":
				elem_str = elem_str[1:]
			elem_strs.append( elem_str )
	return "["+",".join(elem_strs)+"]"

# INDEX MAKER, TABLE OF CONTENTS MAKER, AND STYLE REPLACER:

index_names = []
index_links = []
toc_paths = []
toc_html = []
toc_arr_str = []

def make_index(index_str):
	global index_names
	global index_links
	parsed = parseHTML(index_str)
	cur = parsed.findChildrenByTagName("html")[0]
	cur = cur.findChildrenByTagName("body")[0]
	cur = cur.findChildrenByTagName("ul")[0]
	for child in cur.getNodeChildren():
		if child.tagName.lower() != "li":
			continue
		li = child
		obj = li.findChildrenByTagName("object")[0]
		first_name_param = None
		for param in obj.getNodeChildren():
			if not first_name_param and param.attrsObj["name"] == "Name":
				first_name_param = param
			elif param.attrsObj["name"] == "Local":
				index_names.append(first_name_param.attrsObj["value"])
				index_links.append(param.attrsObj["value"])
	
def getTocArrFromUL(ul):
	lis = ul.findChildrenByTagName("li")
	ul_arr = []
	for li in lis:
		obj = li.findChildrenByTagName("object")[0]
		li_arr = ["", ""]
		for param in obj.getNodeChildren():
			if param.attrsObj["name"] == "Name":
				li_arr[0] = param.attrsObj["value"]
			if param.attrsObj["name"] == "Local":
				li_arr[1] = ensurePathIsFile(param.attrsObj["value"])
				toc_paths.append(li_arr[1])
		childUL = li.findChildrenByTagName("ul")
		if childUL:
			li_arr += getTocArrFromUL(childUL[0])
		ul_arr.append(li_arr)
				
	return ul_arr
	
def make_toc(toc_str):
	global toc_paths, toc_arr
	parsed = parseHTML(toc_str)
	cur = parsed.findChildrenByTagName("html")[0]
	cur = cur.findChildrenByTagName("body")[0]
	cur = cur.findChildrenByTagName("ul")[0]
	
	toc_arr = getTocArrFromUL(cur)
	toc_paths = getUniqueItems(toc_paths)

def replace_styles(html_str, file_path):
	parsed = parseHTML(html_str);
	styles = parsed.recurseFindChildrenByTagName("link")
	for style in styles:
		style_path = style.attrsObj["href"]
		num_parents = style_path.count("../")
		style_path_end = style_path.replace("../", "").split("/")
		full_style_path = "/".join(file_path[:-num_parents]+style_path_end)
		style_file_contents = readFileCaseInsensitive(full_style_path)
		style.replaceHTML("<style>"+style_file_contents+"</style")
	return parsed.remakeHTML()

# Now actually compile the CHM source to HTML...

if len(sys.argv) >= 2:
	os.chdir(sys.argv[1])

if (not isFileCaseInsensitive("index.hhk") or not isFileCaseInsensitive("table of contents.hhc")):
	print("error! no index.hhk/table of contents.hhc")
	sys.exit()

make_index( readFileCaseInsensitive("index.hhk") )
make_toc( readFileCaseInsensitive("table of contents.hhc") )

for path in toc_paths:
	replaced = replace_styles( readFileCaseInsensitive(path), path.split("/")[:-1] )
	escaped = escapeStringForJS(replaced)
	toc_html.append(escaped)
	
# put it all together with the file:

# "$index_names$" "$index_links$" "$toc_paths$" "$toc_html$"
CHM_TEMPLATE = "<!-- Created with CHM-HTML https://github.com/krogank9/chm-html -->\r\n<html>\r\n<head>\r\n<title>\"$chm_title$\"</title>\r\n\r\n<style>\r\n    html, #body1 { margin: 0 !important; padding: 0 !important; border: 0 !important; overflow: hidden !important;}\r\n    \r\n    #body1 {\r\n        display: inline-flex !important;\r\n        flex-direction: row !important;\r\n        width: 100% !important;\r\n        height: 100% !important;\r\n    }\r\n\t\r\n    #navigation_window {\r\n\t\tbackground-color: #eae9d7;\r\n\t\theight: 100%;\r\n\t\twidth: 210px;\r\n\t\toverflow: auto;\r\n\t\tmargin: 0;\r\n\t\tpadding: 0;\r\n\t\tborder: 0;\r\n\t\tpadding-right: 6px;\r\n\t\tdisplay: flex;\r\n\t\tflex-direction: column;\r\n\t}\r\n\t\r\n\t#navigation_window * {\r\n\t\tfont-family: sans-serif !important;\r\n\t\tfont-size: 14 !important;\r\n\t\toverflow-x: hidden\r\n\t}\r\n\t\r\n    #contents_window {\r\n\t\tbackground-color: #fff;\r\n        flex: 1;\r\n        display: flex;\r\n        flex-direction: column;\r\n        margin: 0;\r\n        padding: 0;\r\n        overflow:hidden;\r\n        border: none;\r\n    }\r\n    \r\n\t.noselect {\r\n\t\t-webkit-touch-callout: none; /* iOS Safari */\r\n\t\t-webkit-user-select: none; /* Safari */\r\n\t\t-khtml-user-select: none; /* Konqueror HTML */\r\n\t\t-moz-user-select: none; /* Firefox */\r\n\t\t-ms-user-select: none; /* Internet Explorer/Edge */\r\n\t\tuser-select: none; /* Non-prefixed version, currently supported by Chrome and Opera */\r\n\t}\r\n</style>\r\n\r\n<style>\r\n/* Style tabs */\r\n.tab {\r\n\tbackground-color: transparent;\r\n    margin-top: 8px;\r\n    position: relative;\r\n}\r\n\r\n.tab button {\r\n    background: linear-gradient(to bottom, #ebebe5, #fff);\r\n    float: left;\r\n    border: none;\r\n    outline: none;\r\n    cursor: pointer;\r\n    padding: 6px;\r\n    padding-left: 7px;\r\n    padding-right: 7px;\r\n\r\n\tborder-radius: 4px;\r\n\tborder-bottom-left-radius:0px;\r\n\tborder-bottom-right-radius:0px;\r\n\tborder: 1px solid #9da1a5;\r\n\t\r\n\tmargin-left:1px;\r\n\tmargin-top:2px;\r\n}\r\n\r\n.tab button.active {\r\n\tbackground: #fcfcfe;\r\n\tborder-bottom: 0px;\r\n\tmargin-top:1px;\r\n\tborder-top: 3px solid #f7ca3d;\r\n\tbox-shadow: 0 -1px 0 #de8a33;\r\n\tmargin-right: -1px;\r\n\tmargin-left: 0px;\r\n\tpadding-left: 9px;\r\n}\r\n\r\n.tab button.active span {\r\n\tposition: relative;\r\n\tleft: -1px;\r\n}\r\n\r\n.tabcontent {\r\n    display: none;\r\n    padding: 2px;\r\n    flex: 1;\r\n    overflow: auto;\r\n}\r\n\r\n/* checkbox style */\r\n.css-treeview * {\r\n\toverflow: hidden;\r\n}\r\n\r\n.css-treeview input[type=checkbox] {\r\n\tdisplay: none\r\n}\r\n\r\n.css-treeview input[type=checkbox] + label\r\n{\r\n\tbackground-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAQCAYAAAB3AH1ZAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gQBEQYDCNPu9wAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAABEUlEQVRIx7WV3a2CQBCFzxiagsiDlGBiBZbhXh/ItGEFJpbAi0bKOj7gkIXLwkqWIYQlWTjf/K6QxFYmIgQAkhLak20prND+PQQhKSMwFvbNwU1GIgnAnPAShJDE435bpDiezhISfz/faMomCnYMkXkCwY8e99vsT5uyQfWsoiAUOqiJXcCrn9NgEDFmEEGAtfYLhKVvN/bcvPfXKSHc99JaQXIYAZKwrvDXc0ZSHNwixFg46SAiKSJCvw0NoiiLLu+1ojpUyPc52lcLd3VwVzddA2tmw1QkirLoPfbFDYqkZLGttjYSl78L2leLfJ/3NTUYRpbrlDcAKpQAqHX37KT+75WtTkPr86XTULY8jmPsA9GO+xDjEIy2AAAAAElFTkSuQmCC');\r\n\tbackground-repeat: no-repeat;\r\n\tdisplay:inline-block;\r\n\theight: 16px;\r\n\tpadding: 1px 0 2px 38px;\r\n\tmargin: 2px;\r\n}\r\n\r\n.css-treeview input[type=checkbox]:checked + label\r\n{\r\n\tbackground-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAQCAYAAAB3AH1ZAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gQBEQYMmGzzZgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAA60lEQVRIx82Uy23DMBBE3wZuioAvVgsBUoG7MOODtOwiacCGUwJ1MKC2Ngc6ihR9YsO0kgF44A/zOFwSMkpLNf5KWqo158ZuhVhl8jf24My1MH7vZSqd7twqdxJu7Yh1HBjvXncAhCoMEzgd3n6N7fllK9dCFJtiYJwkgKbEvgcSwJyuADRFe3sAa87NV68d1zKtU9QAe1qmRPsH7mohAPkBMgEgIoO2aAKXy+q1RRO4V0HCbAKhChSb4iEA4vGTEKEKrblbu/Gf8OP4ngPCNL1zAGIdiXUcNWayKjJUXBdiTh7/EIDxavuv+gQRUKMDzp2o2QAAAABJRU5ErkJggg==');\r\n\tbackground-repeat: no-repeat;\r\n\tdisplay:inline-block;\r\n\theight: 16px;\r\n\tpadding: 1px 0 2px 38px;\r\n\tmargin: 2px;\r\n}\r\n\r\n.css-treeview input[type=checkbox].not_folder + label\r\n{\r\n\tbackground-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAQCAYAAAB3AH1ZAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gQBEQUsiC+AbQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAArElEQVRIx82VwQqDMBBE3xT/Wnpp9css8bOmFzVJo/Ti2g4MS0DczdtBZZszNT7Hry/s7722g+1TPTwGHwunKXl5BtvcCJMWU1SvBDKpawnYyxSbQwlIVC4vnKYEELkCY1O5Xg/RA7QEJKosAHRxATS2qmZ76qLwA0ht88/PTuAKwNZBDsIzoI3AjzLgXdxrNi5agRrcubliCcyvGUhAWUulPObZf0PtRf+f9QZT5gTfgDcxzAAAAABJRU5ErkJggg==');\r\n\tbackground-repeat: no-repeat;\r\n\tdisplay:inline-block;\r\n\theight: 16px;\r\n\tpadding: 1px 0px 2px 38px;\r\n\tmargin: 2px;\r\n}\r\n\r\n/* collapse code: */\r\n\r\n.css-treeview ul\r\n{\r\n\tpadding: 0;\r\n\tmargin-top: 0;\r\n\tlist-style-type: none;\r\n}\r\n\r\n.css-treeview input + label + ul\r\n{\r\n    margin: 0 0 0 22px;\r\n}\r\n \r\n.css-treeview input ~ ul\r\n{\r\n    display: none;\r\n}\r\n \r\n.css-treeview input:checked:not(:disabled) ~ ul\r\n{\r\n    display: block;\r\n}\r\n\r\n#contents_window div {\r\n\tpadding: 8px;\r\n\tmargin: 0;\r\n\tflex: 1;\r\n\toverflow: auto;\r\n}\r\n\r\n.fade_sides_div:after {\r\n  z-index  : 1;\r\n  background-image : linear-gradient(to left, \r\n                    rgba(255,255,255, 0), \r\n                    rgba(255,255,255, 1) 90%);\r\n  width    : 100%;\r\n  height   : 4em;\r\n}\r\n</style>\r\n\r\n</head>\r\n\r\n<body id=\"body1\" style=\"display: flex; flex-direction: row;\">\r\n\r\n<div id=\"navigation_window\" class=\"noselect\">\r\n\t<div class=\"tab\">\r\n\t\t<button id=\"defaultopen\" class=\"tablinks active\" onclick=\"openTab(event, 'tab_contents')\"><span class=\"tab_txt\">Contents</span></button>\r\n\t\t<button class=\"tablinks\" onclick=\"openTab(event, 'tab_index')\"><span class=\"tab_txt\">Index</span></button>\r\n\t\t<button class=\"tablinks\" onclick=\"openTab(event, 'tab_search')\"><span class=\"tab_txt\">Search</span></button>\r\n\t</div>\r\n\t<div style=\"border: 1px solid #9da1a5; margin-top: -1px; flex: 1; display: flex; flex-direction: column; background-color: #fff;\">\r\n\t\t<div style=\"margin: 7px; flex: 1; display: flex; flex-direction: column; background-color: #fff; border: 1px solid #819bbc; overflow: auto;\">\r\n\t\t\t<div id=\"tab_contents\" class=\"tabcontent\">\r\n\t\t\t\t<div class=\"css-treeview\" id=\"tstlist\">\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t\t<div id=\"tab_index\" class=\"tabcontent\">\r\n\t\t\t\t<input type=\"text\" style=\"width: 100%; padding: 5px;\" id=\"index_filter_text\" placeholder=\"Filter...\"></input>\r\n\t\t\t\t<table id=\"index_table\" style=\"width: inherit; border-spacing: 0px;\">\r\n\t\t\t\t</table>\r\n\t\t\t</div>\r\n\t\t\t<div id=\"tab_search\" class=\"tabcontent\">\r\n\t\t\t\t<input type=\"text\" style=\"width: 100%; padding: 5px;\" id=\"search_text\" placeholder=\"Search...\"></input>\r\n\t\t\t\t<table id=\"search_table\" style=\"width: inherit; border-spacing: 0px;\">\r\n\t\t\t\t</table>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t</div>\r\n</div>\r\n\r\n<div id=\"contents_window\" style=\"padding: 0; margin: 0; flex: 1;\">\r\n</div>\r\n\r\n\r\n<script>\r\nvar index_names = \"$index_names$\";\r\nvar index_links = \"$index_links$\";\r\nfunction my_sort(arr, twin) {\r\n\tfor(var i=0; i<arr.length; i++) {\r\n\t\tfor(var j=i+1; j<arr.length; j++) {\r\n\t\t\tif(arr[i].toLowerCase() > arr[j].toLowerCase()) {\r\n\t\t\t\tvar tmp = arr[i];\r\n\t\t\t\tarr[i] = arr[j];\r\n\t\t\t\tarr[j] = tmp;\r\n\t\t\t\ttmp = twin[i];\r\n\t\t\t\ttwin[i] = twin[j];\r\n\t\t\t\ttwin[j] = tmp;\r\n\t\t\t}\r\n\t\t}\r\n\t}\r\n}\r\nmy_sort(index_names, index_links);\r\n\r\nvar toc_paths = \"$toc_paths$\".map(function(p){return p.toLowerCase()});\r\nvar toc_html = \"$toc_html$\";\r\nvar toc_divs = [];\r\n\r\nfunction setup_divs() {\r\n\ttoc_divs = toc_html.map(function(h,i){\r\n\t\tvar div = document.createElement(\"div\");\r\n\t\tdiv.innerHTML = h;\r\n\t\tdiv.style.display = \"none\";\r\n\t\tcontents_window.appendChild(div);\r\n\t\treturn replaceAllLinks(div, toc_paths[i].split(\"/\"));\r\n\t});\r\n}\r\n\r\nvar list_src = \"$toc_arr$\";\r\n\r\nfunction makeLowerCase(str) {\r\n\tif(str && str.length > 0)\r\n\t\treturn str.toLowerCase();\r\n\treturn str;\r\n}\r\n\r\n// Recursively iterate list src and generate\r\nvar tmplid = 0;\r\nconst dom_parser = new DOMParser();\r\nvar first_page = null;\r\nvar contents_window = document.getElementById(\"contents_window\");\r\nvar allContentSpans = [];\r\nvar gendList;\r\nfunction generateList(src)\r\n{\r\n\tvar ul = document.createElement(\"ul\");\r\n\tfor(var i=0; i<src.length; i++)\r\n\t{\r\n\t\tvar isFolder = src[i].length > 2;\r\n\t\tvar li = document.createElement(\"li\");\r\n\t\tul.appendChild(li);\r\n\r\n\t\tvar chk = document.createElement(\"input\");\r\n\t\tchk.type = \"checkbox\"\r\n\t\tchk.id = \"gen_list_item-\"+(tmplid++);\r\n\t\tif(!isFolder)\r\n\t\t\tchk.className += \" not_folder\";\r\n\t\tchk.isFolder = isFolder;\r\n\t\tli.appendChild(chk);\r\n\t\tif(first_page == null)\r\n\t\t\tfirst_page = chk;\r\n\r\n\t\tvar label = document.createElement(\"label\");\r\n\t\tlabel.htmlFor = chk.id;\r\n\t\tchk.myLabel = label;\r\n\t\tli.appendChild(label);\r\n\t\t\r\n\t\tvar span = document.createElement(\"span\");\r\n\t\tspan.innerHTML = src[i][0];\r\n\t\tlabel.appendChild(span);\r\n\t\tchk.mySpan = span;\r\n\t\tallContentSpans.push(span);\r\n\t\t\r\n\t\tchk.myPath = src[i][1];\r\n\t\t\r\n\t\tchk.highlight_select = function() {\r\n\t\t\tallContentSpans.forEach(function(s){s.style.backgroundColor=\"\";s.style.color=\"\"; s.style.border=\"\";s.isHighlighted = false;});\r\n\t\t\tthis.mySpan.isHighlighted = true;\r\n\t\t\tthis.mySpan.style.backgroundColor = \"#5790ff\";\r\n\t\t\tthis.mySpan.style.color = \"white\";\r\n\t\t\tthis.mySpan.style.border = \"1px dotted black\";\r\n\t\t}\r\n\t\tchk.onclick = function(evt) {\r\n\t\t\tif(this.myPath.length > 0 && !this.mySpan.isHighlighted) {\r\n\t\t\t\tjustManuallyChangedHash = true;\r\n\t\t\t\tconsole.log(\"setting page \"+this.myPath);\r\n\t\t\t\tset_page(this.myPath);\r\n\t\t\t}\r\n\t\t\tthis.highlight_select();\r\n\t\t\t\r\n\t\t\tif(isFolder) {\r\n\t\t\t\treturn true;\r\n\t\t\t}\r\n\t\t\tevent.preventDefault();\r\n\t\t}\r\n\t\t\r\n\t\t// use li to check the checkbox incase you hit the space inbetween 2 check labels\r\n\t\tli.myChk = chk;\r\n\t\tli.onclick = function(evt) {\r\n\t\t\tif(this.myUL && this.myUL.contains(evt.target))\r\n\t\t\t\treturn true; //let child li handle\r\n\t\t\telse if(this.myChk.contains(evt.target)){\r\n\t\t\t\treturn true; // let checkbox handle\r\n\t\t\t} else {\r\n\t\t\t\tthis.myChk.click();\r\n\t\t\t\treturn false; // handled, stop\r\n\t\t\t}\r\n\t\t}\r\n\t\t\r\n\t\tif(isFolder) {\r\n\t\t\tvar my_ul = generateList( src[i].slice(2) );\r\n\t\t\tli.appendChild(my_ul);\r\n\t\t\tli.myUL = my_ul;\r\n\t\t}\r\n\t}\r\n\treturn ul;\r\n}\r\n\r\nfunction cmpArr(a1, a2) {\r\n\tif(!Array.isArray(a1) || !Array.isArray(a2) || a1.length != a2.length)\r\n\t\treturn;\r\n\tfor(var i=0; i<a1.length; i++) {\r\n\t\tif(a1[i] != a2[i])\r\n\t\t\treturn false;\r\n\t}\r\n\treturn true;\r\n}\r\n\r\nfunction expandAndSelectFile(hash_path, _checkbox_list, _element) {\r\n\tif(!Array.isArray(_checkbox_list))\r\n\t\t_checkbox_list = [];\r\n\tif(!_element)\r\n\t\t_element = gendList;\r\n\t\t\r\n\t// traverse dom tree for checkboxes\r\n\tvar last_checkbox = null;\r\n\tvar children = Array.prototype.slice.call(_element.childNodes);\r\n\tfor(var i=0; i<children.length; i++) {\r\n\t\tvar child = children[i];\r\n\t\tif(child.tagName == \"LI\" || child.tagName == \"UL\") {\r\n\t\t\tif(last_checkbox != null && expandAndSelectFile(hash_path, _checkbox_list.concat([last_checkbox]), child)) {\r\n\t\t\t\treturn true;\r\n\t\t\t} else if(expandAndSelectFile(hash_path, _checkbox_list, child)) {\r\n\t\t\t\treturn true;\r\n\t\t\t}\r\n\t\t}\r\n\t\telse if(child.tagName == \"INPUT\" && child.type == \"checkbox\") {\r\n\t\t\tlast_checkbox = child;\r\n\t\t\tif( !child.isFolder && child.myPath.toLowerCase() == hash_path.toLowerCase() ) {\r\n\t\t\t\t// expand each folder and click the file\r\n\t\t\t\t_checkbox_list.forEach(function(c){c.checked = true;})\r\n\t\t\t\tchild.highlight_select();\r\n\t\t\t\treturn true;\r\n\t\t\t}\r\n\t\t}\r\n\t}\r\n\treturn false;\r\n}\r\n\r\nfunction scrollElemToAnchor(elem, anchor_name) {\r\n\tvar all = document.getElementsByName(anchor_name);\r\n\tvar in_elem = Array.from(all).filter(function(e) {return elem.contains(e)});\r\n\tif(in_elem.length > 0) {\r\n\t\tvar anchor_elem = in_elem[0];\r\n\t\tanchor_elem.scrollIntoView();\r\n\t}\r\n}\r\n\r\nfunction isWWWLink(value) {\r\n  return /^(?:(?:(?:https?|ftp):)?\\/\\/)(?:\\S+(?::\\S*)?@)?(?:(?!(?:10|127)(?:\\.\\d{1,3}){3})(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))(?::\\d{2,5})?(?:[/?#]\\S*)?$/i.test(value);\r\n}\r\n\r\nfunction getCenter(quotedSpacedStr) {\r\n\tstr = quotedSpacedStr.trim();\r\n\tif((str.charAt(0) == '\"' || str.charAt(0) == \"'\") && str.length >= 2) {\r\n\t\treturn str.slice(1,str.length-1);\r\n\t}\r\n\treturn str;\r\n}\r\n\r\nvar scrollIds = {};\r\nvar curScrollId = 0;\r\nvar curDiv = null;\r\nwindow.addEventListener('scroll', function(evt) {\r\n\tif(curDiv)\r\n\t\tscrollIds[curScrollId] = curDiv.scrollTop;\r\n}, true);\r\n\r\nfunction replaceAllLinks(div, path) {\r\n\t//move style & script tags to base for search cache\r\n\tremove_html_body_style_script(div);\r\n\tdiv.tabIndex = -1;\r\n\tdiv.style.outline = \"none\";\r\n\tvar links = Array.from(div.getElementsByTagName(\"a\"));\r\n\tvar path_text = path.join(\"/\");\r\n\tfor(var i=0; i<links.length; i++) {\r\n\t\tvar l = links[i];\r\n\t\t//console.log(l.href);\r\n\t\tvar href = l.getAttribute(\"href\");\r\n\t\tif(!href || href.length <= 1) {\r\n\t\t\tthis.href = this.initHref = \"\";\r\n\t\t\tcontinue;\r\n\t\t}\r\n\t\telse if(isWWWLink(href)) {\r\n\t\t\tcontinue;\r\n\t\t}\r\n\t\telse if(href.charAt(0) == \"#\") { //link to cur page \r\n\t\t\tl.href = l.initHref = \"#\"+path_text + href;\r\n\t\t} else {\r\n\t\t\t//count ../'s and prefix with proper dir\r\n\t\t\tvar count = (href.match(/\\.\\.\\//g) || []).length;\r\n\t\t\tvar prefix = path.slice(0, Math.max(0, path.length - 1 - count)).join(\"/\");\r\n\t\t\tl.href = l.initHref = \"#\"+prefix + (prefix.length>0?\"/\":\"\") + href.replace(/\\.\\.\\//g, \"\");\r\n\t\t}\r\n\t\t\r\n\t\tl.onmouseup = l.onkeyup = function(evt) {\r\n\t\t\tthis.href = this.initHref + \"?id=\" + (curScrollId+1);\r\n\t\t\tvar tmp = scrollIds[curScrollId+1];\r\n\t\t\tdelete scrollIds[curScrollId+1];\r\n\t\t\tsaveScrollInfo();\r\n\t\t\tvar linkOpenedInNewTab = evt && (evt.button == 2 || evt.ctrlKey);\r\n\t\t\tif(linkOpenedInNewTab)\r\n\t\t\t\tscrollIds[curScrollId+1] = tmp;\r\n\t\t}\r\n\t}\r\n\treturn div;\r\n}\r\n\r\nfunction remove_html_body_style_script(div) {\r\n\tvar style_script = Array.from(div.getElementsByTagName(\"style\")).concat(Array.from(div.getElementsByTagName(\"script\")));\r\n\tvar to_remove = Array.from(div.getElementsByTagName(\"title\"));\r\n\tto_remove.forEach(function(e){e.remove();});\r\n\tvar dummy_script = document.createElement(\"script\");\r\n\t// marker for search functions\r\n\tdummy_script.innerHTML = \"/*htmlCHM END OF STYLE AND SCRIPTS htmlCHM*/                               \";\r\n\tif(div.firstChild)\r\n\t\tdiv.insertBefore(dummy_script, div.firstChild);\r\n\telse\r\n\t\tdiv.appendChild(dummy_script);\r\n\t// move styles to beginning\r\n\tfor(var i=0; i<style_script.length; i++) {\r\n\t\tstyle_script[i].remove();\r\n\t\tdiv.insertBefore(style_script[i], dummy_script);\r\n\t}\r\n\tvar body_elems = Array.from(div.getElementsByTagName(\"body\"));\r\n\tdiv.innerHTML = body_elems.length == 0?div.innerHTML:body_elems[0].innerHTML;\r\n}\r\n\r\nfunction tryGetFilePathFromFolder(folder_path) {\r\n\tvar match_paths = toc_paths.filter(function(path){return path.startsWith(folder_path)});\r\n\t\r\n\tmatch_paths = match_paths.filter(function(path){\r\n\t\treturn path.endsWith(\"index.html\") || path.endsWith(\"index.htm\")\r\n\t\t|| path.endsWith(\"default.html\") || path.endsWith(\"default.htm\")\r\n\t\t|| path.endsWith(\"home.html\") || path.endsWith(\"home.htm\")\r\n\t});\r\n\tif(match_paths.length >= 1)\r\n\t\treturn match_paths[0];\r\n\t\r\n\tif(match_paths.length == 0)\r\n\t\treturn folder_path;\r\n}\r\n\r\nfunction openFileAtPos(hash, noJump) {\r\n\thash = hash.slice(hash.charAt(0) == \"#\"? 1:0);\r\n\tvar hashInfo = getHashInfo(hash);\r\n\t// open given doc, inside given folder\r\n\tvar file_path = hashInfo.page.toLowerCase(); // all to lowercase since case doesn't matter in windows and normal CHM files\r\n\tif(toc_paths.indexOf(file_path) == -1)\r\n\t\tfile_path = tryGetFilePathFromFolder(file_path);\r\n\t\r\n\tvar path_index = toc_paths.indexOf(file_path);\r\n\tif(path_index > -1) {\r\n\t\tconsole.log(\"opening \"+file_path);\r\n\t\ttoc_divs.forEach((d)=>d.style.display = \"none\");\r\n\t\tcurDiv = toc_divs[path_index];\r\n\t\tcurDiv.style.display = \"\";\r\n\t\tif(!noJump)\r\n\t\t\tscrollElemToAnchor(curDiv, hashInfo.jumpto);\r\n\t\tcurDiv.focus();\r\n\t} else {\r\n\t\tconsole.log(file_path+\" does not exist\");\r\n\t}\r\n}\r\n\r\nfunction getHashInfo(hash) {\r\n\tvar full = hash;\r\n\tvar page = hash;\r\n\tvar jumpto = \"\";\r\n\tvar GET = \"\";\r\n\t\r\n\tif(hash.charAt(0) == \"#\")\r\n\t\tpage = hash.substring(1);\r\n\tif(page.indexOf(\"?\") > -1) {\r\n\t\tGET = page.substring(page.indexOf(\"?\")+1);\r\n\t\tpage = page.substring(0, page.indexOf(\"?\"));\r\n\t}\r\n\tif(page.indexOf(\"#\") > -1) {\r\n\t\tjumpto = page.substring(page.indexOf(\"#\")+1);\r\n\t\tpage = page.substring(0, page.indexOf(\"#\"));\r\n\t}\r\n\treturn {full:full, page:page, jumpto:jumpto, GET:GET};\r\n}\r\n\r\nvar lastClickTime = 0;\r\ndocument.addEventListener(\"click\", function(evnt){\r\n    lastClickTime = Date.now();\r\n});\r\n\r\nvar justManuallyChangedHash = false;\r\nwindow.onhashchange = function() {\r\n\tvar hashInfo = getHashInfo(location.hash);\r\n\tcurScrollId = parseInt(hashInfo.GET.slice(3))||0;\r\n\t\r\n\tif(!justManuallyChangedHash)\r\n\t\texpandAndSelectFile(hashInfo.page);\r\n\tjustManuallyChangedHash = false;\r\n\t\r\n\tif(location.hash.charAt(0) == \"#\") {\r\n\t\topenFileAtPos(location.hash.slice(1), scrollIds[curScrollId]);\r\n\t\tif(!curDiv)\r\n\t\t\treturn;\r\n\t\t// new GET scroll id exists, scroll to saved position\r\n\t\tif(curScrollId in scrollIds) {\r\n\t\t\tconsole.log(\"scroll id \"+ curScrollId +\" exists. scrolling to \"+scrollIds[curScrollId]);\r\n\t\t\tcurDiv.scrollTop = scrollIds[curScrollId];\r\n\t\t}\r\n\t\telse {\r\n\t\t\tscrollIds[curScrollId] = curDiv.scrollTop;\r\n\t\t\tif(!hashInfo.jumpto)\r\n\t\t\t\tcurDiv.scrollTop = 0;\r\n\t\t}\r\n\t}\r\n\t\r\n\tif(queue_select.length > 0) {\r\n\t\tconsole.log(queue_select)\r\n\t\tsetSelectionRange(queue_select[0], queue_select[1], queue_select[2]);\r\n\t\tqueue_select = [];\r\n\t}\r\n}\r\n\r\nfunction openTab(evt, tabName) {\r\n    var i, tabcontent, tablinks;\r\n\r\n    tabcontent = document.getElementsByClassName(\"tabcontent\");\r\n    for (i = 0; i < tabcontent.length; i++) {\r\n        tabcontent[i].style.display = \"none\";\r\n    }\r\n\r\n    tablinks = document.getElementsByClassName(\"tablinks\");\r\n    for (i = 0; i < tablinks.length; i++) {\r\n        tablinks[i].className = tablinks[i].className.replace(\" active\", \"\");\r\n    }\r\n\r\n    document.getElementById(tabName).style.display = \"block\";\r\n    evt.currentTarget.className += \" active\";\r\n}\r\ndocument.getElementById(\"defaultopen\").click();\r\n\r\nvar index_tab = document.getElementById(\"tab_index\");\r\nvar index_table = document.getElementById(\"index_table\");\r\nvar index_filter_text = document.getElementById(\"index_filter_text\");\r\nvar all_table_indexes = [];\r\nfunction populateIndex() {\r\n\tfor(var i=0; i<index_names.length; i++) {\r\n\t\tvar tr = document.createElement(\"tr\");\r\n\t\tvar td = document.createElement(\"td\");\r\n\t\ttd.style.padding = \"5px\";\r\n\t\ttd.innerHTML = index_names[i];\r\n\t\tall_table_indexes.push(td);\r\n\t\ttd.style.border = \"1px solid transparent\";\r\n\t\ttd.docLink = index_links[i];\r\n\t\t\r\n\t\ttd.onclick = function() {\r\n\t\t\tall_table_indexes.forEach(function(s){s.style.backgroundColor=\"\";s.style.color=\"\"; s.style.border=\"1px solid transparent\"});\r\n\t\t\tthis.style.backgroundColor = \"#5790ff\";\r\n\t\t\tthis.style.color = \"white\";\r\n\t\t\tthis.style.border = \"1px dotted black\";\r\n\t\t\tset_page(this.docLink)\r\n\t\t}\r\n\t\ttr.appendChild(td);\r\n\t\tindex_table.appendChild(tr);\r\n\t}\r\n}\r\nindex_filter_text.oninput = function() {\r\n\tvar trs = Array.from(index_table.getElementsByTagName(\"tr\"));\r\n\tvar val = this.value.toLowerCase();\r\n\tfor(var i=0; i<trs.length; i++) {\r\n\t\tif(trs[i].innerHTML.toLowerCase().indexOf(val) > -1)\r\n\t\t\ttrs[i].style.display = \"\";\r\n\t\telse\r\n\t\t\ttrs[i].style.display = \"none\";\r\n\t}\r\n}\r\nfunction getTextNodesIn(node) {\r\n    var textNodes = [];\r\n    if (node.nodeType == 3) {\r\n        textNodes.push(node);\r\n    } else {\r\n        var children = node.childNodes;\r\n        for (var i = 0, len = children.length; i < len; ++i) {\r\n            textNodes.push.apply(textNodes, getTextNodesIn(children[i]));\r\n        }\r\n    }\r\n    //console.log(textNodes)\r\n    return textNodes;\r\n}\r\n\r\nfunction set_page(path) {\r\n\tlocation.hash = \"#\" + path + \"?id=\" + (curScrollId+1);\r\n\tdelete scrollIds[curScrollId+1];\r\n}\r\n\r\nfunction getLastElementBeforePos(pos, parent) {\r\n\tvar text_nodes = getTextNodesIn(parent);\r\n\tvar text_len = 0;\r\n\tvar last_node = text_nodes[i];\r\n\tfor(var i=0; i<text_nodes.length; i++) {\r\n\t\tvar node = text_nodes[i];\r\n\t\tif(node.data.length + text_len < pos) {\r\n\t\t\ttext_len += node.data.length\r\n\t\t\tlast_node = node;\r\n\t\t}\r\n\t\telse {\r\n\t\t\treturn last_node.parentNode;\r\n\t\t}\r\n\t}\r\n}\r\n\r\nvar queue_select = [];\r\nfunction setSelectionRange(el, start, end) {\r\n    if (document.createRange && window.getSelection) {\r\n        var range = document.createRange();\r\n        range.selectNodeContents(el);\r\n        var textNodes = getTextNodesIn(el);\r\n        var foundStart = false;\r\n        var charCount = 0, endCharCount;\r\n\r\n        for (var i = 0, textNode; textNode = textNodes[i++]; ) {\r\n            endCharCount = charCount + textNode.length;\r\n            if (!foundStart && start >= charCount\r\n                    && (start < endCharCount ||\r\n                    (start == endCharCount && i <= textNodes.length))) {\r\n                range.setStart(textNode, start - charCount);\r\n                foundStart = true;\r\n            }\r\n            if (foundStart && end <= endCharCount) {\r\n                range.setEnd(textNode, end - charCount);\r\n                break;\r\n            }\r\n            charCount = endCharCount;\r\n        }\r\n\r\n        var sel = window.getSelection();\r\n        sel.removeAllRanges();\r\n        sel.addRange(range);\r\n    } else if (document.selection && document.body.createTextRange) {\r\n        var textRange = document.body.createTextRange();\r\n        textRange.moveToElementText(el);\r\n        textRange.collapse(true);\r\n        textRange.moveEnd(\"character\", end);\r\n        textRange.moveStart(\"character\", start);\r\n        textRange.select();\r\n    }\r\n    // also scroll text into view\r\n    var elementAbove = getLastElementBeforePos(start, el)\r\n    if(elementAbove) {\r\n\t\tcurDiv.scrollTop = elementAbove.offsetTop;\r\n\t}\r\n}\r\nvar search_text = document.getElementById(\"search_text\");\r\nvar search_table = document.getElementById(\"search_table\");\r\nvar all_search_tds = [];\r\nfunction add_search_result(path, div, text_start, text_end, pre, mid, post) {\r\n\t//setSelectionRange(div, text_start, text_end);\r\n\tvar tr = document.createElement(\"tr\");\r\n\tvar td = document.createElement(\"td\");\r\n\ttd.style.padding = \"5px\";\r\n\ttd.style.border = \"1px solid transparent\";\r\n\ttd.style.backgroundColor = \"transparent\";\r\n\tvar text_div = document.createElement(\"div\");\r\n\tvar path_div = document.createElement(\"div\");\r\n\ttext_div.style.textAlign = \"center\";\r\n\ttext_div.style.marginLeft = \"-100%\";\r\n\ttext_div.style.marginRight = \"-100%\";\r\n\t//text_div.style.width = \"100%\"\r\n\ttext_div.style.overflow = \"hidden\";\r\n\ttext_div.style.backgroundColor = \"transparent\";\r\n\tpath_div.style.overflow = \"hidden\";\r\n\tpath_div.style.color = \"#bbb\";\r\n\tpath_div.style.backgroundColor = \"transparent\";\r\n\ttext_div.innerHTML = pre+\"<span style='background-color: #b0befc;'>\"+mid+\"</span>\"+post;\r\n\t//text_div.className += \"fade_sides_div\";\r\n\tpath_div.innerHTML = path;\r\n\ttr.appendChild(td);\r\n\ttd.appendChild(text_div);\r\n\ttd.appendChild(path_div);\r\n\ttd.path = path;\r\n\ttd.div = div;\r\n\ttd.text_start = text_start;\r\n\ttd.text_end = text_end;\r\n\ttd.onclick = function() {\r\n\t\tall_search_tds.forEach(function(s){s.style.backgroundColor=\"\";s.style.color=\"\"; s.style.border=\"1px solid transparent\"});\r\n\t\tthis.style.backgroundColor = \"#5790ff\";\r\n\t\tthis.style.color = \"white\";\r\n\t\tthis.style.border = \"1px dotted black\";\r\n\t\tqueue_select = [this.div, this.text_start, this.text_end];\r\n\t\tset_page(this.path);\r\n\t}\r\n\tall_search_tds.push(td);\r\n\tsearch_table.appendChild(tr);\r\n}\r\n\r\nsearch_text.oninput = function() {\r\n\tsearch_table.innerHTML = \"\";\r\n\tif(this.value.trim()) {\r\n\t\tvar search_text_value = this.value.toLowerCase();\r\n\t\tall_search_tds = [];\r\n\t\tfor(var i=0; i<toc_paths.length; i++) {\r\n\t\t\tvar path = toc_paths[i];\r\n\t\t\tvar div = toc_divs[i];\r\n\t\t\tvar text_start = -1;\r\n\t\t\tvar text_end = -1;\r\n\t\t\tvar pre = \"\";\r\n\t\t\tvar post = \"\";\r\n\t\t\tif(div.textContent) {\r\n\t\t\t\ttext_start = div.textContent.toLowerCase().indexOf(search_text_value, div.textContent.indexOf(\"/*htmlCHM END OF STYLE AND SCRIPTS htmlCHM*/\")+\"/*htmlCHM END OF STYLE AND SCRIPTS htmlCHM*/\".length);\r\n\t\t\t\ttext_end = text_start+search_text_value.length;\r\n\t\t\t}\r\n\t\t\tif(text_start > -1) {\r\n\t\t\t\tpre = div.textContent.substring(text_start-15, text_start);\r\n\t\t\t\tvar mid = div.textContent.substring(text_start, text_end);\r\n\t\t\t\tpost = div.textContent.substring(text_end, text_end+20);\r\n\t\t\t\tadd_search_result(path, div, text_start, text_end, pre, mid, post);\r\n\t\t\t}\r\n\t\t}\r\n\t}\r\n}\r\n\r\nfunction bake_cookie(name, value) {\r\n\tvar cookie = [name, '=', JSON.stringify(value), '; domain=.', window.location.host.toString(), '; path=/;'].join('');\r\n\tdocument.cookie = cookie;\r\n}\r\n\r\nwindow.getCookie = function(name) {\r\n\tmatch = document.cookie.match(new RegExp(name + '=([^;]+)'));\r\n\tif (match) return match[1];\r\n}\r\n\r\n//save scrolls between refresh\r\nwindow.onbeforeunload = function(){saveScrollInfo()}\r\n\r\nfunction saveScrollInfo() {\r\n\tlocalStorage.setItem(\"scroll_info\", JSON.stringify({\r\n\t\tcurScrollId:curScrollId,\r\n\t\tscrollIds:scrollIds\r\n\t}));\r\n}\r\n\r\nwindow.onload = function() {\r\n\tvar scroll_info = localStorage.getItem(\"scroll_info\");\r\n\tif(scroll_info) {\r\n\t\tscroll_info = JSON.parse(scroll_info);\r\n\t\tcurScrollId = scroll_info.curScrollId;\r\n\t\tscrollIds = scroll_info.scrollIds;\r\n\t}\r\n\tdocument.getElementById(\"tstlist\").appendChild( gendList = generateList(list_src) );\r\n\tsetup_divs();\r\n\tpopulateIndex();\r\n\tif(location.hash.length == 0) {\r\n\t\tlocation.hash = \"#index.html\";\r\n\t}\r\n\telse {\r\n\t\twindow.onhashchange();\r\n\t}\r\n}\r\n</script>\r\n</body>\r\n</html>\r\n"

chm_title = ""
if isFileCaseInsensitive("*.hhp"):
	for line in readFileCaseInsensitive("*.hhp").split("\n"):
		assign = line.split("=")
		if len(assign) == 2 and assign[0].strip() == "Title":
			chm_title = assign[1].strip()
if not chm_title:
	chm_title = raw_input("No hhp file found. Choose CHM title for display:\n")
	
replace_vars = [chm_title, str_arr(index_names), str_arr(index_links), str_arr(toc_paths), str_arr(toc_html), str_arr(toc_arr)]
replace_words = ['"$chm_title$"', '"$index_names$"', '"$index_links$"', '"$toc_paths$"', '"$toc_html$"', '"$toc_arr$"']

for var, word in zip(replace_vars, replace_words):
	replacing = word
	pre_len = len(CHM_TEMPLATE)
	pre_find = CHM_TEMPLATE.find(replacing) + len(replacing)
	CHM_TEMPLATE = replaceAfterIndex(CHM_TEMPLATE, replacing, str(var), 0)
	next_index = pre_find + (len(CHM_TEMPLATE) - pre_len)

codecs.open("gen_chm.html", "w", "utf-8-sig").write(CHM_TEMPLATE)

#todo support unicode and audit escapeStringForJS
