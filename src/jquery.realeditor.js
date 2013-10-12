/*
 * jquery.realeditor.js
 * @author:chen
 * @date: 2013-10-11
 * @version:0.0.1
 */

(function ($){
	$.fn.realeditor = function (opts){
		$.each(this, function (i, v){
			new RealEditor(v,opts);
		});
	};
	var RealEditor = function (el, o){
		var that = this;
		if (typeof(o) != "object"){
			o = {};
		}
		that.options = $.extend(false, RealEditor.DEFAULT_OPTS, o);
		if (typeof(el.jquery) == "undefined"){
			el = $(el);
		}
		$((el.contentWindow)[0].document.body).html('dksa');
	};
	RealEditor.options = {};
	RealEditor.DEFAULT_OPTS = {
		tools:'standard'
		,skin:'default'
		,sourceMode:false
		,width : 200
		,height:100
	};
})(jQuery);

