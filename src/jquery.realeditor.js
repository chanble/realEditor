/*
 * jquery.realeditor.js
 * @author:chen
 * @date: 2013-10-11
 * @version:0.0.1
 */

(function ($){
	$.fn.realeditor = function (opts){
		var rea = new Array();
		$.each(this, function (i, v){
			rea.push(new RealEditor(i,v,opts));
		});
		return rea.length === 1 ? rea.shift() : rea;
	};

	var ctlKeyMap = {9:"Tab",13:"Enter",16:"Shift",17:"Ctrl",18:"Alt",27:"Esc"}
	var charKeyMap = {65:"A",97:"a",66:"B",98:"b",73:"I",105:"i",85:"U",117:"u",16:"R",82:"r"};

	var RealEditor = function (i,el, o){
		if (typeof(o) != "object"){
			o = {};
		}
		this.srcElement = el;//源元素
		//
		var userAgent=navigator.userAgent.toLowerCase();
		this.isFirefox = /firefox/.test(userAgent);
		this.isOpera = /opera/.test(userAgent);
		this.isSafari = /webkit/.test(userAgent);
		this.isIE = /msie/.test(userAgent) && !this.isIE;
		this.browserVersion = (userAgent.match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/)||[0,"0"])[1];
		this.isIEle8 = this.isIE && (this.browserVersion-0 <= 8);

		//添加工具栏的工具
		//If you want add tool to tool bar. You must be do three steps:
		//1,Add tool bar element: add a k-v pair to this.tools object like tool-bold
		//2,Add element style: add style rltoolicon-XXX, XXX represent object.label
		//3,Add element events: add event callback function to RealEditor.toolsFun

		//This must be jquery event name
		this.tools = {
			"bold" : {"key":"bold", "label":"\u7c97\u4f53","shortcutKey" :"Ctrl+B"}//粗体
			,"italic" : {"key":"italic","label":"\u659c\u4f53","shortcutKey" :"Ctrl+I"
					, "event": {"click" : function (el,o,e){
							this.execCommand(o.key, false, null).focus();
						}
					}
			}//斜体
			,"underline" : {"key":"underline","label":"\u4e0b\u5212\u7ebf","shortcutKey" :"Ctrl+U"}//下划线
			,"strikeout" : {"key":"strikethrough","label":"\u4e2d\u5212\u7ebf","event":{"click":"click"}//中划线
				}
			,"font" : {"key":"fontName","label":"\u5b57\u4f53","event":{"mouseenter" :"mouseEnter"}//字体
				}
			,"fontSize" : {"key":"fontSize","label":"\u5b57\u4f53\u5927\u5c0f","event":{"mouseenter":"mouseEnter"}
				}//字体大小
			,"forecolor" : {"key":"forecolor","label":"\u5b57\u4f53\u989c\u8272","event":{"mouseenter" :"mouseEnter"}//字体颜色
				}
			,"backcolor" : {"key":"backcolor","label":"\u80cc\u666f\u8272","event":{"mouseenter" :"mouseEnter"}//背景色
				}
			,"formatblock" : {"key":"formatblock","label":"\u6392\u7248","event":{"mouseenter" :"mouseEnter"}//排版
				}
			,"justify" : {"key":"justify","label":"\u5bf9\u9f50","event":{"mouseenter" :"mouseEnter"}//对齐
				}
			,"list" : {"key":"list","label":"\u5217\u8868","event":{"mouseenter" :"mouseEnter"}//列表
				}
			,"outdent" : {"key":"outdent","label":"\u7f29\u56de"}//缩回
			,"indent" : {"key":"indent","label":"\u7f29\u8fdb"}//缩进
			,"selectAll" : {"key":"selectall","shortcutKey":"ctrl+a","label":"\u5168\u9009"}//全选
			,"removeformat" : {"key":"removeformat","shortcutKey":"ctrl+r", "label":"\u6e05\u9664\u683c\u5f0f"}//清除格式
			,"link" : {"key":"createlink", "label":"\u6e05\u9664\u683c\u5f0f","event":{
					"mouseenter":"mouseEnter"
			}}//插入链接
			,"unlink": {"key": "unlink", "label":"\u53d6\u6d88\u683c\u5f0f"}//取消链接
			,"image": {"key": "insertimage", "label": "\u63d2\u5165\u56fe\u7247"
				,"event":{
					"mouseenter":"mouseEnter"
				}
			}//插入图片
			,"preview":{"key": "preview", "label":"\u9884\u89c8"
				, "event":{"click": function (el,o,e){
						var editorText = this.getEditorContentHtml();
						var previewDoc = window.open().document;
						try{
							previewDoc.open();
							previewDoc.write(editorText);
							previewDoc.close();
						}catch(e){
							console.error(e);
						}

					}
				}
			}
			,"about": {"key": "about", "label": "\u5173\u4e8e"
					, "event":{"click": function(el,o,e){
							var divContent = '欢迎使用realEditor<br>您可以点击<a href="https://github.com/chanble/realEditor" target="_blank">这里</a>了解该项目<br>联系作者：chanble_cn@163.com'
								,adiv = $('<div class="rltoolbuttonitem-div">'+divContent+'</div>');
							var jel = $(el)
								,elOffset = jel.offset();
							var ulLeft = elOffset.left
								,ulTop = elOffset.top + jel.innerHeight();
							var timeOut;
							jel.after(
									adiv.css({"position": "absolute", "left":ulLeft, "top":ulTop})
								).mouseleave(function (){
									timeOut = setTimeout(function (){
										adiv.remove();
									}, 200);
								});
							adiv.mouseenter(function (){
								clearTimeout(timeOut);
							})
							.mouseleave(function (){
								setTimeout(function (){
									adiv.remove();
								}, 200);
							});
						}
				}
			}
		};
		this.options = $.extend(false, RealEditor.DEFAULT_OPTS, o);
		this._init();
		if (typeof(el.jquery) == "undefined"){
			el = $(el);
		}
		this.setSkin();
		var iframeHtml = this.getIframeHtml(i),
		rlcontainerId = this.getContainerId(i),
		html = '<span class="rleditor_container" id="'
				+ rlcontainerId + '"><table cellspacing="0" cellpadding="0" style="display:inline-table;"><tbody><tr><td class="rleditor_tool">'
				+'</td></tr><tr><td class="rleditor_content">'
				+ iframeHtml +'</td></tr></tbody></table></span>';
		var iframeId = this.getIframId(i)
			,elWidth = el.width()
			,elHeight = el.height()
			,_jForm = el.closest('form')
			,elContent = el.text();
			el.after(html);
		//隐藏文本框
		this._hide(el);
		var rlcontaioner = $("#"+rlcontainerId);
		this.mrl_contaioner = rlcontaioner;
		rlcontaioner.width(elWidth);
		$("td.rleditor_content", rlcontaioner).width(elWidth).height(elHeight);

		//init tools
		this.initTools();
		var rl_iframe = $('#'+iframeId);
		this.mrl_iframe = rl_iframe[0];
		this.mrl_window = this.mrl_iframe.contentWindow;
		this.mrl_document = this.mrl_window.document;
		this.mrl_body = null;
		this._initIframeContent(this.getIframeContentHtml()+elContent)
			._initThisBody().setEditable(true).setCaretPosition(elContent.length)
			.bindKeyEvent();
		var that = this;
		_jForm.submit(function (){
			el.html(that.getEditorContentHtml());
		});
	};
	RealEditor.options = {};
	RealEditor.DEFAULT_OPTS = {
		tools:"full"
		,skin:"default"
		,skinPath:"js/realeditor/skin"
		,sourceMode:false
		,width : 200
		,height:100
	};
	RealEditor.toolsFun = {
		strikethrough:{click : function (el,o,e){
				this.execCommand('styleWithCSS',false,true)
						.execCommand(o.key, false, null).focus();
			}
		}
		,fontName: {
			mouseEnter: function (el,o,e){
				var that = this;
				var jel = $(el),fontUL = $('<ul></ul>')
					, fontList = '', elOffset = jel.offset();
				var ulLeft = elOffset.left
					,ulTop = elOffset.top + jel.innerHeight();
				var fonts = [{"key":"SimSun", "title":"\u5b8b\u4f53","label":"\u5b8b\u4f53"}//宋体
							,{"key":"FangSong_GB2312", "title":"\u4eff\u5b8b","label":"\u4eff\u5b8b"}//仿宋
							,{"key":"SimHei", "title":"\u9ed1\u4f53","label":"\u9ed1\u4f53"}//黑体
							,{"key":"KaiTi_GB2312", "title":"\u6977\u4f53","label":"\u6977\u4f53"}//楷体
							,{"key":"Microsoft YaHei", "title":"\u5fae\u8f6f\u96c5\u9ed1","label":"\u5fae\u8f6f\u96c5\u9ed1"}//微软雅黑
							,{"key":"Arial", "title":"Arial","label":"Arial"}
							,{"key":"Arial Black", "title":"Arial Black","label":"Arial Black"}
							,{"key":"Sans", "title":"Sans","label":"Sans"}
							,{"key":"Comic Sans MS", "title":"Comic Sans MS","label":"Comic Sans MS"}
							,{"key":"Helvetica", "title":"Helvetica","label":"Helvetica"}
							,{"key":"Impact", "title":"Impact","label":"Impact"}
							,{"key":"Courier", "title":"Courier","label":"Courier"}
							,{"key":"Courier New", "title":"Courier New","label":"Courier New"}
							,{"key":"System", "title":"System","label":"System"}
							,{"key":"Times New Roman", "title":"Times New Roman","label":"Times New Roman"}
							,{"key":"Tahoma", "title":"Tahoma","label":"Tahoma"}
							,{"key":"Consolas", "title":"Consolas","label":"Consolas"}
							,{"key":"Serif", "title":"Serif","label":"Serif"}
							,{"key":"Verdana", "title":"Verdana","label":"Verdana"}];
				for(var i in fonts){
					fontList += '<li title="'+fonts[i].title+'"><a style="font-family:'
							+fonts[i].key+'">'
							+fonts[i].label+'</a></li>'
				}
				var timeOut, ulHeight = 250;
				fontUL.append(fontList)
					.addClass('ul-list')
					.css({"position": "absolute", "left":ulLeft, "top":ulTop, "width":"150px"})
					.height(ulHeight);
				jel.after(fontUL)
				.mouseleave(function (){
					timeOut = setTimeout(function (){
						fontUL.remove();
					}, 200);
				});
				fontUL.mouseenter(function (){
					clearTimeout(timeOut);
				})
				.mouseleave(function (){
					setTimeout(function (){
						fontUL.remove();
					}, 200);
				});
				$("li", fontUL).click(function (){
					var fn = $('a', this).css('font-family');
					fontUL.remove();
					that.execCommand(o.key, false, fn).focus();
				});
			}
		}
		,fontSize : {
			mouseEnter: function (el,o, e){
				var that = this;
				var jel = $(el),fontUL = $('<ul></ul>')
					, fontList = '', elOffset = jel.offset();
				var ulLeft = elOffset.left
					,ulTop = elOffset.top + jel.innerHeight();
				var fonts = [{"key":"1", "title":"\u6781\u5c0f","label":"\u6781\u5c0f"}//极小
							,{"key":"2", "title":"\u7279\u5c0f","label":"\u7279\u5c0f"}//特小
							,{"key":"3", "title":"\u5c0f","label":"\u5c0f"}//小
							,{"key":"4", "title":"\u4e2d\u7b49","label":"\u4e2d\u7b49"}//中等
							,{"key":"5", "title":"\u5927","label":"\u5927"}//大
							,{"key":"6", "title":"\u7279\u5927","label":"\u7279\u5927"}//特大
							,{"key":"7", "title":"\u6781\u5927","label":"\u6781\u5927"}];//极大
				for(var i in fonts){
					fontList += '<li title="'+fonts[i].title
							+'"><a><font size="'
							+fonts[i].key+'">'
							+fonts[i].label+'</font></a></li>'
				}
				var timeOut, ulHeight = 150;
				fontUL.append(fontList)
					.addClass('ul-list')
					.css({"position": "absolute","left":ulLeft,"top":ulTop,"width":"150px"})
					.height(ulHeight);
				jel.after(fontUL)
					.mouseleave(function (){
						timeOut = setTimeout(function (){
							fontUL.remove();
						}, 200);
					});
				fontUL.mouseenter(function (){
					clearTimeout(timeOut);
				})
				.mouseleave(function (){
					setTimeout(function (){
						fontUL.remove();
					}, 200);
				});
				$("li", fontUL).click(function (){
					var fs = $('font', this).attr('size');
					fontUL.remove();
					that.execCommand(o.key, false, fs).focus();
				});
			}
		}
		,forecolor : {
			mouseEnter: function (el,o,e){
				var that = this;
				var jel = $(el),colorDiv
						= $('<div class="rltoolbuttonitem-div"></div>')
					, fontList = '', elOffset = jel.offset();
				var ulLeft = elOffset.left
					,ulTop = elOffset.top + jel.innerHeight();
				var colors = [{"key":"#FFFFFF", "label":"White","title":"\u767d\u8272"}//白色
						,{"key":"#D3D3D3","label":"LightGray","title":"\u6d45\u7070\u8272"}//浅灰色
						,{"key":"#808080","label":"Gray","title":"\u7070\u8272"}//灰色
						//,{"key":"#A9A9A9","label":"DarkGray","title":"深灰色"}//深灰色
						,{"key":"#696969","label":"DimGray","title":"\u6697\u7070\u8272"}//暗灰色
						,{"key":"#000000","label":"Black","title":"\u9ed1\u8272"}//黑色
						//,{"key":"#FFFFF0","label":"Ivory","title":"象牙白"}//象牙白
						//,{"key":"#FFFFE0","label":"LightYellow","title":"浅黄色"}//浅黄色
						,{"key":"#FFFF00","label":"Yellow","title":"\u9ec4\u8272"}//黄色
						//,{"key":"#FFFAFA","label":"Snow","title":"雪白\u8272"}//雪白色
						//,{"key":"#FFFAF0","label":"FloralWhite","title":"花白\u8272"}//花白色
						//,{"key":"#FFFACD","label":"LemonChiffon","title":"粉黄\u8272"}
						//,{"key":"#FFF8DC","label":"Cornsilk","title":"米绸\u8272"}
						//,{"key":"#FFF5EE","label":"SeaShell","title":"海贝\u8272"}
						,{"key":"#FFF0F5","label":"LavenderBlush","title":"\u6de1\u7d2b\u8272"}
						//,{"key":"#FFEFD5","label":"PapayaWhip","title":"番木\u8272"}
						//,{"key":"#FFEBCD","label":"BlanchedAlmond","title":"白杏\u8272"}
						//,{"key":"#FFE4E1","label":"MistyRose","title":"浅玫瑰\u8272"}
						,{"key":"#FFE4C4","label":"Bisque","title":"\u9ec4\u8910\u8272"}
						//,{"key":"#FFE4B5","label":"Moccasin","title":"莫卡辛"}
						//,{"key":"#FFDEAD","label":"NavajoWhite","title":"土著白"}
						//,{"key":"#FFDAB9","label":"PeachPuff","title":"桃红\u8272"}
						,{"key":"#FFD700","label":"Gold","title":"\u91d1\u9ec4\u8272"}
						,{"key":"#FFC0CB","label":"Pink","title":"\u7c89\u7ea2\u8272"}
						//,{"key":"#FFB6C1","label":"LightPink","title":"浅粉红"}
						,{"key":"#FFA500","label":"Orange","title":"\u6a59\u8272"}
						//,{"key":"#FFA07A","label":"LightSalmon","title":"浅肉色"}
						,{"key":"#FF8C00","label":"DarkOrange","title":"\u6df1\u6a59\u8272"}
						,{"key":"#FF7F50","label":"Coral","title":"\u73ca\u745a\u8272"}
						//,{"key":"#FF69B4","label":"HotPink","title":"艳粉色"}
						//,{"key":"#FF6347","label":"Tomato","title":"番茄红"}
						,{"key":"#FF4500","label":"OrangeRed","title":"\u6a58\u7ea2\u8272"}
						,{"key":"#FF1493","label":"DeepPink","title":"\u6df1\u7c89\u8272"}
						//,{"key":"#FF00FF","label":"Fuchsia","title":"紫红色"}
						//,{"key":"#FF00FF","label":"Magenta","title":"洋红色"}
						,{"key":"#FF0000","label":"Red","title":"\u7ea2\u8272"}
						//,{"key":"#FDF5E6","label":"OldLace","title":"浅米色"}
						//,{"key":"#FAFAD2","label":"LightGoldenRodYellow","title":"浅秋黄"}
						//,{"key":"#FAF0E6","label":"Linen","title":"亚麻色"}
						//,{"key":"#FAEBD7","label":"AntiqueWhite","title":"古董白"}
						,{"key":"#FA8072","label":"Salmon","title":"\u7c89\u6a59\u8272"}
						//,{"key":"#F8F8FF","label":"GhostWhite","title":"幽灵白"}
						,{"key":"#F5FFFA","label":"MintCream","title":"\u8584\u8377\u4e73"}
						,{"key":"#F5F5F5","label":"WhiteSmoke","title":"\u70df\u767d\u8272"}
						//,{"key":"#F5F5DC","label":"Beige","title":"灰褐色"}
						,{"key":"#F5DEB3","label":"Wheat","title":"\u6de1\u8910\u8272"}
						//,{"key":"#F4A460","label":"SandyBrown","title":"沙褐色"}
						,{"key":"#F0FFFF","label":"Azure","title":"\u5929\u84dd\u8272"}
						//,{"key":"#F0FFF0","label":"HoneyDew","title":"哈密瓜蓝"}
						,{"key":"#F0F8FF","label":"AliceBlue","title":"\u6d45\u84dd\u8272"}
						,{"key":"#F0E68C","label":"Khaki","title":"\u5361\u5176\u8272"}
						//,{"key":"#F08080","label":"LightCoral","title":"淡珊瑚"}
						//,{"key":"#EEE8AA","label":"PaleGoldenRod","title":"灰秋黄"}
						,{"key":"#EE82EE","label":"Violet","title":"\u84dd\u7d2b\u8272"}
						//,{"key":"#E9967A","label":"DarkSalmon","title":"暗肉色"}
						,{"key":"#E6E6FA","label":"Lavender","title":"\u6de1\u7d2b\u8272"}
						//,{"key":"#E0FFFF","label":"LightCyan","title":"淡青色"}
						//,{"key":"#DEB887","label":"BurlyWood","title":"实木色"}
						,{"key":"#DDA0DD","label":"Plum","title":"\u7edb\u7d2b\u8272"}
						//,{"key":"#DCDCDC","label":"Gainsboro","title":"淡灰色"}
						,{"key":"#DC143C","label":"Crimson","title":"\u6df1\u7ea2\u8272"}
						//,{"key":"#DB7093","label":"PaleVioletRed","title":"淡紫红"}
						//,{"key":"#DAA520","label":"GoldenRod","title":"褐黄色"}
						//,{"key":"#DA70D6","label":"Orchid","title":"兰花紫"}
						//,{"key":"#D8BFD8","label":"Thistle","title":"蓟色"}
						,{"key":"#D2B48C","label":"Tan","title":"\u68d5\u8910\u8272"}
						,{"key":"#D2691E","label":"Chocolate","title":"\u5de7\u514b\u529b\u8272"}
						//,{"key":"#CD853F","label":"Peru","title":"秘鲁色"}
						,{"key":"#CD5C5C","label":"IndianRed","title":"\u5370\u5ea6\u8272"}
						//,{"key":"#C71585","label":"MediumVioletRed","title":"紫罗兰红"}
						//,{"key":"#C0C0C0","label":"Silver","title":"银白色"}
						//,{"key":"#BDB76B","label":"DarkKhaki","title":"深卡其布"}
						,{"key":"#BC8F8F","label":"RosyBrown","title":"\u73ab\u7470\u8272"}
						//,{"key":"#BA55D3","label":"MediumOrchid","title":"中兰花紫"}
						//,{"key":"#B8860B","label":"DarkGoldenRod","title":"深秋色"}
						,{"key":"#B22222","label":"FireBrick","title":"\u7816\u7ea2\u8272"}
						//,{"key":"#B0E0E6","label":"PowderBlue","title":"深蓝色"}
						//,{"key":"#B0C4DE","label":"LightSteelBlue","title":"淡钢蓝"}
						//,{"key":"#AFEEEE","label":"PaleTurquoise","title":"淡宝石绿"}
						//,{"key":"#ADFF2F","label":"GreenYellow","title":"绿黄色"}
						,{"key":"#ADD8E6","label":"LightBlue","title":"\u6d45\u84dd\u8272"}
						,{"key":"#A52A2A","label":"Brown","title":"\u68d5\u8272"}
						//,{"key":"#A0522D","label":"Sienna","title":"土黄色"}
						,{"key":"#9ACD32","label":"YellowGreen","title":"\u9ec4\u7eff\u8272"}
						//,{"key":"#9932CC","label":"DarkOrchid","title":"暗紫色"}
						//,{"key":"#98FB98","label":"PaleGreen","title":"淡绿色"}
						,{"key":"#9400D3","label":"DarkViolet","title":"\u6697\u7d2b\u8272"}
						//,{"key":"#9370DB","label":"MediumPurple","title":"中紫色"}
						,{"key":"#90EE90","label":"LightGreen","title":"\u6d45\u7eff\u8272"}
						,{"key":"#8FBC8F","label":"DarkSeaGreen","title":"\u6df1\u6d77\u7eff"}
						//,{"key":"#8B4513","label":"SaddleBrown","title":"重褐色"}
						//,{"key":"#8B008B","label":"DarkMagenta","title":"深洋红"}
						,{"key":"#8B0000","label":"DarkRed","title":"\u6df1\u7ea2\u8272"}
						,{"key":"#8A2BE2","label":"BlueViolet","title":"\u84dd\u7d2b\u8272"}
						//,{"key":"#87CEFA","label":"LightSkyBlue","title":"浅天蓝色"}
						,{"key":"#87CEEB","label":"SkyBlue","title":"\u5929\u84dd\u8272"}
						,{"key":"#808000","label":"Olive","title":"\u6a44\u6984\u8272"}
						,{"key":"#800080","label":"Purple","title":"\u7d2b\u8272"}
						,{"key":"#800000","label":"Maroon","title":"\u8910\u7ea2\u8272"}
						//,{"key":"#7FFFD4","label":"Aquamarine","title":"宝石蓝"}
						,{"key":"#7FFF00","label":"Chartreuse","title":"\u6d45\u7eff\u8272"}
						//,{"key":"#7CFC00","label":"LawnGreen","title":"草绿色"}
						//,{"key":"#7B68EE","label":"MediumSlateBlue","title":"中板岩蓝"}
						//,{"key":"#778899","label":"LightSlateGray","title":"浅石板灰"}
						//,{"key":"#708090","label":"SlateGray","title":"石板灰"}
						//,{"key":"#6B8E23","label":"OliveDrab","title":"橄榄褐"}
						//,{"key":"#6A5ACD","label":"SlateBlue","title":"岩蓝色"}
						//,{"key":"#66CDAA","label":"MediumAquaMarine","title":"中碧绿色"}
						,{"key":"#6495ED","label":"CornflowerBlue","title":"\u6d45\u84dd\u8272"}
						,{"key":"#5F9EA0","label":"CadetBlue","title":"\u519b\u84dd\u8272"}
						//,{"key":"#556B2F","label":"DarkOliveGreen","title":"暗橄榄绿"}
						,{"key":"#4B0082","label":"Indigo","title":"\u975b\u84dd\u8272"}
						//,{"key":"#48D1CC","label":"MediumTurquoise","title":"宝石绿"}
						//,{"key":"#483D8B","label":"DarkSlateBlue","title":"暗灰蓝色"}
						,{"key":"#4682B4","label":"SteelBlue","title":"\u94a2\u9752\u8272"}
						,{"key":"#4169E1","label":"RoyalBlue","title":"\u54c1\u84dd\u8272"}
						,{"key":"#40E0D0","label":"Turquoise","title":"\u9752\u7eff\u8272"}
						//,{"key":"#3CB371","label":"MediumSeaGreen","title":"中海绿色"}
						//,{"key":"#32CD32","label":"LimeGreen","title":"石灰绿"}
						,{"key":"#2F4F4F","label":"DarkSlateGray","title":"\u58a8\u7eff\u8272"}
						,{"key":"#2E8B57","label":"SeaGreen","title":"\u6d77\u7eff\u8272"}
						,{"key":"#228B22","label":"ForestGreen","title":"\u8471\u7eff\u8272"}
						//,{"key":"#20B2AA","label":"LightSeaGreen","title":"浅海绿"}
						,{"key":"#1E90FF","label":"DodgerBlue","title":"\u95ea\u84dd\u8272"}
						//,{"key":"#191970","label":"MidnightBlue","title":"深兰色"}
						//,{"key":"#00FFFF","label":"Aqua","title":"湖绿色"}
						,{"key":"#00FFFF","label":"Cyan","title":"\u9752\u8272"}
						//,{"key":"#00FF7F","label":"SpringGreen","title":"春绿色"}
						,{"key":"#00FF00","label":"Lime","title":"\u67e0\u6aac\u8272"}
						//,{"key":"#00FA9A","label":"MediumSpringGreen","title":"中春绿色"}
						//,{"key":"#00CED1","label":"DarkTurquoise","title":"深宝石绿"}
						//,{"key":"#00BFFF","label":"DeepSkyBlue","title":"深天蓝色"}
						//,{"key":"#008B8B","label":"DarkCyan","title":"深青色"}
						,{"key":"#008080","label":"Teal","title":"\u84dd\u7eff\u8272"}
						,{"key":"#008000","label":"Green","title":"\u7eff\u8272"}
						//,{"key":"#006400","label":"DarkGreen","title":"深绿色"}
						,{"key":"#0000FF","label":"Blue","title":"\u84dd\u8272"}
						//,{"key":"#0000CD","label":"MediumBlue","title":"中蓝色"}
						,{"key":"#00008B","label":"DarkBlue","title":"\u6df1\u84dd\u8272"}
						//,{"key":"#000080","label":"Navy","title":"海军蓝"}
						];
				fontList += '<div>';
				for(var i in colors){
					var ti =  parseInt(i)+1;
					if (ti%9 === 0){
						fontList += '</div><div>';
					}else{
						fontList += '<a href="#" onclick="return false;" title="'+colors[i].title
								+'"style="display: inline-block;border: #999 1px solid;width: 17px;margin: 1px;height: 12px; background-color:'
								+colors[i].key+';"></a>';
					}
				}
				fontList += '</div>';
				var timeOut = null;
				jel.addClass('rltoolbuttonhover');
				colorDiv.append(fontList)
					.css({position: 'absolute', left:ulLeft, top:ulTop});
				jel.after(colorDiv)
					.mouseleave(function (){
						timeOut = setTimeout(function (){
							colorDiv.remove();
						}, 200);
					});
				colorDiv.mouseenter(function (){
					clearTimeout(timeOut);
				})
				.mouseleave(function (){
					setTimeout(function (){
						colorDiv.remove();
					}, 200);
				});
				$("a", colorDiv).click(function (){
					var fs = $(this).css('background-color');
					colorDiv.remove();
					that.execCommand(o.key, false, fs).focus();
				});
			}
		}
		,backcolor :{
			mouseEnter:function (el,o,e){
				var that = this;
				var jel = $(el),colorDiv
						= $('<div class="rltoolbuttonitem-div"></div>')
					, fontList = '', elOffset = jel.offset();
				var ulLeft = elOffset.left
					,ulTop = elOffset.top + jel.innerHeight();
				var colors = [{"key":"#FFFFFF", "label":"White","title":"\u767d\u8272"}//白色
						,{"key":"#D3D3D3","label":"LightGray","title":"\u6d45\u7070\u8272"}//浅灰色
						,{"key":"#808080","label":"Gray","title":"\u7070\u8272"}//灰色
						,{"key":"#696969","label":"DimGray","title":"\u6697\u7070\u8272"}//暗灰色
						,{"key":"#000000","label":"Black","title":"\u9ed1\u8272"}//黑色
						,{"key":"#FFFF00","label":"Yellow","title":"\u9ec4\u8272"}//黄色
						,{"key":"#FFF0F5","label":"LavenderBlush","title":"\u6de1\u7d2b\u8272"}
						,{"key":"#FFE4C4","label":"Bisque","title":"\u9ec4\u8910\u8272"}
						,{"key":"#FFD700","label":"Gold","title":"\u91d1\u9ec4\u8272"}
						,{"key":"#FFC0CB","label":"Pink","title":"\u7c89\u7ea2\u8272"}
						,{"key":"#FFA500","label":"Orange","title":"\u6a59\u8272"}
						,{"key":"#FF8C00","label":"DarkOrange","title":"\u6df1\u6a59\u8272"}
						,{"key":"#FF7F50","label":"Coral","title":"\u73ca\u745a\u8272"}
						,{"key":"#FF4500","label":"OrangeRed","title":"\u6a58\u7ea2\u8272"}
						,{"key":"#FF1493","label":"DeepPink","title":"\u6df1\u7c89\u8272"}
						,{"key":"#FF0000","label":"Red","title":"\u7ea2\u8272"}
						,{"key":"#FA8072","label":"Salmon","title":"\u7c89\u6a59\u8272"}
						,{"key":"#F5FFFA","label":"MintCream","title":"\u8584\u8377\u4e73"}
						,{"key":"#F5F5F5","label":"WhiteSmoke","title":"\u70df\u767d\u8272"}
						,{"key":"#F5DEB3","label":"Wheat","title":"\u6de1\u8910\u8272"}
						,{"key":"#F0FFFF","label":"Azure","title":"\u5929\u84dd\u8272"}
						,{"key":"#F0F8FF","label":"AliceBlue","title":"\u6d45\u84dd\u8272"}
						,{"key":"#F0E68C","label":"Khaki","title":"\u5361\u5176\u8272"}
						,{"key":"#EE82EE","label":"Violet","title":"\u84dd\u7d2b\u8272"}
						,{"key":"#E6E6FA","label":"Lavender","title":"\u6de1\u7d2b\u8272"}
						,{"key":"#DDA0DD","label":"Plum","title":"\u7edb\u7d2b\u8272"}
						,{"key":"#DC143C","label":"Crimson","title":"\u6df1\u7ea2\u8272"}
						,{"key":"#D2B48C","label":"Tan","title":"\u68d5\u8910\u8272"}
						,{"key":"#D2691E","label":"Chocolate","title":"\u5de7\u514b\u529b\u8272"}
						,{"key":"#CD5C5C","label":"IndianRed","title":"\u5370\u5ea6\u8272"}
						,{"key":"#BC8F8F","label":"RosyBrown","title":"\u73ab\u7470\u8272"}
						,{"key":"#B22222","label":"FireBrick","title":"\u7816\u7ea2\u8272"}
						,{"key":"#ADD8E6","label":"LightBlue","title":"\u6d45\u84dd\u8272"}
						,{"key":"#A52A2A","label":"Brown","title":"\u68d5\u8272"}
						,{"key":"#9ACD32","label":"YellowGreen","title":"\u9ec4\u7eff\u8272"}
						,{"key":"#9400D3","label":"DarkViolet","title":"\u6697\u7d2b\u8272"}
						,{"key":"#90EE90","label":"LightGreen","title":"\u6d45\u7eff\u8272"}
						,{"key":"#8FBC8F","label":"DarkSeaGreen","title":"\u6df1\u6d77\u7eff"}
						,{"key":"#8B0000","label":"DarkRed","title":"\u6df1\u7ea2\u8272"}
						,{"key":"#8A2BE2","label":"BlueViolet","title":"\u84dd\u7d2b\u8272"}
						,{"key":"#87CEEB","label":"SkyBlue","title":"\u5929\u84dd\u8272"}
						,{"key":"#808000","label":"Olive","title":"\u6a44\u6984\u8272"}
						,{"key":"#800080","label":"Purple","title":"\u7d2b\u8272"}
						,{"key":"#800000","label":"Maroon","title":"\u8910\u7ea2\u8272"}
						,{"key":"#7FFF00","label":"Chartreuse","title":"\u6d45\u7eff\u8272"}
						,{"key":"#6495ED","label":"CornflowerBlue","title":"\u6d45\u84dd\u8272"}
						,{"key":"#5F9EA0","label":"CadetBlue","title":"\u519b\u84dd\u8272"}
						,{"key":"#4B0082","label":"Indigo","title":"\u975b\u84dd\u8272"}
						,{"key":"#4682B4","label":"SteelBlue","title":"\u94a2\u9752\u8272"}
						,{"key":"#4169E1","label":"RoyalBlue","title":"\u54c1\u84dd\u8272"}
						,{"key":"#40E0D0","label":"Turquoise","title":"\u9752\u7eff\u8272"}
						,{"key":"#2F4F4F","label":"DarkSlateGray","title":"\u58a8\u7eff\u8272"}
						,{"key":"#2E8B57","label":"SeaGreen","title":"\u6d77\u7eff\u8272"}
						,{"key":"#228B22","label":"ForestGreen","title":"\u8471\u7eff\u8272"}
						,{"key":"#1E90FF","label":"DodgerBlue","title":"\u95ea\u84dd\u8272"}
						,{"key":"#00FFFF","label":"Cyan","title":"\u9752\u8272"}
						,{"key":"#00FF00","label":"Lime","title":"\u67e0\u6aac\u8272"}
						,{"key":"#008080","label":"Teal","title":"\u84dd\u7eff\u8272"}
						,{"key":"#008000","label":"Green","title":"\u7eff\u8272"}
						,{"key":"#0000FF","label":"Blue","title":"\u84dd\u8272"}
						,{"key":"#00008B","label":"DarkBlue","title":"\u6df1\u84dd\u8272"}
						];
				fontList += '<div>';
				for(var i in colors){
					var ti =  parseInt(i)+1;
					if (ti%9 === 0){
						fontList += '</div><div>';
					}else{
						fontList += '<a href="#" onclick="return false;" title="'+colors[i].title
								+'"style="display: inline-block;border: #999 1px solid;width: 17px;margin: 1px;height: 12px; background-color:'
								+colors[i].key+';"></a>';
					}
				}
				fontList += '</div>';
				var timeOut;
				colorDiv.append(fontList)
					.css({position: 'absolute', left:ulLeft, top:ulTop});
				jel.after(colorDiv)
					.mouseleave(function (){
						timeOut = setTimeout(function (){
							colorDiv.remove();
						}, 200);
					});
				colorDiv.mouseenter(function (){
					clearTimeout(timeOut);
				})
				.mouseleave(function (){
					setTimeout(function (){
						colorDiv.remove();
					}, 200);
				});
				$("a", colorDiv).click(function (){
					var fs = $(this).css('background-color');
					colorDiv.remove();
					that.execCommand(o.key, false, fs).focus();
				});
			}
		}
		,formatblock:{
			mouseEnter: function (el,o,e){
				var that = this;
				var jel = $(el),fontUL = $('<ul></ul>')
					, fontList = '', elOffset = jel.offset();
				var ulLeft = elOffset.left
					,ulTop = elOffset.top + jel.innerHeight();
				var lists = [{"key":"<h1>", "title":"\u6807\u98981","label":"\u6807\u98981"}//标题1
							,{"key":"<h2>", "title":"\u6807\u98982","label":"\u6807\u98982"}//标题2
							,{"key":"<h3>", "title":"\u6807\u98983","label":"\u6807\u98983"}//标题3
							,{"key":"<h4>", "title":"\u6807\u98984","label":"\u6807\u98984"}//标题4
							,{"key":"<h5>", "title":"\u6807\u98985","label":"\u6807\u98985"}//标题5
							,{"key":"<h6>", "title":"\u6807\u98986","label":"\u6807\u98986"}//标题6
							,{"key":"<p>", "title":"\u6bb5\u843d","label":"\u6bb5\u843d"}//段落
							,{"key":"<pre>", "title":"\u539f\u7248","label":"\u539f\u7248"}//原版
							,{"key":"<address>", "title":"\u5730\u5740","label":"\u5730\u5740"}//地址
						];
				for(var i in lists){
					fontList += '<li title="'+lists[i].title
							+'" cmd="'+lists[i].key
							+'"><a style="display:block;">'+lists[i].key.replace('>', ' style="margin:0px;">')+lists[i].label
							+lists[i].key.replace('<','</')+'</a></li>'
				}
				var timeOut, ulHeight = 150;
				fontUL.append(fontList)
					.addClass('ul-list')
					.css({"position": "absolute","left":ulLeft,"top":ulTop,"width":"150px"})
					.height(ulHeight);
				$()
				jel.after(fontUL)
					.mouseleave(function (){
						timeOut = setTimeout(function (){
							fontUL.remove();
						}, 200);
					});
				fontUL.mouseenter(function (){
					clearTimeout(timeOut);
				})
				.mouseleave(function (){
					setTimeout(function (){
						fontUL.remove();
					}, 200);
				});
				$("li", fontUL).click(function (){
					var fs = $(this).attr('cmd');
					fontUL.remove();
					that.execCommand(o.key, false, fs).focus();
				});
			}
		}
		,justify:{
			mouseEnter: function (el,o, e){
				var that = this;
				var jel = $(el),fontUL = $('<ul></ul>')
					, fontList = '', elOffset = jel.offset();
				var ulLeft = elOffset.left
					,ulTop = elOffset.top + jel.innerHeight();
				var lists = [{"key":"justifyleft", "title":"\u5de6\u5bf9\u9f50","label":"\u5de6\u5bf9\u9f50"}//左对齐
							,{"key":"justifycenter", "title":"\u5c45\u4e2d","label":"\u5c45\u4e2d"}//居中
							,{"key":"justifyright", "title":"\u53f3\u5bf9\u9f50","label":"\u53f3\u5bf9\u9f50"}//右对齐
							,{"key":"justifyfull", "title":"\u5168\u5bf9\u9f50","label":"\u5168\u5bf9\u9f50"}];//全对齐
				for(var i in lists){
					fontList += '<li title="'+lists[i].title
							+'"><a cmd="'
							+lists[i].key+'">'
							+lists[i].label+'</a></li>'
				}
				var timeOut, ulHeight = 100;
				fontUL.append(fontList)
					.addClass('ul-list')
					.css({"position": "absolute","left":ulLeft,"top":ulTop,"width":"70px"})
					.height(ulHeight);
				jel.after(fontUL)
					.mouseleave(function (){
						timeOut = setTimeout(function (){
							fontUL.remove();
						}, 200);
					});
				fontUL.mouseenter(function (){
					clearTimeout(timeOut);
				})
				.mouseleave(function (){
					setTimeout(function (){
						fontUL.remove();
					}, 200);
				});
				$("li", fontUL).click(function (){
					var fs = $('a', this).attr('cmd');
					fontUL.remove();
					that.execCommand(fs, false, null).focus();
				});
			}
		}
		,list:{
			mouseEnter: function(el,o, e){
				var that = this;
				var jel = $(el),fontUL = $('<ul></ul>')
					, fontList = '', elOffset = jel.offset();
				var ulLeft = elOffset.left
					,ulTop = elOffset.top + jel.innerHeight();
				var lists = [{"key":"insertorderedlist", "title":"\u6570\u5b57\u5217\u8868","label":"\u6570\u5b57\u5217\u8868"}//数字列表
							,{"key":"insertunorderedlist", "title":"\u7b26\u53f7\u5217\u8868","label":"\u7b26\u53f7\u5217\u8868"}];//符号列表
				for(var i in lists){
					fontList += '<li title="'+lists[i].title
							+'"><a cmd="'
							+lists[i].key+'">'
							+lists[i].label+'</a></li>'
				}
				var timeOut, ulHeight = 50;
				fontUL.append(fontList)
					.addClass('ul-list')
					.css({"position": "absolute","left":ulLeft,"top":ulTop,"width":"90px"})
					.height(ulHeight);
				jel.after(fontUL)
					.mouseleave(function (){
						timeOut = setTimeout(function (){
							fontUL.remove();
						}, 200);
					});
				fontUL.mouseenter(function (){
					clearTimeout(timeOut);
				})
				.mouseleave(function (){
					setTimeout(function (){
						fontUL.remove();
					}, 200);
				});
				$("li", fontUL).click(function (){
					var fs = $('a', this).attr('cmd');
					fontUL.remove();
					that.execCommand(fs, false, null).focus();
				});
			}
		}
		,createlink:{
			mouseEnter: function (el,o,e){
				var that = this;
				var jel = $(el),mdiv = $('<div class="rltoolbuttonitem-div"></div>')
					, mdivContent = '<input type="text" id="reditor_murl" value="链接地址" onfocus="this.value == \'链接地址\'?this.value=\'\':\'\';"onblur="this.value==\'\'?this.value=\'链接地址\':\'\';"/><br><input type="text" id="reditor_mname" value="链接文字" size="10" onfocus="this.value==\'链接文字\'?this.value=\'\':\'\';" onblur="this.value==\'\'?this.value=\'链接文字\':\'\';"/><input type="button" value="插入"/>'
					, elOffset = jel.offset();
				var divLeft = elOffset.left
					,mdivTop = elOffset.top + jel.innerHeight();

				var timeOut;
				mdiv.append(mdivContent)
					.css({"position": "absolute","left":divLeft,"top":mdivTop});
				jel.after(mdiv)
					.mouseleave(function (){
						timeOut = setTimeout(function (){
							mdiv.remove();
						}, 200);
					});
				mdiv.mouseenter(function (){
					clearTimeout(timeOut);
				})
				.mouseleave(function (){
					setTimeout(function (){
						mdiv.remove();
					}, 200);
				});
				$("input:button", mdiv).click(function (){
					var herf = $('#reditor_murl',mdiv).val()
						,name = $('#reditor_mname',mdiv).val();
					var rg = that.getRange();
					var isRg = that.isIEle8 ? rg.htmlText == '' : rg.collapsed;
					if (isRg){
						that.appendTextNode(name);
					}
					mdiv.remove();
					that.execCommand(o.key, false, herf).focus();
				});
			}
		}
		,insertimage: {mouseEnter: function (el,o,e){
				var that = this;
				var jel = $(el),mdiv = $('<div class="rltoolbuttonitem-div"></div>')
					, mdivContent = '<input type="text" id="reditor_murl" value="图片地址" onfocus="this.value == \'图片地址\'?this.value=\'\':\'\';"onblur="this.value==\'\'?this.value=\'图片地址\':\'\';"/><input type="button" id="reditor_insert" value="插入"/>&nbsp;<input id="reditor_upload" type="button" value="上传"/><input type="file" id="reditor_uploadfile" tabindex="-1" style="display:none;" accept="image/*" name="imageFile"/>'
					, elOffset = jel.offset();
				var divLeft = elOffset.left
					,mdivTop = elOffset.top + jel.innerHeight();

				var timeOut;
				mdiv.append(mdivContent)
					.css({"position": "absolute","left":divLeft,"top":mdivTop});
				jel.after(mdiv)
					.mouseleave(function (){
						timeOut = setTimeout(function (){
							mdiv.remove();
						}, 200);
					});
				mdiv.mouseenter(function (){
					clearTimeout(timeOut);
				})
				.mouseleave(function (){
					setTimeout(function (){
						mdiv.remove();
					}, 200);
				});
				$("#reditor_insert",mdiv).click(function (){
					var url = $("input:text", mdiv).val();
					that.execCommand(o.key, false,url);
				});
				$("#reditor_upload",mdiv).click(function (){
					$("#reditor_uploadfile").trigger('click').change(function(){
						var red = that.reDialog(
								{title:"上传中……", content:""
								,cancel:function(){
									reu.cancelUpload();
								}
								, mask:0.7});
						var reu = that.reUpload({uploadFile: this, url: 'upload.php'
								, complete: function(d){
									if (!d){
										alert('上传失败，请重新上传！');
									}else if (d.state == 'ok'){
										this.execCommand(o.key, false,d.msg);
									}else if (d.state == 'cancel'){

									}else{
										alert(d.msg);
									}
									red.release();
								}, timeout: 60000
								,start: function (){
									red.show();
								}
							});
						reu.startUpload();
					});
				});
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
				,full:['bold','italic','underline','strikeout','font', 'fontSize'
					,'forecolor','backcolor','formatblock','justify','list'
					,'indent','outdent','selectAll','removeformat','link','unlink'
					,'image','preview','about']
			};
			return this;
		}
		,_initThisBody : function (){
			this.mrl_body = this.mrl_document.body;
			return this;
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
			this.mrl_body.contentEditable = !!b;
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
			var aShowUI = !!aShowDefaultUI;
			var customCommands = [];
			if (this.inArray(command, customCommands, true, true)){
				//
			}else{
				aValue != null ?
					this.mrl_document.execCommand(command, aShowUI, aValue)
					: this.mrl_document.execCommand(command, aShowUI, null);
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
		,_initIframeContent : function (content){
			return this.docWrite(content);
		}
		,docWrite : function (str){
			var doc = this.mrl_document;
			try{
				doc.open();
				doc.write(str);
				doc.close();
			}catch(e){
				console.error(e);
			}
			return this;
		}
		,getContainerId : function (n){
			return 'realeditor'+n+'_container';
		}
		,getEditorContent: function (){
			return $(this.mrl_body).text();
		}
		,getEditorContentHtml: function (){
			return $(this.mrl_body).html();
		}
		,appendText : function(str){
			var newStr = this.convertHtml(str);
			return this.appendHtml(newStr);
		}
		// convert html mark to entity name
		// 转换thml标签为实体名字
		,convertHtml: function (str){
			var newStr = str.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(/\s/g, '&nbsp;');
			return newStr;
		}
		,appendTextNode: function (str, select, start, end){
			select = select == null || select != false;
			start = isNaN(parseInt(start)) ? 0 : start;
			end = isNaN(parseInt(end)) ? 0 : end;
			var sel = this.getSelection();
			if (this.isIEle8){
				var rg = this.getRange(true);
				rg.collapse (false);
				rg.pasteHTML(str);
				start = start - str.length;
				if (select){
					rg.moveStart("character",start);
					end > 0 && rg.moveEnd("character", end-str.length);
					rg.select();
				}
			}else{
				var rg = this.getRange();
				var tn = this.mrl_document.createTextNode(str);
				rg.insertNode(tn);
				if (select){
					rg.setStart(tn, start);
					end > 0 && rg.setEnd(tn, end);
					sel.removeAllRanges();
					sel.addRange(rg);
				}
			}
			return this.focus();
		}
		//
		,appendHtml : function (str){
			return this.execCommand('inserthtml', false, str);
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
							: (sel.rangeCount > 0 ? sel.getRangeAt(0) : null);
				}
				if (!rng){
					rng = this.mrl_body.createTextRange
							? this.mrl_body.createTextRange()
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
			var toolStr = '<span><a href="#" onclick="return false;" class="rltoolbutton" id="rltoolabutton'
							+key+'" title="'+label + shortcutKeyStr
							+'"><span class="rltoolicon rltoolicon-'
							+key+'">'
							+key+'</span></a></span>';
			return this.appendToolsHtml(toolStr).bindEvent(ot);
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
			if (this.isIEle8) {
			  range.moveStart('character', pos);
			  range.select();
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
			if (typeof(obj) == 'undefined'){
				return this;
			}
			var that = this,toolButton = $("#rltoolabutton"+obj.key);
			if (typeof (obj.event) == 'undefined' || obj.event.length == 0){
				toolButton.bind('click', function (){
					that.execCommand('styleWithCSS',false,true).execCommand(obj.key,false,null).focus();
				});
			}else{
				var _events = obj.event;
				for (var e in _events){
					(function (_e){toolButton.bind(_e, function (event){
						if (typeof(_events[_e]) === 'function'){
							_events[_e].call(that, this, obj, event);
						}else{
							//参数说明：'that' mean RealEditor object
							//'this' mean event source(toolButton)
							//'obj' mean one of this.tools
							//'event' mean one of this.tools.event
							RealEditor.toolsFun[obj.key][_events[_e]]
										.call(that, this, obj, event);
						}
					})})(e);
				}
			}
			return this;
		}
		,bindKeyEvent : function (){
			var _this = this;
			$(_this.mrl_document).keydown(function (e){
				(function (_e){
					for (var t in _this.tools){
						var tb = _this.tools[t].key;
						var ts = _this.tools[t].shortcutKey;
						if (!!ts && _this.equalShortcut(_e, ts)){
							$("#rltoolabutton"+tb).trigger('click');
							_e.preventDefault();
						}
					}
				})(e);
			});
			return this;
		}
		,equalShortcut : function (keyEvent, shortcutStr){
			var ctrl = !!keyEvent.ctrlKey, ctrlStr = 'CTRL'
			,alt = !!keyEvent.altKey, altStr = 'alt'
			,shift = !!keyEvent.shiftKey, shiftStr = 'shift'
			,kc = this.getKeyCode(keyEvent)
			,separator = '+';
			if (shortcutStr.indexOf(separator) >= 0){
				var scArray = shortcutStr.split(separator);
				var bCtrl = !(this.inArray(ctrlStr, scArray) ^ ctrl);
				var bAlt = !(this.inArray(altStr, scArray) ^ alt);
				var bShift = !(this.inArray(shiftStr, scArray) ^ shift);
				var bKey = this.inArray(charKeyMap[kc], scArray);
				return bCtrl && bAlt && bShift && bKey;
			}else{
				return false;
			}
		}
		, getKeyCode : function (keyEvent){
			return keyEvent.keyCode | keyEvent.charCode;
		}
		/**
		 * Checks if a value exists in an array
		 * can be use object like-array
		 * s: The searched value
		 * a: The array
		 * ignoreCase: letter case
		 * key : compare object's key
		 */
		,inArray : function (s, a, ignoreCase, key){
			ignoreCase = (ignoreCase == null) || (ignoreCase != false);
			key = (key != null) && (key == true);
			for (var i in a){
				var equal = ignoreCase ?
					(key ? String(s).toLowerCase() == String(i).toLowerCase()
							: String(s).toLowerCase() == String(a[i]).toLowerCase())
					:(key ? s == i : s == a[i]);
				if (equal){
					return true;
				}
			}
			return false;
		}
		,reDialog: function(dOpt){
			var defaultOpt = {title: "", content: "", mask:0.8};
			var opt = $.extend(false, defaultOpt, dOpt);
			var realDialog = function (){
				var _rDialog = $('<div class="rleditor_redialog"><table><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr></table></div>').appendTo('body');
				var _head = $("td:first",_rDialog).html(opt.title);
				var _content = $("td:eq(2)",_rDialog).html(opt.content);
				if (!!opt.mask){//添加遮罩层
					var _maskDiv = $('<div class="rleditor_mask"></div>');
					_maskDiv.appendTo('body');
					this.maskDiv = _maskDiv;
				}
				if (!!opt.cancel){
					$("td:last", _rDialog).append('<input type="button" id="rleditor_cancel" value="取消"/>');
					$("#rleditor_cancel").click(function (){
						typeof(opt.cancel) === 'function' ?
							(opt.cancel).call() : this.release();
					});
				}
				if (!!opt.ok && typeof(opt.ok) === 'function'){
					$("td:last", _rDialog).append('<input type="button" id="rleditor_ok" value="确定"/>');
					var okBtn = $("#rleditor_ok");
					okBtn.click(function (){
						typeof(opt.ok) === 'function' ?
							(opt.ok).call() : this.release();
					});
				}
				this.rDialog = _rDialog;
				this.show = function (){
					if (!!this.maskDiv){
						this.maskDiv.css({"display":"block","opacity":this.maskDiv});
					}
					this.rDialog.css("display", "block");
					return this;
				};
				this.release = function (){
					if (!!this.maskDiv){
						this.maskDiv.remove();
					}
					this.rDialog.remove();
					return this;
				};
			}
			return new realDialog();
		}
		,reUpload: function (dOpt){
			var that = this;
			var defaultOpt = {uploadFile:$("#reditor_uploadfile") ,url: "upload.php"
								,start:function(){ console.info('开始上传');}
								,complete:function (d){console.info('上传结束');}
								,timeout:60000};
			var opt = $.extend(false, defaultOpt, dOpt);
			var realUpload = function (){
				var timeout = opt.timeout
					,inputFileEl = $(opt.uploadFile)
					,toUrl = opt.url;
				var uid = new Date().getTime(),idIO='jUploadFrame'+uid;
				var mfile = $(inputFileEl);
				var jIO=$('<iframe name="'+idIO+'" style="display: none;"/>').appendTo('body');
				var mform = $('<form action="'+toUrl+'" target="'+idIO+'" method="post" enctype="multipart/form-data"></form>').appendTo('body');
				var minterval, io = jIO[0], mresponse = '';
				this.startUpload = function (){
					mform.append(mfile).submit();
					minterval = setInterval(function (){
						mresponse = io.contentWindow.document.body.innerHTML;
						var currTime = new Date().getTime();
						var noTimeout = (currTime-uid-timeout) < 0;//是否超时
						if (!noTimeout){
							clearInterval(minterval);
							setTimeout(function (){
								(opt.complete).call(that, {state: 'fail', msg:'上传超时'});
							},50);
						}else if (mresponse != ''){
							clearInterval(minterval);
							var mResponseJson = $.parseJSON(mresponse);
							setTimeout(function (){
								(opt.complete).call(that, mResponseJson);
							}, 50);
							jIO.remove();
							mform.remove();
						}
					}, 500);
					setTimeout(function (){
						(opt.start).call(that,{state:'ok', msg: '上传开始'});
					}, 10);
				};
				this.cancelUpload = function (){
					clearInterval(minterval);
					setTimeout(function (){
						(opt.complete).call(that, {state: 'cancel', msg:'取消成功'});
					}, 10);
				};
			}
			return new realUpload();
		}
	};
})(jQuery);
