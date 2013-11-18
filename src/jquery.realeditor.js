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
	var RealEditor = function (i,el, o){
		var that = this;
		if (typeof(o) != "object"){
			o = {};
		}
		//添加工具栏的工具
		//If you want add tool to tool bar. You must be do three steps:
		//1,Add tool bar element: add a k-v pair to this.tools object like tool-bold
		//2,Add element style: add style rltoolicon-XXX, XXX represent object.label
		//3,Add element events: add event callback function to RealEditor.toolsFun
		this.tools = {
			bold : {label:'bold',event:{mouseenter:'boldMouseOver'
									, click:'boldClick'
									,mouseleave:'boldMouseleave'}
				}
		};
		that.options = $.extend(false, RealEditor.DEFAULT_OPTS, o);
		this._init();
		if (typeof(el.jquery) == "undefined"){
			el = $(el);
		}
		that.setSkin();
		var toolsHtml = that.getToolsHtml(),
		iframeHtml = that.getIframeHtml(i),
		rlcontainerId = that.getContainerId(i),
		html = '<span class="rleditor_container" id="'
				+ rlcontainerId + '"><table cellspacing="0" cellpadding="0" style="display:inline-table;"><tbody><tr><td class="rleditor_tool">'
				+ toolsHtml +'</td></tr><tr><td>'
				+ iframeHtml +'</td></tr></tbody></table></span>';
		var iframeId = that.getIframId(i)
		,elWidth = el.width()
		,elHeight = el.height()
		,elContent = el.text();
		//var elOffset = el.offset();
		el.after(html);
		//隐藏文本框
		that._hide(el);
		var rlcontaioner = $("#"+rlcontainerId);
		that.mrl_contaioner = rlcontaioner;
		rlcontaioner.width(elWidth);
		//rlcontaioner.offset(elOffset);//设置位置
		//init tools
		that.initTools();
		var rl_iframe = $('#'+iframeId);
		that.mrl_iframe = rl_iframe;
		that.mrl_window = rl_iframe[0].contentWindow;
		that.mrl_document = rl_iframe[0].contentWindow.document;
		this.initIframeContent(this.getIframeContentHtml());
		this.setEditable(true);
		that.mrl_body = rl_iframe[0].contentWindow.document.body;
		rl_iframe.width(elWidth).height(elHeight);
		this.initEditorContent(elContent);
	};
	RealEditor.options = {};
	RealEditor.DEFAULT_OPTS = {
		tools:'standard'
		,skin:'default'
		,skinPath:'js/realeditor/skin'
		,sourceMode:false
		,width : 200
		,height:100
	};
	RealEditor.toolsFun = {
		bold:{
			boldMouseOver: function (el, e){
				//console.info(111);
			}
			,boldClick : function (el, e){
				this.execCommand('bold', false, null);
				this.focus();
			}
			,boldMouseleave : function (el, e){
				//alert('mouseleave');
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
				,full:['bold','italic','underline','strikeout']
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
			return '<iframe id="'+ realeditorId +'"></iframe>';
		}
		,getIframeContentHtml : function (){
			var iframeHeaderHtml = this.getIframeHeaderHtml();
			return '<html><head>' + iframeHeaderHtml + '</head><body id="mmid"></body></html>';
		}
		,setEditable : function (b){
			var design = b == true ? 'on' : 'off';
			this.mrl_document.designMode = design;
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
			return state;
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
			try{
				var doc = this.mrl_document;
				doc.open();
				doc.write(content);
				doc.close();
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
		,initEditorContent : function(str){
			var newStr = this.convertHtml(str);
			$(this.mrl_body).html(newStr);
			return this;
		}
		// convert html mark to entity name
		// 转换thml标签为实体名字
		,convertHtml: function (str){
			var newStr = str.replace(/</g, '&lt;');
			newStr = newStr.replace(/>/g, '&gt;');
			newStr = newStr.replace(/\s/g, '&nbsp;');
			return newStr;
		}
		,appendHtml : function (str){
			$(this.mrl_body).append(str);
			return this;
		}
		,getSelection : function (){
			var _win = this.mrl_window
			,_doc = this.mrl_document;

			var sel = _win.getSelection ? _win.getSelection()
						: (_doc.getSelection ? _doc.getSelection() : _doc.selection);
			return sel;
		}
		,getRange : function (){
			var rng = null;
			try{
				var sel = this.getSelection();
				rng = sel.createRange ? sel.createRange()
						: (sel.rangeCount > 0?sel.getRangeAt(0) : null);
			}catch(e){
				console.info(e);
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
			for(i in tempTools){
				var tempTool = this.tools[tempTools[i]];
				if (typeof tempTool == 'undefined'){
					break;
				}else{
					this.appendTool(tempTool);
				}
			}
			return this;
		}
		,appendTool : function (ot){
			var label = ot.label;
			var toolStr = '<span><a class="rltoolbutton" id="rltoolabutton'
							+label+'"><span class="rltoolicon rltoolicon-'
							+label+'">'
							+label+'</span></a></span>';
			this.appendToolsHtml(toolStr);
			this.bindEvent(ot);
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
			for (e in _events){
				(function (_e){$("#rltoolabutton"+obj.label).bind(_e, function (event){
					RealEditor.toolsFun[obj.label][_events[_e]].call(that, this, event);
				})})(e);
			}
		}
	};
})(jQuery);
