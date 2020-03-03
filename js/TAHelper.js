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
        this.loadStudForm(studInfo[0], studInfo[1]);
      });

      // install an event listener to be triggered when group evaluations button is selected
      $('#right_menu').on('request:evaluations', (evt, groupID) => {
        this.loadEvalForm(groupID);
      });

      // install an event listener to be triggered when a download request is made
      $('#right_menu').on('request:download', (evt, groupInfo) => {
        // console.log(groupInfo.Group)
        this.downloadResponses("Student", groupInfo.Group).then(()=> this.downloadResponses("Group", groupInfo.Group));
      });

      // install an event listener to be triggered when a clear request is made
      $('#right_menu').on('request:clear', evt => {
        this.clearResponses();
      });
    });
  }


  /* Retrieves or intializes selected student's copy of questionnaire */
  loadStudForm (studentName, groupID) {
    var url = `responseInfo.php?type=Student&filename=Group${groupID}_${studentName}`;

    $.getJSON(url).done(result => {
      // console.log(result, result.formData)
      if (result.formData != null) {
        this.ui.setQuesTemplate(result.formData); // show existing form data
      } else {
        this.ui.setQuesTemplate(result);  // set UI template for new form
      }
      // this.ui.setQuesTemplate(result.formData);
      this.ui.showStudentInfo(studentName, groupID);

      // add event listeners to UI elements
      // console.log($(`#${studentName} input`))
      $(`#${studentName} input`).on('input change', (evt)=> {
        var className = $(evt.currentTarget).attr("class");
        var value = $(evt.currentTarget).val();

        if (evt.type == 'change') {
          this.updateQuesUI(className, value);
          this.sendQuestionnaire(url, result);
        }
      });

      $(`#${studentName} textarea`).on('change blur', (evt)=> {
        var className = $(evt.currentTarget).attr("class");
        var value = $(evt.currentTarget).val();
        this.updateQuesUI(className, value);
        this.sendQuestionnaire(url, result);
      });
    });
  }


  /* Retrieves or initializes group evaluation form */
  loadEvalForm (groupID) {
    var url = `responseInfo.php?type=Group&filename=Group${groupID}`;

    $.getJSON(url).done(result => {
      // console.log(result);

      // set UI template for evaluation form
      this.ui.setEvalTemplate(result);
      this.ui.showGroupEval(groupID);

      // add event listeners to UI elements
      $('#group-evaluations input').on('input change', (evt)=> {
        var className = $(evt.currentTarget).attr("class");
        var value = $(evt.currentTarget).val();

        if (evt.type == 'change') {
          this.updateEvalUI(className, value);
          this.sendQuestionnaire(url, result);
        }
      });

      $('#group-evaluations textarea').on('change blur', (evt)=> {
        var className = $(evt.currentTarget).attr("class");
        var value = $(evt.currentTarget).val();
        this.updateEvalUI(className, value);
        this.sendQuestionnaire(url, result);
      });
    });
  }


  /* Organizes and exports responses to a CSV file */
  downloadResponses (type, groupInfo) {
    var url = `csvInfo.php?type=${type}`;

    var taGroups = [];
    $.each(groupInfo, function(i) {
      var groupID = groupInfo[i].id;
      taGroups.push(groupID);
    });

    return $.post(url, {groups: taGroups}).done(result => {
      // console.log(result)
      var hiddenElement = document.createElement('a');
      hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(result);
      hiddenElement.target = '_blank';
      hiddenElement.download = `${type} Evaluations.csv`;
      hiddenElement.click();
    });
  }


  /* Deletes all students and group evaluation responses from database */
  clearResponses() {
    console.log("request to clear responses")
  }


  /* Update the questionnaire form UI to correctly reflect changes to data */
  updateQuesUI (question, val) {
    if (question == 'Comments') {
      this.ui.setQuesHTML(question, val);
    } else {
      this.ui.setQuesHTML(question.split('-')[0], val);
    }
  }


  /* Update the evaluation form UI to correctly reflect changes to data */
  updateEvalUI (question, val) {
    if (question == 'Comments') {
      this.ui.setEvalHTML(question, val);
    } else {
      this.ui.setEvalHTML(question.split('-')[0], val);
    }
  }


  /* Post updated results to student's copy of questionnaire */
  sendQuestionnaire (url, form) {
    $.post(url, { data: form });
  }

}
