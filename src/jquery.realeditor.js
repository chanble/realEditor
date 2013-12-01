/*
 * jquery.realeditor.js
 * @author:chen
 * @date: 2013-10-11
 * @version:0.0.1
 */

(function ($){
	$.fn.realeditor = function (opts){
		$.each(this, function (i, v){
			new RealEditor(i,v,opts);
		});
	};

	var keyMap = {9:'Tab', 13:'Enter', 16 : 'Shift', 17 : 'Ctrl', 18 : 'Alt', 27 : 'Esc'
			, 66 : 'B', 98: 'b', 73 : 'I', 105:'i', 85 : 'U', 117: 'u'};

	var RealEditor = function (i,el, o){
		if (typeof(o) != "object"){
			o = {};
		}

		//
		var userAgent=navigator.userAgent.toLowerCase();
		this.isFirefox=/firefox/.test(userAgent);
		this.isOpera=/opera/.test(userAgent);
		this.isSafari=/webkit/.test(userAgent);
		this.isIE=/msie/.test(userAgent)&&!/opera/.test(userAgent);

		//添加工具栏的工具
		//If you want add tool to tool bar. You must be do three steps:
		//1,Add tool bar element: add a k-v pair to this.tools object like tool-bold
		//2,Add element style: add style rltoolicon-XXX, XXX represent object.label
		//3,Add element events: add event callback function to RealEditor.toolsFun

		//This must be jquery event name
		this.tools = {
			bold : {key: 'bold', label:'粗体', event:{click:'click'}
					,shortcutKey : 'Ctrl+B'
				}
			,italic : {key: 'italic',label:'斜体',event:{click:'click'},shortcutKey : 'Ctrl+I'
				}
			,underline : {key: 'underline',label:'下划线',event:{click:'click'},shortcutKey : 'Ctrl+U'
				}
			,font : {key: 'font',label:'字体',event:{click:'click', mouseenter : 'mouseEnter',mouseleave : 'mouseLeave' }
				}
		};
		this.options = $.extend(false, RealEditor.DEFAULT_OPTS, o);
		this._init();
		if (typeof(el.jquery) == "undefined"){
			el = $(el);
		}
		this.setSkin();
		var toolsHtml = this.getToolsHtml(),
		iframeHtml = this.getIframeHtml(i),
		rlcontainerId = this.getContainerId(i),
		html = '<span class="rleditor_container" id="'
				+ rlcontainerId + '"><table cellspacing="0" cellpadding="0" style="display:inline-table;"><tbody><tr><td class="rleditor_tool">'
				+ toolsHtml +'</td></tr><tr><td class="rleditor_content">'
				+ iframeHtml +'</td></tr></tbody></table></span>';
		var iframeId = this.getIframId(i)
		,elWidth = el.width()
		,elHeight = el.height()
		,elContent = el.text();
		//var elOffset = el.offset();
		el.after(html);
		//隐藏文本框
		this._hide(el);
		var rlcontaioner = $("#"+rlcontainerId);
		this.mrl_contaioner = rlcontaioner;
		rlcontaioner.width(elWidth);
		$("td.rleditor_content", rlcontaioner).width(elWidth).height(elHeight);
		//rlcontaioner.offset(elOffset);//设置位置
		//init tools
		this.initTools();
		var rl_iframe = $('#'+iframeId);
		this.mrl_iframe = rl_iframe[0];
		this.mrl_window = this.mrl_iframe.contentWindow;
		this.mrl_document = this.mrl_window.document;
		this.initIframeContent(this.getIframeContentHtml());
		this.setEditable(true).appendText(elContent).setCaretPosition(elContent.length);
		this.bindKeyEvent();
	};
	RealEditor.options = {};
	RealEditor.DEFAULT_OPTS = {
		tools:'full'
		,skin:'default'
		,skinPath:'js/realeditor/skin'
		,sourceMode:false
		,width : 200
		,height:100
	};
	RealEditor.toolsFun = {
		bold:{
			click : function (el, e){
				this.execCommand('bold', false, null).focus();
			}
		}
		,italic:{click : function (el, e){
				this.execCommand('italic', false, null).focus();
			}
		}
		,underline:{click : function (el, e){
				this.execCommand('underline', false, null).focus();
			}
		}
		,font:{
			click : function (el, e){
				this.execCommand('FontName', false, 'Courier New').focus();
			}
			,mouseEnter: function (el, e){
//				var fontList = $('<ul><li><a style="font-family:\'Serif\'">Serif</a></li></ul>');
//				$(el).append(fontList);
			}
		}
	};
	RealEditor.prototype = {
		_hide : function (e){
			e.css('display', 'none');
			return this;
		}
		,_init : function (){
			this.toolTheme = {
				standard : ['bold','italic','underline','strikeout'
					,'image','unorderList','orderList','link','color'
					,'font','fontSize','alignLeft', 'alignCenter', 'alignRight']
				,mimi: ['bold','italic','underline','strikeout']
				,full:['bold','italic','underline','strikeout','font']
			};
			return this;
		}
		,getToolsHtml : function (){
			return '';
		}
		,appendToolsHtml : function (str){
			$('td.rleditor_tool', this.mrl_contaioner).append(str);
			return this;
		}
		,getIframeHtml : function (i){
			var realeditorId = this.getIframId(i);
			return '<iframe id="'+ realeditorId +'" scr="javascript:;"></iframe>';
		}
		,getIframeContentHtml : function (){
			var iframeHeaderHtml = this.getIframeHeaderHtml();
			return '<html><head>' + iframeHeaderHtml + '</head><body></body></html>';
		}
		,setEditable : function (b){
			if(this.isIE){
				this.mrl_body.contentEditable = b;
			}else{
				var design = b == true ? 'on' : 'off';
				this.mrl_document.designMode = design;
			}
			return this;
		}
		,getIframId :function (i){
			return 'realeditor' + i + '_iframe';
		}
		,focus : function (){
			this.mrl_window.focus();
			return this;
		}
		,execCommand : function (command, aShowDefaultUI, aValue){
			var aShowUI = !!aShowDefaultUI, state = false;
			if (aValue !== undefined){
				 state = this.mrl_document.execCommand(command, aShowUI, aValue);
			}else{
				state = this.mrl_document.execCommand(command, aShowUI, null);
			}
			return this;
		}
		,setSkin : function (){
			var skinPath = this.options.skinPath;
			var skin = this.options.skin;
			var skinLink = '<link id="rleditorCSS_'+ skin
				+'" rel="stylesheet" type="text/css" href="'
				+skinPath+'/'+ skin+'/common.css">';
			$('head').append(skinLink);
			return this;
		}
		,getIframeHeaderHtml :function (){
			var skinPath = this.options.skinPath;
			var skin = this.options.skin;
			return '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" /><link rel="stylesheet" href="'
						+skinPath+'/'+ skin+'/iframe.css"/>';
		}
		,initIframeContent : function (content){
			var doc = this.mrl_document;
			try{
				doc.open();
				doc.write(content);
				doc.close();
				this.mrl_body = doc.body;
			}catch(e){
				console.info(e);
			}
			return this;
		}
		,getContainerId : function (n){
			return 'realeditor'+n+'_container';
		}
		,getEditorContent: function (){
			return $(this.mrl_body).text();
		}
		,appendText : function(str){
			var newStr = this.convertHtml(str);
			return this.appendHtml(newStr);
		}
		// convert html mark to entity name
		// 转换thml标签为实体名字
		,convertHtml: function (str){
			var newStr = str.replace(/</g, '&lt;');
			newStr = newStr.replace(/>/g, '&gt;');
			newStr = newStr.replace(/\s/g, '&nbsp;');
			return newStr;
		}
		,appendHtml : function (str, start){
			this.focus();
			var sel = this.getSelection(), range = this.getRange();
			if (range.insertNode){
				var fragment  = range.createContextualFragment(str);
				range.insertNode(fragment);
			}else{//IE
				if(sel.type.toLowerCase()==='control'){
					sel.clear();
					range = this.getRange();
				}
				range.pasteHTML(str);
			}
			return this;
		}
		,getSelection : function (){
			var _win = this.mrl_window
			,_doc = this.mrl_document;
			var sel = _win.getSelection ? _win.getSelection()
						: (_doc.getSelection ? _doc.getSelection() : _doc.selection);
			return sel;
		}
		,getRange : function (bNew){
			var rng = null;
			try{
				if(!bNew){
					var sel = this.getSelection();
					rng = sel.createRange ? sel.createRange()
							: (sel.rangeCount > 0?sel.getRangeAt(0) : null);
				}
				if (!rng){
					rng = this.mrl_body.createTextRange ? this.mrl_body.createTextRange()
									:this.mrl_document.createRange();
				}
			}catch(e){
				console.warn(e);
			}
			return rng;
		}
		,initTools : function (){
			var tempTools = null;
			if (typeof this.options.tools == 'string'){
				tempTools = this.toolTheme[this.options.tools];
			}else{
				tempTools = this.options.tools;
			}
			for(var i in tempTools){
				var tempTool = this.tools[tempTools[i]];
				if (typeof tempTool == 'undefined'){
					continue;
				}else{
					this.appendTool(tempTool);
				}
			}
			return this;
		}
		,appendTool : function (ot){
			var key = ot.key;
			var label = !!ot.label ? ot.label : '';
			var shortcutKey = !!ot.shortcutKey ? ot.shortcutKey : 0;
			var shortcutKeyStr = !!shortcutKey ? '('+shortcutKey+')' : '';
			var toolStr = '<span><a class="rltoolbutton" id="rltoolabutton'
							+key+'" title="'+label + shortcutKeyStr
							+'"><span class="rltoolicon rltoolicon-'
							+key+'">'
							+key+'</span></a></span>';
			this.appendToolsHtml(toolStr);
			this.bindEvent(ot);
			return this;
		}
		//设置光标的位置
		//if it's not work,please call this.focus
		//just support <br> node.You can get node'th use childNodes[index]
		//目前该方法仅支持<br>元素
		,setCaretPosition : function(pos, node){
			var sel = this.getSelection(), range = this.getRange();
			if (!node){
				node = this.mrl_body;
			}
			if (document.selection) {
			  sel.moveStart('character', pos);
			  sel.select();
			}else {
				try{
					range.setStart(node, pos);
					range.collapse(true);
					sel.removeAllRanges();
					sel.addRange(range);
				}catch(e){
					//如果抛出异常
					if (e.code == DOMException.INDEX_SIZE_ERR){
						var newPos = pos > 1 ? 1 : 0;
						try{
							return this.setCaretPosition(newPos, node);
						}catch(e){
							console.warn(e);
						}
					}else{
						console.warn(e);
					}
				}
			}
			return this;
		}
		,bindEvent : function (obj){
			if (typeof(obj) == 'undefined'
					|| typeof (obj.event) == 'undefined'
					|| obj.event.length == 0){
				return ;
			}
			var _events = obj.event;
			var that = this;
			for (var e in _events){
				(function (_e){$("#rltoolabutton"+obj.key).bind(_e, function (event){
					RealEditor.toolsFun[obj.key][_events[_e]].call(that, this, event);
				})})(e);
			}
		}
		,bindKeyEvent : function (){
			var _this = this;
			$(this.mrl_document).keypress(function (e){
				(function (_e){
					for (var t in _this.tools){
					var tb = _this.tools[t].key;
					var ts = _this.tools[t].shortcutKey;
					if (_this.equalShortcut(_e, ts)){
						$("#rltoolabutton"+tb).trigger('click');
					}
					_e.preventDefault();
				}})(e);
			});
		}
		,equalShortcut : function (keyEvent, shortcutStr){
			var ctrl = !!keyEvent.ctrlKey, ctrlStr = 'ctrl'
			,alt = !!keyEvent.altKey, altStr = 'alt'
			,shift = !!keyEvent.shiftKey, shiftStr = 'shift'
			,kc = this.getKeyCode(keyEvent)
			,separator = '+';
			if (shortcutStr.indexOf(separator) >= 0){
				var scArray = shortcutStr.split(separator);
				var bCtrl = !(this.inArray(ctrlStr, scArray) ^ ctrl);
				var bAlt = !(this.inArray(altStr, scArray) ^ alt);
				var bShift = !(this.inArray(shiftStr, scArray) ^ shift);
				var bKey = this.inArray(keyMap[kc], scArray);
				return bCtrl && bAlt && bShift && bKey;
			}else{
				return false;
			}
		}
		, getKeyCode : function (keyEvent){
			return keyEvent.keyCode | keyEvent.charCode;
		}
		,inArray : function (s, a){
			for (var i in a){
				if (String(s).toLowerCase() == String(a[i]).toLowerCase()){
					return true;
				}
			}
			return false;
		}
	};
})(jQuery);
