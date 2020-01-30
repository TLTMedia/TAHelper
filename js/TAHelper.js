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

      // install an event listener to be triggered when a student has been selected
      $('#group_divs').on('student:clicked', (evt, studInfo) => {
        this.loadStudForm(studInfo[0], studInfo[1]);
      });
    });
  }


  /* Retrieves or intializes selected student's copy of questionnaire */
  loadStudForm (studentName, groupID) {
    // var hexID = this.model.getStudsInGroup(groupID).filter(stud => stud.Name == studentName)[0].hexID;
    // var url = `questionInfo.php?studentName=${studentName}_${hexID}`;
    var url = `questionInfo.php?studentName=Group${groupID}_${studentName}`;

    $.getJSON(url).done(result => {
      // console.log(result, result.formData)
      if (result.formData != null) {
        this.ui.setTemplate(result.formData); // show existing form data
      } else {
        this.ui.setTemplate(result);  // set UI template for new form
      }
      // this.ui.setTemplate(result.formData);
      this.ui.showStudentInfo(studentName, groupID);

      // add event listeners to UI elements
      $(`#${studentName} input`).on('input change', (evt)=> {
        var className = $(evt.currentTarget).attr("class");
        var value = $(evt.currentTarget).val();

        if (evt.type == 'change') {
          this.updateUI(className, value);
          this.sendQuestionnaire(url, result);
        }
      })

      $(`#${studentName} textarea`).on('change blur', (evt)=> {
        var className = $(evt.currentTarget).attr("class");
        var value = $(evt.currentTarget).val();
        this.updateUI(className, value);
        this.sendQuestionnaire(url, result);
      });
    });
  }


  /* Update the form UI to correctly reflect changes to data */
  updateUI (question, val) {
    if (question == 'Comments') {
      this.ui.setHTML(question, val);
    } else {
      this.ui.setHTML(question.split('-')[0], val);
    }
  }


  /* Post updated results to student's copy of questionnaire */
  sendQuestionnaire (url, form) {
    $.post(url, { data: form });
  }

}
