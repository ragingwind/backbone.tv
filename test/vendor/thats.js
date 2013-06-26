/*
 * thats.js 
 * version 0.0.1
 * updated june 13, 2012 - @moon
 * 
 * copyright 2012, thats.kr
 * use of this source code is governed by a MIT license
 */

(function(window, undefined) {
	if (window.thats === null || window.thats == undefined) {
		window.thats = {};
	}

	// extention features
	Date.prototype.diff = function(from) {
		var timeDiff = this.getTime() - from.getTime();
		
		var daysDiff = Math.floor(timeDiff/1000/60/60/24);
		timeDiff -= daysDiff*1000*60*60*24

	  var hoursDiff = Math.floor(timeDiff/1000/60/60);
	  timeDiff -= hoursDiff*1000*60*60

	  var minsDiff = Math.floor(timeDiff/1000/60);
	  timeDiff -= minsDiff*1000*60

	  var secsDiff = Math.floor(timeDiff/1000);
		return {days:daysDiff, hours:hoursDiff, minutes:minsDiff, seconds:secsDiff};
	}

	Date.prototype.diffTimeToString = function(from) {
		var diff = this.diff(new Date(from));
			
		if (diff.days > 0)
			return 'about an ' + diff.days + ' days ago'
		else if (diff.hours > 0)
			return 'about an ' + diff.hours + ' hours ago'
		else if (diff.minutes > 0)
			return 'about an ' + diff.minutes + ' minutes ago'
		else if (diff.seconds > 0)
			return 'about an ' + diff.seconds + ' seconds ago'
		else
			return 'about an 1 seconds ago'
	}

	thats = {
		mobile: function() {
			return navigator.userAgent.indexOf('Mobile') >= 0;
		},
		android: function() {
			return navigator.userAgent.indexOf('Android') >= 0;
		}
	}
})(window);

// expose thats for node.js and common.js.
if(typeof module !== 'undefined' && module.exports){
	module.exports = thats;
}
else if (typeof exports !== 'undefined') {
	exports.thats = thats;
}

// define thats keyevent as an amd module.
if (typeof define === 'function' && define.amd) {
	define(function () {return thats;});
}