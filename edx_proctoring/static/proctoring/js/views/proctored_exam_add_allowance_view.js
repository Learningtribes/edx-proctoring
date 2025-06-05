var edx = edx || {};

(function (Backbone, $, _, gettext) {
    'use strict';

    edx.instructor_dashboard = edx.instructor_dashboard || {};
    edx.instructor_dashboard.proctoring = edx.instructor_dashboard.proctoring || {};

    edx.instructor_dashboard.proctoring.AddAllowanceView = Backbone.ModalView.extend({
        name: "AddAllowanceView",
        template: null,
        template_url: '/static/proctoring/templates/add-new-allowance.underscore',
        initialize: function (options) {
            this.proctored_exams = options.proctored_exams;
            this.proctored_exam_allowance_view = options.proctored_exam_allowance_view;
            this.course_id = options.course_id;
            this.allowance_types = options.allowance_types;
            this.model = new edx.instructor_dashboard.proctoring.ProctoredExamAllowanceModel();
            _.bindAll(this, "render");
            this.loadTemplateData();
        },
        events: {
            "submit form": "addAllowance",
            "change #proctored_exam": 'selectExam',
            "change #allowance_type": 'selectAllowance'
        },
        loadTemplateData: function () {
            $.ajax({url: this.template_url, dataType: "html"})
                .done((template_data) => {
                    this.template = _.template(template_data);
                    this.render();
                    this.showModal({
                        setFocusOnFirstFormControl: false,
                    });
                    requestAnimationFrame(() => {
                        if (document.getElementById('proctored_exam')) {
                            document.getElementById('proctored_exam').value = String(this.proctored_exams[0].id)
                        }
                        this.selectExamAtIndex(0);
                    })
                });
        },
        getCurrentFormValues: function () {
            return {
                proctored_exam: $("#proctored_exam").val(),
                allowance_type: $("#allowance_type").val(),
                allowance_value: $("#allowance_value").val(),
                user_info: $("#user_info").val()
            };
        },
        hideError: function (view, attr, selector) {
            var $element = view.$form[attr];

            $element.removeClass("error");
            $element.parent().find(".error-message").empty();
        },
        showError: function (view, attr, errorMessage, selector) {
            var $element = view.$form[attr];

            $element.addClass("error");
            var $errorMessage = $('.modal .error-response');
            if ($errorMessage.length == 0) {
                $errorMessage = $("<div class='error-message'></div>");
                $element.parent().append($errorMessage);
            }

            $errorMessage.empty().append(errorMessage);
        },
        addAllowance: function (event) {
            event.preventDefault();
            var error_response = $('.modal .error-response');
            error_response.html();
            var values = this.getCurrentFormValues();
            var formHasErrors = false;


            var self = this;
            $.each(values, function(key, value) {
                if (value==="") {
                    formHasErrors = true;
                    self.showError(self, key, gettext("Required field"));
                }
                else {
                    self.hideError(self, key);
                }
            });

            if (!formHasErrors) {
                self.model.fetch({
                    headers: {
                        "X-CSRFToken": self.proctored_exam_allowance_view.getCSRFToken()
                    },
                    type: 'PUT',
                    dataType: 'xml',
                    data: {
                        'exam_id': values.proctored_exam,
                        'user_info': values.user_info,
                        'key': values.allowance_type,
                        'value': values.allowance_value
                    },
                    success: function () {
                        // fetch the allowances again.
                        error_response.html();
                        self.proctored_exam_allowance_view.collection.url = self.proctored_exam_allowance_view.initial_url + self.course_id + '/allowance';
                        self.proctored_exam_allowance_view.hydrate();
                        self.hideModal();
                    },
                    error: function(self, response, options) {
                        var data = $.parseJSON(response.responseText);
                        error_response.html(gettext(data.detail));
                    }
                });
            }
        },
        selectExamAtIndex: function (index) {
            var selectedExam = this.proctored_exams[index];

            if (selectedExam.is_proctored) {
                $('#exam_type_label').text(gettext(selectedExam.is_practice_exam ? 'Practice Exam' : 'Proctored Exam'))
            } else {
                $('#exam_type_label').text(gettext('Timed Exam'));
            }

            if (document.getElementById('allowance_type')) {
                document.getElementById('allowance_type').value = 'additional_time_granted'
                document.getElementById('allowance_type').disabled = !selectedExam.is_proctored
            }
            this.updateAllowanceLabels('additional_time_granted');
        },
        selectExam: function ({detail}) {
            const selectedIndex = this.proctored_exams.findIndex(c => c.id == detail)
            if (selectedIndex !== -1) this.selectExamAtIndex(selectedIndex);
        },
        selectAllowance: function ({detail}) {
            this.updateAllowanceLabels(detail);
        },
        updateAllowanceLabels: function (selectedAllowanceType) {
            if (selectedAllowanceType == 'additional_time_granted') {
                $('#minutes_label').show();
                $('#allowance_value_label').text(gettext('Additional Time'));
            } else {
                $('#minutes_label').hide();
                $('#allowance_value_label').text(gettext('Value'));
            }
        },

        render: function () {
            $(this.el).html(this.template({
                proctored_exams: this.proctored_exams,
                allowance_types: this.allowance_types
            }));

            this.$form = {
                proctored_exam: this.$("#proctored_exam"),
                allowance_type: this.$("#allowance_type"),
                allowance_value: this.$("#allowance_value"),
                user_info: this.$("#user_info")
            };
            return this;
        }
    });
}).call(this, Backbone, $, _, gettext);
