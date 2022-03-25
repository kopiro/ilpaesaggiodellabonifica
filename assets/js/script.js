var body,
header,
footer,
website,
content,
incontent,
main,
vignette,
vignettel,
tooltip,
loader,
progress,
searchr,
stateloader,

$window = $(window),
$document = $(document),

ww = $window.width(),
wh = $window.height(),
mobi = false,
tablet = false,

BOX_WIDTH = null,
BOX_DIST = null,
BOX_MARGINLEFT = null,
SWITCHER_TIMEOUT = 1000,
SWITCHER_EASING = 'ease-in-out',
SWITCHER_ANIMATION = true,
SWITCHER_BG_MAX = 4;

var __$u = {};
function $u(val) {
	if (val in __$u) return __$u[val];
	__$u[val] = Website.findNodeFromAttribute('slug', val.replace('#','').replace('!',''));
	return __$u[val];
}

var CSS3Easing = {
	'out-expo':'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
	'in-expo':'cubic-bezier(0.950, 0.050, 0.795, 0.035)',
	'in-out-expo':'cubic-bezier(1.000, 0.000, 0.000, 1.000)'
};

var Parser = new function()
{
	var self = this;

	this.createArticle = function(type, url, content){
		return $('<article id="'+url+'" class="'+type+'"></article>').
		append('<header><a class="'+type+'closer"></a></header>').
		append('<section>'+content+'</section>');
	};
};


var NewsletterCallback = function(json)
{
	$('#newsletter-result').html(json.message);
	if (!json.error || json.error=="0") {
		setTimeout(function(){
			$('#newsletter-form').css('left', ww+500);
		}, 3000);
	}
};

var Lightbox = new function()
{
	var self = this;

	this.close = function(){
		var els = $('[data-lightbox]:visible');
		if (els.length===0) return;
		els.fadeOut('fast', function(){
			if ($('[data-lightbox]:visible').length===0) {
				UI.toggleVignettel(false);
				try {
					els.remove();
				} catch (ex) {}
			}
		});
	};
}

var Errors = new function()
{
	var self = this;

	this.xhr = function(){
		UI.setState('default');
		WindowManager.load('error');
	};

	this.notFound = function(){
		UI.setState('default');
		WindowManager.load('error');
	};
}

var Printer = new function()
{
	var self = this;

	this.doAction = function(html){
		var p = window.open('','','width=2480,height=3507');
		p.document.open('text/html');
		p.document.write('<link rel="stylesheet" href="/assets/css/style.css" />');
		p.document.write('<link rel="stylesheet" href="/assets/css/print.css" />');
		p.document.write(html);
		p.document.close();
		p.print();
		p.close();
	};
}

var Bookmarks = new function()
{
	var self = this;

	this.toggleCurrent = function(cb){
		if (!Modernizr.localstorage) {
			alert('Putroppo non puoi utilizzare questa funzionalità in quanto non è supportata dal tuo browser.');
			return false;
		}
		var b = [];
		if (!localStorage.bookmarks) {
			localStorage.bookmarks = '';
		} else {
			b = localStorage.bookmarks.split(',');
		}
		var url = Routes.getHash();
		var i = b.indexOf(url);
		if (i===-1) b.push(url);
		else b.splice(i, 1);
		localStorage.bookmarks = b.join(',');
		if (cb!==undefined) cb();
	};

	this.exists = function(url){
		if (!Modernizr.localstorage) return false;
		if (!localStorage.bookmarks) return false;
		return localStorage.bookmarks.split(',').indexOf(url)!==-1;
	};

	this.getAll = function(){
		if (!Modernizr.localstorage) return [];
		if (!localStorage.bookmarks) return [];
		return localStorage.bookmarks.split(',');
	};
}

var Search = new function()
{
	var self = this;
	this.active = 0,
	this.value = '';
	this.els = null;

	this.start = function(){
		UI.toggleVignettel(true);
		$('#search').addClass('visible');
		$('#q').focus();
	};

	this.perform = function(val){
		if (self.value==val || val===null || val.length===0) return;
		self.value = val;
		searchr.empty();
		$.each(Website.findNodes(val), function(){
			var $t = $(this);
			var a = $('<a data-color="'+$t.attr('color')+'" href="#'+$t.attr('slug')+'">'+$t.attr('title')+'</a>');
			searchr.append(a);
		});
		self.active = 0;
		self.els = searchr.find('>a');
		self.els.eq(0).trigger('mouseenter');
	};

	this.isOpened = function(){
		return $('#search:visible').length>0 ? true : false;
	};

	this.end = function(){
		$('#search').removeClass('visible');
		UI.toggleVignettel(false);
	};
}

var WindowManager = new function()
{
	var self = this;
	this.active = false;
	this.activeEl = null;

	this.find = function(url){
		return $('#'+url+'.window');
	};

	this.show = function(url, cb){
		if (self.activeEl!==null) {
			var active = self.activeEl;
			active.removeClass('visible');
			setTimeout(function(){
				try {
					active.remove();
				} catch (ex) {}
			}, 400);
		}
		self.activeEl = self.find(url);
		self.active = true;
		UI.analizeArticle(url);
		UI.cssIze();
		UI.setNavigationCurrent(url);
		UI.toggleVignette(true);
		self.activeEl.addClass('visible');
		setTimeout(function(){
			UI.cssIzePlus();
			if (cb!==undefined) cb();
		}, 500);
	};

	this.load = function(url, cb){
		if (self.find(url).length>0) {
			self.show(url, cb);
			return;
		}
		UI.setState('progress');
		self.node = $u(url);
		$.ajax({
			url: self.node.attr('ref')+location.search,
			method: self.node.attr('method')?self.node.attr('method'):'get',
			dataType: 'html',
			success: function(resp){
				website.append(Parser.createArticle('window', url, resp));
				self.show(url, cb);
				UI.setState('default');
			},
			error: Errors.xhr
		});
	};

	this.hide = function(){
		if (self.active===null) return;
		if (self.activeEl===null || self.activeEl.length===0) return;
		self.activeEl.removeClass('visible');
		UI.toggleVignette(false);
		setTimeout(function(){
			try {
				self.activeEl.remove();
				self.active = false;
				self.activeEl = null;
			} catch (ex) {}
		}, 500);
	};
}

var BoxManager = new function()
{
	var self = this;
	this.boxFromClick = null;
	this.boxes = {};
	this.boxOpen = [];

	this.clearAll = function(cb){
		if (self.boxOpen.length>0) {
			var url = self.boxOpen[self.boxOpen.length-1];
			BoxManager.boxes[url].hide(function(){
				self.clearAll(cb);
			});
		} else {
			content.find('.contentcloser').fadeOut();
			UI.cssIze();
			UI.cssIzePlus();
			if (cb!==undefined) cb();
		}
	};

	this.hide = function(url){
		var box = self.find(url);
		if (box===null || box.length===0) return;
		box.hide(function(){
			BoxManager.setCSSAll();
			UI.setBodyWidth();
		});
	};

	this.remove = function(url){
		self.boxOpen.splice(self.boxOpen.indexOf(url), 1);
		delete self.boxes[url];
		if (self.boxOpen.length===0) {
			content.find('.contentcloser').fadeOut();
		}
	};

	this.setCSSAll = function(i){
		i = i || 0;
		if (i>=self.boxOpen.length) return;
		var url = self.boxOpen[i];
		if (!(url in BoxManager.boxes)) return;
		BoxManager.boxes[url].setLeft();
		BoxManager.boxes[url].setWidth();
		self.setCSSAll(i+1);
	};

	this.setLeftAll = function(){
		$.each(self.boxOpen, function(k,boxID){
			BoxManager.boxes[boxID].setLeft(function(){}, true);
		});
	};

	this.show = function(url, cb){
		var box = self.find(url);
		if (box===null || box.length===0) return;
		body.attr('data-class', url);
		self.boxOpen.splice(0, 0, box.url);
		content.find('.contentcloser').show();
		self.setCSSAll();
		UI.analizeArticle(url);
		UI.cssIze();
		UI.setNavigationCurrent(url);
		box.show(cb);
	};

	this.find = function(url){
		if (!(url in self.boxes)) return null;
		if (self.boxes[url]===undefined) return null;
		return self.boxes[url];
	};

	this.load = function(url, cb){
		var box = self.find(url);
		if (box===null || box.length===0) {
			BoxManager.boxes[url] = new Box(url);
			BoxManager.boxes[url].load(function(){
				self.show(url, cb);
			});
		} else {
			box.scrollToMe();
			if (cb!==undefined) cb();
		}
	};
}

var PageManager = new function()
{
	var self = this;

	this.show = function(url, node, resp, cb){
		Switcher.switchToByRef(url, function(){
			content.attr('id', url);
			incontent.html(resp);
			UI.analizeArticle(url, true);
			UI.cssIze();
			UI.setNavigationCurrent(url);
			UI.setClassCurrent(url);
			content.addClass('visible');
			setTimeout(function(){
				UI.cssIzePlus();
				if (cb!==undefined) cb();
			}, 500);
		});
	};

	this.load = function(url, cb){
		var node = $u(url);
		if (node===null || node.length===0) return;
		WindowManager.hide();
		UI.scrollH(0);
		BoxManager.clearAll(function(){
			content.removeClass('visible');
			UI.setState('progress');
			setTimeout(function(){
				$.ajax({
					url: node.attr('ref')+location.search,
					method: node.attr('method')?node.attr('method'):'get',
					success: function(resp) {
						self.show(url, node, resp, cb);
						UI.setState('default');
					},
					error: Errors.xhr
				});
			}, 500);
		});
	};
}

function Box(url)
{
	var self = this;
	this.url = url;
	this.node = $u(url);

	if (!this.url) {
		console.error('URL empty');
		return null;
	}

	if (this.node===null || this.node.length===0) {
		console.error('Node not found');
		return null;
	}

	this.getMarginLeft = function(){
		var offset = self.getOpenedIndex()+1;
		return (BOX_WIDTH+BOX_DIST)*offset;
	};

	this.getOpenedIndex = function(){
		return BoxManager.boxOpen.indexOf(self.url);
	};

	this.setLeft = function(cb, instant){
		if (instant===true) {
			self.dom.css('left', self.getMarginLeft());
		} else {
			self.dom.transit({
				'left':(self.getMarginLeft())
			}, 400, CSS3Easing['out-expo'], cb);
		}
	};

	this.setWidth = function(cb){
		self.dom.transit({
			width:BOX_WIDTH
		}, 700, CSS3Easing['out-expo'], cb);
	};

	this.scrollToMe = function(){
		var scrollLeft = self.getMarginLeft();
		if (tablet===false && mobi===false) scrollLeft -= (BOX_WIDTH/2);
		UI.scrollH(scrollLeft);
	};

	this.show = function(cb){
		self.setWidth();
		setTimeout(function(){
			self.dom.addClass('visible');
			setTimeout(function(){
				UI.cssIzePlus();
				self.scrollToMe();
				if (cb!==undefined) cb();
			}, 500);
		}, 700);
	};

	this.load = function(cb){
		UI.setState('progress');
		$.ajax({
			url: self.node.attr('ref')+location.search,
			method: self.node.attr('method')?self.node.attr('method'):'get',
			success: function(resp){
				website.append(Parser.createArticle('box', self.url, resp));
				self.dom = $('#'+url+'.box');
				UI.setState('default');
				if (cb!==undefined) cb.apply();
			},
			error: Errors.xhr
		});
	};

	this.hide = function(cb){
		self.dom.find('>section').width(self.dom.find('>section').width());
		self.dom.transit({
			width:0
		}, 300, CSS3Easing['out-expo'], function(){
			var dom = self.dom;
			dom.removeClass('visible');
			BoxManager.remove(url);
			if (cb!==undefined) cb.apply();
			setTimeout(function(){
				try {
					dom.remove();
				} catch (ex) {}
			}, 500);
		});
	};
}

var Website = new function()
{
	var self = this;
	this.xml = null,
	this.analyzed = false;

	this.getNearNode = function(node, index){
		return index>0 ? node.next() : node.prev();
	};

	this.loadXML = function(cb){
		if (self.analyzed===true){
			console.warn('Website.loadXML called again.');
			return;
		}
		self.analyzed = true;
		progress.text('Carico le pagine...');
		if ($(''))
			$.ajax({
				url: 'pages.xml',
				dataType: 'xml',
				success:function(xml) {
					var $xml = $('website', xml);
					if ($xml===null || $xml.length===0) {
						self.xml = null;
						progress.html('<span style="color:red">Non sono riuscito ad analizzare le pagine.</span>');
					} else {
						self.xml = $xml;
						if (cb!==undefined) cb();
					}
				},
				error:function() {
					self.xml = null;
					progress.html('<span style="color:red">Non sono riuscito a recuperare le pagine.</span>');
				}
			});
	};


	this.findNodeFromAttribute = function(attr, val){
		if (self.xml===null) return null;
		return self.xml.find('['+attr+'='+val+']');
	};

	this.findNodes = function(q){
		if (self.xml===null) return null;
		var nodes = [];
		var reg = new RegExp(q.replace(' ','.*'),'i');
		self.xml.find('*').each(function(){
			if (reg.test($(this).attr('title'))) {
				nodes.push(this);
			}
		});
		return nodes;
	};
}

var Routes = new function()
{
	var self = this;
	this.lastPopStamp = null;
	this.currentHash = null;
	this.previousHash = null;
	this.noEffect = false;
	this.forced = false;

	this.isInTheParent = function(childurl, fatherurl){
		return ($u(childurl).parent().attr('slug')==fatherurl);
	};

	this.getHash = function(){
		var hash = location.hash.replace('#','').replace('!','');
		return hash ? hash : 'home';
	};

	this.getTime =function(){
		return new Date().getTime();
	};

	this.historyPop = function(forced){
		if (self.noEffect===true) return;
		if (!Routes.forced && self.lastPopStamp && self.getTime()-self.lastPopStamp<100){
			console.warn('Too-fast historyPop');
			return;
		}
		if (!Routes.forced && self.getHash()==self.currentHash){
			console.warn('Called the same URL');
			return;
		}
		self.forced = false;
		if (self.currentHash) {
			self.previousHash = self.currentHash;
		}
		self.currentHash = self.getHash();
		self.lastPopStamp = self.getTime();
		self.go(self.getHash());
	};

	this.historyFallback = function(){
		if (window.__hash!==location.hash) {
			window.__hash = location.hash;
			self.historyPop();
		}
	};

	this.go = function(url, cb){
		url = url || 'home';
		var node = $u(url);
		if (node.length===0){
			Errors.notFound();
			if (cb!==undefined) cb();
			console.error('Node not found');
			return;
		}
		document.title = node.attr('title') + ' | ' + 'Il paesaggio della Bonifica';
		var tag = node.prop('tagName').toUpperCase();
		if (tag==='PAGE' || tag==='SUBPAGE') {
			self.current = url;
			self.currentNode = $u(url);
			PageManager.load(url, cb);
		} else if (tag==='BOX' || tag==='WINDOW') {
			var parentNode = node.parent();
			var slugParentNode = parentNode ? parentNode.attr('slug') : '';
			var slugCurrentNode = self.currentNode ? self.currentNode.attr('slug') : '';
			var isInParentNode = (slugParentNode==slugCurrentNode);
			if (!node.attr('dialog') && isInParentNode===false) {
				self.go(slugParentNode, function(){
					self.go(url, cb);
				});
			} else {
				self.current = url;
				var nextCallback = function(){
					if (tag=='BOX') BoxManager.load(url, cb);
					else if (tag=='WINDOW') WindowManager.load(url, cb);
				};
				if (node.attr('dialog') && !Routes.previousHash) {
					self.go('home', nextCallback);
				} else {
					nextCallback();
				}
			}
		}
	};
}

var UI = new function()
{
	var self = this;

	this.set = function(){
		ww = $window.width();
		wh = $window.height();
		mobi = (ww<768);
		tablet = (ww<1024);
		if (mobi===true) {
			BOX_WIDTH = ww-20;
			BOX_MARGINLEFT = 10;
			BOX_DIST = 10;
		} else if (tablet===true) {
			BOX_WIDTH = ww*0.94;
			BOX_MARGINLEFT = ww*0.03;
			BOX_DIST = 10;
		} else {
			BOX_WIDTH = (ww*0.94-10)/2;
			BOX_MARGINLEFT = ww*0.03;
			BOX_DIST = 10;
		}
		self.cssIze();
		self.cssIzePlus();
		BoxManager.setLeftAll();
		Switcher.setPoints();
		Switcher.switchToCurrent();
	};

	this.toggleVignette = function(s){
		if (s===true) vignette.addClass('visible');
		else vignette.removeClass('visible');
	};

	this.toggleVignettel = function(s){
		if (s===true) vignettel.addClass('visible');
		else vignettel.removeClass('visible');
	};

	this.scrollH = function(scroll){
		body.animate({ scrollLeft:scroll }, 400);
	};

	this.setState = function(c){
		if (c=='progress') stateloader.addClass('visible');
		else stateloader.removeClass('visible');
		body.css('cursor', c);
	};

	this.setNavigationCurrent = function(url){
		url = url || Routes.currentHash;
		var node = $u(url);
		if (node===null || node.length===0) return;
		if (node.attr('hidden')) return;
		var tag = node.prop('tagName').toUpperCase();
		if (tag!=='PAGE') {
			self.setNavigationCurrent(node.parent().attr('slug'));
		} else {
			if (mobi===true) {
				header.find('>#header-links-select>option[value="#'+url+'"]')[0].selected = true;
			} else {
				header.find('>#header-links>a').each(function(k,e){
					var $e = $(e);
					if ($e.attr('href')=='#'+url) {
						$e.attr('class','current');
						var offset = $e.offset().left+header.scrollLeft();
						header.find('>#header_tr').css({
							left: offset
						});
					} else {
						$e.attr('class','current');
					}
				});
			}
		}
	};

	this.setClassCurrent = function(url){
		body.attr('class', url);
	};

	this.analizeArticle = function(url, forced){
		var article = $('#'+url);
		if (article===null || article.length===0) return;
		if (article.data('analyzed') && forced===false) return;
		article.attr({
			'data-analyzed': true,
			'data-url': url
		});
		var data_header = $('[data-header]', article);
		var data_header_content = data_header.html();
		var data_header_css = data_header.data('header');
		$('[data-header]', data_header).empty();
		$('>header', article).empty().
		attr('style', data_header_css?data_header_css:'').
		append(data_header_content);
		if (article.hasClass('main-content')===true) {
			$('<a style="display:none" class="contentcloser"></a>').appendTo($('>header',article));
		}
		if (article.hasClass('box')===true) {
			$('<a class="boxcloser"></a>').appendTo($('>header',article));
		}
		article.nanoScroller({
			iOSNativeScrolling: true,
			contentClass: '>section',
			sliderClass: 'nanoslider',
			scroll: 'top'
		});
	};

	this.cssIze = function(){
		$('.box,.main-content').css({
			'margin-left': BOX_MARGINLEFT
		});
		$('.box.visible,.main-content').css({
			width: BOX_WIDTH
		});
		if (mobi===false) {
			var w = 0;
			header.find('>#header-links>a').each(function(){ w += $(this).outerWidth(); });
			w += 30;
			var ml = (header.width()-w)/2;
			header.find('#header-links').css({
				'width': w,
				'margin-left': ml>0?ml:0
			});
		}
	};

	this.cssIzePlus = function(){
		$('figure,.popup-video,.autoratio').each(function(){
			var $t = $(this);
			$t.height($t.width()/1.7);
		});
		$('article[data-analyzed]').nanoScroller();
		self.setBodyWidth();
	};

	this.setBodyWidth = function(){
		var w = (BoxManager.boxOpen.length+1)*(BOX_WIDTH+BOX_DIST)-BOX_DIST+BOX_MARGINLEFT*2;
		body.width(w);
	};

}

var Switcher = new function()
{
	var self = this;
	this.now = { x:0,y:0 };
	this.old = { x:0, y:0 };
	this.max = { x:0, y:0 };
	this.firstTime = true;
	this.mulBase = 1.1;
	this.preloadIndex = 0;
	this.bg = null;

	this.init = function(cb, i){
		i = i || 0;
		var container = self.bg.eq(i);
		if (container.length===0) {
			if (cb!==undefined) cb();
			return;
		}
		var url = container.data('ref');
		var title = $u(url).attr('title');
		progress.html('Carico lo sfondo di <b>'+title+'</b> - ('+(i+1)+' di '+self.bg.length+')...');
		self.loadBackground(container, 0, function(){
			self.init(cb, i+1);
		});
	};

	this.multiplierEquation = function(d){
		return Math.pow(self.mulBase, d);
	};

	this.preloadWorker = function(){
		if (mobi===true || tablet===true) return;
		var allContainers = $('.bg:not(.fully-loaded)');
		if (allContainers.length===0) return;
		var index = self.preloadIndex++%allContainers.length;
		var container = allContainers.eq(index);
		var bgindex = container.find('.bgn').length;
		self.loadBackground(container, container.find('.bgn').length, function(){
			setTimeout(self.preloadWorker, 1000);
		});
	};

	this.loadBackground = function(ct, i, cb){
		i = i || 0;
		if ((mobi===true||tablet===true) && i>0) {
			if (cb!==undefined) cb();
			return;
		}
		if (i>SWITCHER_BG_MAX-1) {
			if (cb!==undefined) cb();
			return;
		}
		if (ct.find('>.bgn[data-n="'+i+'"]').length>0) {
			if (cb!==undefined) cb();
			return;
		}
		var fallbackLoad = (cb!==undefined) ? setTimeout(cb, 2000) : 0;
		var img = $('<img/>').attr({
			'src': 'bg/'+ct.data('ref')+'_'+i+'.jpg'
		});
		img.load(function(){
			ct.prepend('<div class="bgn" data-n="'+i+'" style="background-image:url('+$(this).attr('src')+')"></div>');
			//ct.prepend(img);
			if (fallbackLoad) clearInterval(fallbackLoad);
			if (i>=SWITCHER_BG_MAX-1) ct.addClass('fully-loaded');
			if (cb!==undefined) cb();
		});
	};

	this.switchToCurrent = function(){
		if (!self.now.x || !self.now.y) return;
		self.switchTo(self.now.x, self.now.y, true);
	};

	this.setPoints = function(){
		progress.text('Configuro la struttura...');
		self.bg = main.find('>.bg');
		self.bg.each(function(k,v){
			var $v = $(v);
			var matrix = {
				x:$v.attr('data-x'),
				y:$v.attr('data-y')
			};
			if (self.max.x<matrix.x) self.max.x = matrix.x;
			if (self.max.y<matrix.y) self.max.y = matrix.y;
			$v.css({
				left: ww*matrix.x,
				top: wh*matrix.y,
				width: ww,
				height: wh
			});
		});
		self.max.x++;
		self.max.y++;
		main.css('width', self.max.x*ww);
		main.css('height', self.max.y*ww);
	};

	this.anim = function(x, y, time, curve, cb){
		if (SWITCHER_ANIMATION===true) {
			main.transit({
				left:(-x*ww),
				top:(-y*wh)
			}, time, curve, cb);
		} else {
			main.css({
				left:(-x*ww),
				top:(-y*wh)
			});
			if (cb!==undefined) cb();
		}
	};

	this.switchTo = function(x, y, forced, cb){
		self.old.x = self.now.x;
		self.old.y = self.now.y;
		self.now.x = x;
		self.now.y = y;
		if (forced===true || self.firstTime===true ||
			(self.now.x==self.old.x && self.now.y==self.old.y))
		{
			self.anim(self.now.x, self.now.y, 0, 'linear');
			self.firstTime = false;
			if (cb!==undefined) cb();
			return;
		}
		var d = Math.abs(self.now.x-self.old.x);
		var t = SWITCHER_TIMEOUT*self.multiplierEquation(d);
		if (self.now.x!==self.old.x && self.now.y!==self.old.y) { // diagonal
			if (self.old.x<self.now.x && self.old.y<self.now.y) {
				self.anim(self.now.x, self.old.y, t, SWITCHER_EASING, function(){
					self.anim(self.now.x, self.now.y, t, SWITCHER_EASING, cb);
				});
			} else if (self.old.x > self.now.x && self.old.y > self.now.y) {
				self.anim(self.old.x, self.now.y, t, SWITCHER_EASING, function(){
					self.anim(self.now.x, self.now.y, t, SWITCHER_EASING, cb);
				});
			} else if (self.old.x < self.now.x && self.old.y > self.now.y) {
				self.anim(self.old.x, self.now.y, t, SWITCHER_EASING, function(){
					self.anim(self.now.x, self.now.y, t, SWITCHER_EASING, cb);
				});
			} else if (self.old.x > self.now.x && self.old.y > self.now.y) {
				self.anim(self.now.x, self.old.y, t, SWITCHER_EASING, function(){
					self.anim(self.now.x, self.now.y, t, SWITCHER_EASING, cb);
				});
			}
		} else if (self.now.x!=self.old.x) { // is only vertical
			self.anim(self.now.x, self.now.y, t, SWITCHER_EASING, cb);
		} else if (self.now.y!=self.old.y) { // is only horiz
			self.anim(self.now.x, self.now.y, t, SWITCHER_EASING, cb);
		} else {
			self.anim(self.now.x, self.now.y, 0, 'linear');
		}
	};

	this.switchToByRef = function(url, cb)
	{
		var container = self.bg.filter('[data-ref='+url+']');
		var x = container.attr('data-x');
		var y = container.attr('data-y');
		for (var i=1; i<=3; i++) {
			self.loadBackground(container, i);
		}
		self.switchTo(x, y, false, function(){
			self.bg.filter('.active').removeClass('active');
			container.addClass('active');
			if (cb!==undefined) cb();
		});
	};
}

var GeoLocalization = new function()
{
	var self = this;
	this.start = function(){
		if (true) return;
		navigator.geolocation.getCurrentPosition(function(pos){
			if (!pos.coords.latitude || !pos.coords.longitude) {
				console.warn('Invalid LAT-LON');
				return;
			}
			var lat = pos.coords.latitude;
			var lon = pos.coords.longitude;
			$.post('api/near.php', {
				lat:lat,
				lon:lon
			}, function(data) {
				if (!data || !data.length) return;
				var item = data[0];
				if (confirm('Sei vicino a '+item.title.toUpperCase()+', con una distanza di ~'+Math.floor(item.dist/1000)+'km.\nVuoi visualizzare la scheda?')) {
					location.href='#'+item.parent+'-'+item.slug;
				}
			});
		});
	};
};


// Event Attach

var __resizeTimeout = null;
$window.resize(function(){
	if (__resizeTimeout!==null) clearTimeout(__resizeTimeout);
	__resizeTimeout = setTimeout(UI.set, 500);
});

if (tablet===false && mobi===false)  {

	var __keys = "";
	$window.keydown(function(e){
		if (e.keyCode>=32 && e.keyCode<=173) {
			__keys += String.fromCharCode(e.keyCode);
		}
		if (e.keyCode==27) {
			vignette.click();
			vignettel.click();
			return;
		}
		if (Search.isOpened() && Search.els!==null && Search.els.length>0) {
			if (e.keyCode==40 || e.keyCode==38) {
				e.preventDefault();
				var inc = e.keyCode==40 ? 1 : -1;
				Search.active = (Search.active+inc)%(Search.els.length);
				Search.els.trigger('mouseleave').eq(Search.active).trigger('mouseenter');
			} else if (e.keyCode==13) {
				e.preventDefault();
				var href = Search.els.eq(Search.active).attr('href');
				if (href) {
					Routes.forced = true;
					location.hash = href;
					Search.end();
				}
			}
		}
	});

}


// DOM is ready

$(function(){

	body = $('body');
	header = $('#header');
	footer = $('#footer');
	website = $('#website');
	content = $('.main-content');
	incontent = $('.incontent');
	main = $('#main');
	vignette = $('#vignette');
	vignettel = $('#vignettel');
	tooltip = $('#tooltip');
	loader = $('#loader');
	progress = $('#loader>hgroup>h3');
	searchr = $('#search-results');
	stateloader = $('#state-loader');

	vignette.on('click', function(){
		WindowManager.hide();
		UI.toggleVignette(false);
	});

	vignettel.on('click', function(){
		Search.end();
		Lightbox.close();
	});

	$('#q').on('keyup', function(e){
		e.preventDefault();
		if (e.keyCode===13) return false;
		Search.perform($(this).val());
	});

	$('#newsletter-toggle').on('click', function(){
		var nf = $('#newsletter-form');
		if (nf.attr('data-toggled')) {
			nf.attr('data-toggled', null).css('left', -1000);
		} else {
			nf.attr('data-toggled', true).css('left', $(this).offset().left);
		}
	});

	$('#start-search').on('click', Search.start);

	$('#header-links-select').on('change', function(e){
		location.hash = $(this).val();
		$(this).blur();
	});

	searchr.on('click', 'a', Search.end);
	searchr.on('mouseleave', 'a', function(){
		$(this).css({
			background:'',
			color:''
		});
	});
	searchr.on('mouseenter', 'a', function(){
		var color = $(this).data('color');
		if (!color || color==='undefined') color = 'black';
		$(this).css({
			'background':color,
			'color':'white'
		});
	});

	website.on('mouseenter', '.tooltipable', function(e){
		var target = $(e.target);
		var alt = target.attr('alt');
		if (!alt) return;
		tooltip.find('#tooltip_content').html(alt);
		if (tooltip.css('display')=='none'){
			tooltip.show().css({
				left: target.offset().left-body.scrollLeft(),
				top: target.offset().top-4
			});
			if (tooltip.timeout!==null) clearTimeout(tooltip.timeout);
			tooltip.timeout = setTimeout(function(){
				tooltip.fadeOut();
			}, 2500);
		}
	});
	website.on('mouseleave', '.tooltipable', function(){
		tooltip.hide();
	});

	website.on('keyup', '[data-calc]', function(){
		var total = $(this).data('price')*$(this).val();
		$(this).attr('alt', 'Totale: '+total+'€');
		$(this).trigger('mouseenter');
	});

	website.on('click', '.contentcloser', function(){
		BoxManager.clearAll();
	});

	website.on('click', '.boxcloser', function(){
		var article = $(this).parents('article');
		BoxManager.hide(article.data('url'));
	});

	website.on('click', '.windowcloser', WindowManager.hide);

	website.on('click', 'article figure.videoflip, article figure.video', function(e){
		e.preventDefault();
		var url = $(this).data('url');
		if (tablet===true) {
			window.open(url);
		} else {
			UI.toggleVignettel(true);
			$('<iframe class="popup-video" src="'+url+'?autoplay=1" data-lightbox="true"></iframe>').
			appendTo(website).show();
			UI.cssIzePlus();
		}
	});

	website.on('click', 'article figure.picture', function(e){
		if (tablet===true ) return;
		e.preventDefault();
		UI.setState('progress');
		var image = $('<img class="image" />');
		var container = $('<div class="popup-gallery" style="display:none" data-lightbox="true"></div>');
		container.append(image).appendTo(website);
		var self = $(this);
		var bg = self.find('>a').attr('href');
		image.attr('src', bg).load(function(){
			UI.setState('default');
			UI.toggleVignettel(true);
			container.show();
			UI.cssIzePlus();
		});
	});

	website.on('click', 'article [data-action="audio-download"]', function(){
		var scIframe = null;
		$(this).parents('article.window').find('iframe').each(function(){
			if ($(this).attr('src').match(/soundcloud/i)) { scIframe = this; }
		});
		if (!scIframe) return;
		SC.Widget(scIframe).getCurrentSound(function(sound){
			$('<iframe src="'+sound.download_url+'?client_id=0f8fdbbaa21a9bd18210986a7dc2d72c" style="display:none;"></iframe>').appendTo('body');
		});
	});

	website.on('click', 'article [data-action="audio-listen"]', function(){
		var scIframe = null;
		$(this).parents('article.window').find('iframe').each(function(){
			if ($(this).attr('src').match(/soundcloud/i)) { scIframe = this; }
		});
		if (!scIframe) return;
		SC.Widget(scIframe).toggle();
	});

	website.on('click', 'article [data-action="print"]', function(){
		Printer.doAction($(this).parents('article').html());
	});

	website.on('click', 'article [data-action="bookmark"]', function(){
		var $t = $(this);
		Bookmarks.toggleCurrent(function(){
			$t.toggleClass('on');
		});
	});

	website.on('click', 'article [data-action="fontsize-inc"]', function(){
		var o = $(this).parents('article.window').find('.item-left');
		o.css('font-size', parseInt(o.css('font-size'),10)+2);
	});

	website.on('click', 'article [data-action="fontsize-dec"]', function(){
		var o = $(this).parents('article.window').find('.item-left');
		o.css('font-size', parseInt(o.css('font-size'),10)-1);
	});

	website.on('submit', 'form[data-ajax]', function(e){
		e.preventDefault();
		$.ajax({
			url: $(this).attr('action'),
			type: $(this).attr('method'),
			dataType: 'json',
			data: $(this).serialize(),
			success: window[$(this).data('callback')],
			error: window[$(this).data('error-callback')]
		});
	});

	body.mousewheel(function(event, delta){
		var $e = $(event.target);
		if ($e.prop('tagName').toUpperCase()=='ARTICLE') return;
		if ($e.parents('article').length>0) return;
		$window.scrollLeft($window.scrollLeft()-(delta*30));
	});

	try {
		Website.loadXML(function(){
			Switcher.setPoints();
			progress.text('Carico gli sfondi...');
			if (location.search=='?noload') return;
			Switcher.init(function(){
				UI.set();
				$('html').removeClass('isloading').addClass('loaded');
				Routes.historyPop();
				if (false===Modernizr.history || navigator.userAgent.match(/msie/i)) {
					window.__hash = location.hash;
					$document.on('click', 'a', function(){
						setTimeout(Routes.historyFallback, 0);
					});
				} else {
					$window.on('popstate', Routes.historyPop);
				}
				GeoLocalization.start();
				Switcher.preloadWorker();
			});
		});
	} catch (ex) {
		progress.text('Errore imprevisto');
	}

});
