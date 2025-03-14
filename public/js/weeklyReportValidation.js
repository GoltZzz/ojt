$(".validated-form").validate({
  rules: {
    studentName: "required",
    internshipSite: "required",
    weekStartDate: {
      required: true,
      date: true,
    },
    weekEndDate: {
      required: true,
      date: true,
    },
    supervisorName: "required",
    "dailyRecords[][timeIn][morning]": "required",
    "dailyRecords[][timeOut][afternoon]": "required",
  },
  messages: {
    studentName: "Please enter the student's name",
    internshipSite: "Please enter the internship site",
    weekStartDate: "Please enter a valid start date",
    weekEndDate: "Please enter a valid end date",
    supervisorName: "Please enter the supervisor's name",
    "dailyRecords[][timeIn][morning]": "Enter morning time in",
    "dailyRecords[][timeOut][afternoon]": "Enter afternoon time out",
  },
  errorElement: "div",
  errorClass: "text-danger",
  highlight: function (element) {
    $(element).addClass("is-invalid");
  },
  unhighlight: function (element) {
    $(element).removeClass("is-invalid");
  },
  submitHandler: function (form) {
    form.submit();
  },
});
