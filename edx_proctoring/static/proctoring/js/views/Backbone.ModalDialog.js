// Backbone.ModalDialog.js v0.3.2
//
// Copyright (C)2012 Gareth Elms
// Distributed under MIT License
//
// Documentation and full license availabe at:
// https://github.com/GarethElms/BackboneJSModalView

Backbone.ModalView =
    Backbone.View.extend(
        {
            name: "ModalView",
            modalBlanket: null,
            modalContainer: null,
            defaultOptions: {
                fadeInDuration: 150,
                fadeOutDuration: 150,
                showCloseButton: true,
                bodyOverflowHidden: false,
                setFocusOnFirstFormControl: true,
                targetContainer: document.body,
                slideFromAbove: false,
                slideFromBelow: false,
                slideDistance: 150,
                showModalAtScrollPosition: true,
                permanentlyVisible: false,
                backgroundClickClosesModal: true,
                pressingEscapeClosesModal: true,
                css: {
                    "display": "block",
                    'position': 'static',
                }
            },

            initialize: function () {
            },
            events: {
            },

            showModalBlanket: function () {
                return this.ensureModalBlanket().fadeIn(this.options.fadeInDuration);
            },

            hideModalBlanket: function () {
                return this.modalBlanket.fadeOut(this.options.fadeOutDuration);
            },

            ensureModalContainer: function (target) {
                if (target != null) {
                    // A target is passed in, we need to re-render the modal container into the target.
                    if (this.modalContainer != null) {
                        this.modalContainer.remove();
                        this.modalContainer = null;
                    }
                }

                if (this.modalContainer == null) {
                    this.modalContainer =
                        $("<div id='modalContainer'>")
                            .css({
                                "z-index": "99999",
                                "position": "relative",
                                "-webkit-border-radius": "6px",
                                "-moz-border-radius": "6px",
                                "border-radius": "6px"
                            })
                            .appendTo(target);
                }

                return this.modalContainer;
            },

            ensureModalBlanket: function () {
                this.modalBlanket = $("#modal-blanket");

                if (this.modalBlanket.length == 0) {
                    this.modalBlanket =
                        $("<div id='modal-blanket'>")
                            .css(
                            {
                                position: "absolute",
                                top: 0,
                                left: 0,
                                height: $(document).height(), // Span the full document height...
                                width: "100%", // ...and full width
                                opacity: 0.5, // Make it slightly transparent
                                backgroundColor: "#000",
                                "z-index": 99900
                            })
                            .appendTo(document.body)
                            .hide();
                }
                else {
                    // Ensure the blanket spans the whole document, screen may have been updated.
                    this.modalBlanket.css(
                        {
                            height: $(document).height(), // Span the full document height...
                            width: "100%" // ...and full width
                        });
                }

                return this.modalBlanket;
            },

            keyup: function (event) {
                if (event.keyCode == 27 && this.options.pressingEscapeClosesModal) {
                    this.hideModal();
                }
            },

            click: function (event) {
                if (event.target.id == "modal-blanket" && this.options.backgroundClickClosesModal) {
                    this.hideModal();
                }
            },

            setFocusOnFirstFormControl: function () {
                var controls = $("input, select, email, url, number, range, date, month, week, time, datetime, datetime-local, search, color", $(this.el));
                if (controls.length > 0) {
                    $(controls[0]).focus();
                }
            },

            hideModal: function () {
                this.trigger("closeModalWindow");

                this.hideModalBlanket();
                $(document.body).unbind("keyup", this.keyup);
                this.modalBlanket.unbind("click", this.click);

                if (this.options.bodyOverflowHidden === true) {
                    $(document.body).css("overflow", this.originalBodyOverflowValue);
                }

                var container = this.modalContainer;
                $(this.modalContainer)
                    .fadeOut(
                    this.options.fadeOutDuration,
                    function () {
                        container.remove();
                    });
            },

            getCoordinate: function (coordinate, css) {
                if (typeof( css[coordinate]) !== "undefined") {
                    var value = css[coordinate];
                    delete css[coordinate]; // Don't apply positioning to the $el, we apply it to the modal container. Remove it from options.css

                    return value;
                }
            },

            showModal: function (options) {
                this.defaultOptions.targetContainer = document.body;
                this.options = $.extend(true, {}, this.defaultOptions, options, this.options);

                if (this.options.permanentlyVisible) {
                    this.options.showCloseButton = false;
                    this.options.backgroundClickClosesModal = false;
                    this.options.pressingEscapeClosesModal = false;
                }

                //Set the center alignment padding + border see css style
                var $el = $(this.el);

                var modalContainer = this.ensureModalContainer(this.options.targetContainer).empty();

                $el.addClass("modal");
                $el.css(this.options.css);

                this.showModalBlanket();
                this.keyup = _.bind(this.keyup, this);
                this.click = _.bind(this.click, this);
                $(document.body).keyup(this.keyup); // This handler is unbound in hideModal()
                this.modalBlanket.click(this.click); // This handler is unbound in hideModal()

                if (this.options.bodyOverflowHidden === true) {
                    this.originalBodyOverflowValue = $(document.body).css("overflow");
                    $(document.body).css("overflow", "hidden");
                }

                modalContainer
                    .append($el);

                modalContainer.css({
                    "opacity": 0,
                    "position": "fixed",
                    "z-index": 999999,
                    'top': '50%',
                    'left': '50%',
                    'transform': 'translate(-50%, -50%)',
                });

                if (this.options.setFocusOnFirstFormControl) {
                    this.setFocusOnFirstFormControl();
                }

                if (this.options.showCloseButton) {
                    $("<a href='#' id='modalCloseButton'><i class='far fa-xmark'></i></a>")
                        .css({
                            "position": "absolute",
                            "top": "16px",
                            "right": "24px",
                            "width": "24px",
                            "height": "24px",
                            "z-index": "999999",
                            "text-decoration": "none",
                            'display': 'flex',
                            'align-items': 'center',
                            'justify-content': 'flex-end',
                        })
                        .appendTo(this.modalContainer)
                        .click((event) => {
                            event.preventDefault();
                            this.hideModal();
                        })
                }

                var animateProperties = {opacity: 1};
                this.modalContainer.animate(animateProperties, this.options.fadeInDuration);

                return this;
            }
        });
