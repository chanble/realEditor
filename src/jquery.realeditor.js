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
		that.options = $.extend(false, RealEditor.DEFAULT_OPTS, o);
		if (typeof(el.jquery) == "undefined"){
			el = $(el);
		}
		this.setSkin();
		var toolsHtml = this.getToolsHtml();
		var iframeHtml = this.getIframeHtml(i);
		var rlcontainerId = this.getContainerId(i);
		var html = '<span class="rleditor_container" id="'
				+ rlcontainerId + '"><table cellspacing="0" cellpadding="0"><tbody><tr><td class="rleditor_tool">'
				+ toolsHtml +'</td></tr><tr><td>'
				+ iframeHtml +'</td></tr></tbody></table></span>';
		var iframeId = this.getIframId(i);
		var elWidth = el.width();
		var elHeight = el.height();
		var elOffset = el.offset();
		el.after(html);
		//隐藏文本框
		this._hide(el);
		var rlcontaioner = $("#"+rlcontainerId);
		rlcontaioner.width(elWidth);
		rlcontaioner.offset(elOffset);//设置位置
		var rl_iframe = $('#'+iframeId);
		rl_iframe.width(elWidth);
		rl_iframe.height(elHeight);
		this.initIframeContent(rl_iframe, this.getIframeContentHtml());
		this.setEditable(rl_iframe, true);
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
	RealEditor.prototype = {
		_hide : function (e){
			e.css('display', 'none');
		}
		,getToolsHtml : function (){
			return '';
		}
		,getIframeHtml : function (i){
			var realeditorId = this.getIframId(i);
			return '<iframe id="'+ realeditorId +'"></iframe>';
		}
		,getIframeContentHtml : function (){
			var iframeHeaderHtml = this.getIframeHeaderHtml();
			return '<html><head>' + iframeHeaderHtml + '</head><body></body></html>';
		}
		,setEditable : function (iframe, b){
			var editorWin = iframe[0].contentWindow;
			var design = b == true ? 'on' : 'off';
			editorWin.document.designMode = design;
		}
		,setPos : function (left, top){

		}
		,getIframId :function (i){
			return 'realeditor' + i + '_iframe';
		}
		,setSkin : function (){
			var skinPath = this.options.skinPath;
			var skin = this.options.skin;
			var skinLink = '<link id="rleditorCSS_'+ skin
				+'" rel="stylesheet" type="text/css" href="'
				+skinPath+'/'+ skin+'/common.css">';
			$('head').append(skinLink);
		}
		,getIframeHeaderHtml :function (){
			var skinPath = this.options.skinPath;
			var skin = this.options.skin;
			return '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" /><link rel="stylesheet" href="'
						+skinPath+'/'+ skin+'/iframe.css"/>';
		}
		,initIframeContent : function (frame, content){
			try{
				var doc = frame[0].contentWindow.document;
				doc.open();
				doc.write(content);
				doc.close();
			}catch(e){

			}
		}
		,getContainerId : function (n){
			return 'realeditor'+n+'_container';
		}
	};
})(jQuery);
