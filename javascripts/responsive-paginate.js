/*
 * A plugin for making Bootstrap's pagination more responsive
 * https://github.com/auxiliary/rpage
 */

(function ($){
    jQuery.fn.rPage = function () {
        $(this).each(function(){
            new rPage($(this));
        });

        function rPage($container)
        {
            this.use_delay = false; // let user decide
            this.container = $container;
            this.parent = this.container.parent();

            // maybe user can pre-define this later:

            // ## class
            this.nextprev_class = ["prev", "next"];
            this.dots_class = ["dots"];
            this.disabled_class = "disabled removable";
            this.rightetc_class = "right-etc";
            this.leftetc_class = "left-etc";
            this.pageaway_class = "page-away-";
            this.parsed_class = "parsed";
            this.active_class = "active";

            // ## text label
            this.nextprev_text = $.merge(this.nextprev_class, ["»", "«"]);
            this.dots_text = ["..."];

            // ## node
            this.child_el = "li";
            this.child_el_inner = "span";

            this.label = function()
            {
                var
                   active_index = this.els.filter("." + this.active_class).index(),
                   $this = this,
                   className = "";

                this.els.each(function(){
                    if (!$this.isNextOrPrevLink($(this)))
                    {
                        className = $this.pageaway_class + (Math.abs(active_index - $(this).index())).toString();
                    }
                    else
                    {
                        className = ($(this).index() > active_index) ? $this.rightetc_class : $this.leftetc_class;
                    }

                    $(this).addClass(className);
                });
            }

            this.compareText = function(text, str)
            {
                if (!text) return;

                var regex = new RegExp(
                        "("
                        + str
                            .join("@")
                            .replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&")
                            .replace(/@/g, "|")
                        + ")",
                        "gi"
                    );

                return text.match(regex);
            }

            this.makeResponsive = function()
            {
                this.reset();

                while (this.container.outerWidth() > (this.parent.outerWidth() - 10))
                {
                    if (!this.removeOne())
                    {
                        break;
                    }
                }
            }

            this.isNextOrPrevLink = function(element)
            {
                return (
                        this.compareText(element.attr("class"), this.nextprev_class)
                        || this.compareText(element.text(), this.nextprev_text)
                    );
            }

            this.isRemovable = function(element)
            {
                if (this.isNextOrPrevLink(element))
                {
                    return false;
                }
                var index = this.els.filter(element).index();
                if (index == 1 || this.isNextOrPrevLink(this.container.find(this.child_el).eq(index + 1)))
                {
                    return false;
                }
                return (
                        !this.compareText(element.attr("class"), this.dots_class)
                        && !this.compareText(element.text(), this.dots_text)
                    );
            }

            this.removeOne = function()
            {
                var
                    active_index = this.els.filter("." + this.active_class).index(),
                    nodes = this.container.find(this.child_el).not("." + this.parsed_class),
                    farthest_index = nodes.length > 0 ? (nodes.length - 1) : 0,
                    is_needsEtcSign_init = false,
                    is_needsEtcSign_prev = this.needsEtcSign(1, active_index),
                    is_needsEtcSign_next = this.needsEtcSign(active_index, farthest_index /*- 1*/), // ??
                    exitloop = false,
                    htmlEtcSign = $("<" + this.child_el + "/>", {class: this.disabled_class})
                        .append($("<" + this.child_el_inner + "/>", {text: this.dots_text})),
                    $this = this;

                for (var i = farthest_index /*- 1*/; i > 0; i--) // ??
                {
                    var candidate = $this.els.not("." + $this.parsed_class).filter(function(){
                        return $(this).hasClass($this.pageaway_class + i.toString());
                    });

                    candidate.each(function(){
                        var candid_candidate = $(this);
                        if ($this.isRemovable(candid_candidate)) {
                            candid_candidate
                                .addClass($this.parsed_class)
                                .hide();

                            if (!is_needsEtcSign_init) {
                                is_needsEtcSign_init = true;

                                if (is_needsEtcSign_next)
                                {
                                    $this.els.eq(farthest_index - 2).before(htmlEtcSign);
                                }
                                if (is_needsEtcSign_prev)
                                {
                                    $this.els.eq(1).after(htmlEtcSign);
                                }
                            }

                            exitloop = true;
                            return exitloop;
                        }
                    });

                    if (!exitloop) continue;
                    return exitloop;
                }
            }

            this.getEtcSign = function(els)
            {
                var
                    textmap = $.map(
                      els,
                      function(el) {
                          return $(el).text()
                      })
                      .join(" ");

                return els.find("[class*='" + this.dots_class + "']").length || this.compareText(textmap, this.dots_text);
            }

            this.needsEtcSign = function(el1_index, el2_index)
            {
                if (
                    this.preEtc
                    || (el2_index - el1_index <= 1)
                ) return;

                var
                    slice = this.container.find(this.child_el).slice(el1_index, el2_index),
                    hasHiddenElement = slice.find(":hidden").length,
                    hasEtcSign = this.getEtcSign(slice);

                return (hasHiddenElement && !hasEtcSign);
            }

            this.reset = function()
            {
                var dis_class = "." + this.disabled_class.split(" ").join(".");

                this.els
                    .removeClass(this.parsed_class)
                    .css("display", "inline")
                    .filter(dis_class) // ??
                        .remove();

                this.container
                    .find(dis_class)
                        .remove();
            }

            this.calculateWidth = function()
            {
                return this.container.outerWidth();
            }

            this.els = this.container.find(this.child_el);
            this.preEtc = this.getEtcSign(this.els); // initial etc already there
            this.label();
            this.makeResponsive();

            this.resize_timer = 0;

            $(window).resize(
                $.proxy(function()
                {
                    if (this.use_delay) {
                        if (this.resize_timer) clearTimeout(this.resize_timer);
                        this.resize_timer = setTimeout($.proxy(function(){this.makeResponsive()}, this), 100);
                    } else {
                        this.makeResponsive();
                    }
                }, this)
            );
        }
    };
}(jQuery));
