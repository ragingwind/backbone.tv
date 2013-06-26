define([
  'app'
],

function() {

	"use strict";

	var Calculator = Backbone.TV.View.extend({
		className: 'calculator',

    R: {
      template: 'template://calculator.html'
    },

		calculator: {
      exps: [],

      opr: function(n) {
        return /[0-9]/.test(n) == false;
      },

      push: function(exp) {
        var exps = this.exps
          , tail = exps.length - 1
          , operator = this.opr(exps[tail]);

        if (this.opr(exp) && operator) {
          exps[tail] = exp;
        }
        else {
          if (!(exps.length == 0 && (exp == '0' || this.opr(exp)))) {
            exps.push(exp);
          }
        }

        return exps.join('');
      },

      clear: function() {
        delete this.exps;
        this.exps = [];
      },

      pop: function() {
        return this.exps.pop();
      },

      calculate: function() {
        if (this.opr(this.exps[this.exps.length - 1])) {
          this.exps.pop();
        }
        return eval(this.exps.join(''));
      }
    },

		operator: false,

    initialize: function() {
      this.numbers = [];
      this.on('render:after', this.afterRender, this);
    },

		render: function() {
      // rendering view frame with template.
      this.$el.append(R.get(this.R.template)());

			var numbers = this.$el.find(".number");
			for (var i = 0, max = numbers.length; i < max; ++i) {
        // mapping view to exist element. mapped view had has no superview.
				var t = new Backbone.TV.View({el:numbers[i], className: 'number', order:i});

        // bind keyevent to num views.
				t.on('keydown:enter', this.selected, this);
				t.on('keydown:left keydown:up keydown:down keydown:right',
          this.traverse, this);
        t.on('keyevent:focusin keyevent:focusout', function(e) {
          this.$el[(e.hasFocus ? 'add' : 'remove') + 'Class']('focus');
        });

        // push created view.
				this.numbers.push(t);
			}
			return this;
		},

    afterRender: function() {
      // set focus to num view at first.
      this.numbers[0].focusin();
    },

		selected: function(v, e) {
			var n = v.$el.text();
			var t = '0';

			if (n == '=') {
				t = this.calculator.calculate();
				this.calculator.clear();
			}
			else if (n == 'C') {
				this.calculator.clear();
      }
			else {
				t = this.calculator.push(n);
      }

      // update led to total value. if total value is zero, led is clear to 0.
			$('#led').val(t ? t : 0);
		},

		traverse: function(v, e) {
			var row = Math.floor(v.options.order / 4);
			var col = v.options.order % 4;

			if (e.horizon) {
        col += (e.keyid == 'left' ? -1 : 1)
      }
      else {
        row += (e.keyid == 'up' ? -1 : 1);
      }

			if ((col >= 0 && col < 4) && (row >= 0 && row < 4)) {
				var order = Math.floor(row * 4) + (col);
				this.numbers[order].focusin();
				return true;
			}

			return false;
		}
	});

  return Calculator;
});
