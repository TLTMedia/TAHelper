/* Javascript file for controlling interactions between TAHelperModel and TAHelperUI */

$(init);

/* Global variable */
var taHelper;

function init() {
  var courseInfo = $.get("../json/dataDev.json");    // replace with file location with for student and TA data
  var taInfo = $.get("./iam.php");   // replace with file location for PHP permissions

  $.when(courseInfo, taInfo).done((courseInfo, taInfo) => {
    taHelper = new TAHelper(courseInfo, taInfo);
    taHelper.load();
  });
}

class TAHelper {

  /* Class constructor */
  constructor (courseInfo, taInfo) {
    this.courseInfo = courseInfo;
    this.taInfo = taInfo;
    // console.log(this.courseInfo, this.taInfo)
  }


  /* Loads the initial page */
  load() {
    var model = $.get("./js/TAHelperModel.js");
    var ui = $.get("./js/TAHelperUI.js");

    // init instances of TAHelperModel and TAHelperUI
    $.when(model, ui).done(() => {
      this.model = new TAHelperModel(this.courseInfo, this.taInfo);

      var taGroupInfo = this.model.taGroupInfo;
      var taStudGroups = this.model.taStudGroups;
      this.ui = new TAHelperUI(taGroupInfo, taStudGroups);

      console.log(this.model, this.ui)

      this.ui.showTAGroups();
      this.ui.addBackBtn();
      this.ui.addDropdownMenu();
      this.ui.postAnnouncement();

      // install an event listener to be triggered when a student has been selected
      $('#group_divs').on('student:clicked', (evt, studInfo) => {
        // console.log(studInfo)
        this.loadForm("student", studInfo[0], studInfo[1]); // [0] = student name, [1] = group id
      });

      // install an event listener to be triggered when group evaluations button is selected
      $('#right_menu').on('request:evaluations', (evt, groupID) => {
        // console.log(groupID)
        this.loadForm("group", null, groupID);
      });

      // install an event listener to be triggered when a download request is made
      $('#right_menu').on('request:download', (evt, data) => {
        var type = data.type;
        var groups = data.groupInfo.Group;
        // console.log(data, type, groups)
        if (type == "all") {
          this.makeRequest("download", "student", groups).then(()=> this.makeRequest("download", "group", groups));
        } else {
          this.makeRequest("download", type, groups);
        }
      });

      // install an event listener to be triggered when a clear request is made
      $('#right_menu').on('request:clear', (evt, data) => {
        var type = data.type;
        var groups = data.groupInfo.Group;
        // console.log(data, type, groups)
        if (type == "all") {
          this.makeRequest("clear", "student", groups).then(()=> this.makeRequest("clear", "group", groups));
        } else {
          this.makeRequest("clear", type, groups);
        }
      });
    });
  }


  /* Initializes or retrieves a new or existing form */
  loadForm (type, studentName, groupID) {
    // console.log(type, studentName, groupID)
    var url = (type == "student") ?
      `responseInfo.php?type=${type}&filename=Group${groupID}_${studentName}` :
      `responseInfo.php?type=${type}&filename=Group${groupID}`;

    $.getJSON(url).done(result => {
      console.log(result, result.formData)

      // check for existing form data
      if (result.formData != null) {
        result = result.formData;
      }

      // set ui template
      switch (type) {
        case "student":
          this.ui.setQuesTemplate(result);
          this.ui.showStudentInfo(studentName, groupID);
          break;
        case "group":
          this.ui.setEvalTemplate(result);
          this.ui.showGroupEval(groupID);
          break;
        default:
          console.log("Invalid type: ", type)
      }

      // add event listeners to UI elements
      var id = (type == "student") ? studentName : "group-evaluations";

      $(`#${id} input`).on('input change', (evt)=> {
        var className = $(evt.currentTarget).attr("class");
        var value = $(evt.currentTarget).val();

        if (evt.type == 'change') {
          this.updateUI(type, className, value);
          this.sendQuestionnaire(url, result);
        }
      });

      $(`#${id} textarea`).on('change blur', (evt)=> {
        var className = $(evt.currentTarget).attr("class");
        var value = $(evt.currentTarget).val();
        this.updateUI(type, className, value);
        this.sendQuestionnaire(url, result);
      });
    });
  }


  /* Makes a download or clear request for responses in the database */
  makeRequest (request, type, groupInfo) {
    // console.log(request, type)
    var url = `csvInfo.php?request=${request}&type=${type}`;

    var taGroups = [];
    $.each(groupInfo, function(i) {
      var groupID = groupInfo[i].id;
      taGroups.push(groupID);
    });

    return $.post(url, {groups: taGroups}).done(result => {
      // console.log(result)
      if (request == "download") {
        var hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(result);
        hiddenElement.target = '_blank';
        hiddenElement.download = `${type} Evaluations.csv`;
        hiddenElement.click();
      }
    });
  }


  /* Update form UI to correctly reflect changes to data */
  updateUI (type, question, val) {
    if (question == "Comments") {
      question = question.split('-')[0];
    }

    switch (type) {
      case "student":
        this.ui.setQuesHTML(question, val);
        break;
      case "group":
        this.ui.setEvalHTML(question, val);
        break;
      default:
        console.log("Invalid form type: ", type)
    }
  }


  /* Post updated results to student's copy of questionnaire */
  sendQuestionnaire (url, form) {
    $.post(url, { data: form });
  }

}
