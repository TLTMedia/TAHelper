/* JavaScript file for handling data in TAHelper */

$(init);

/* Global variable */
var taHelper;

function init() {
  var courseInfo = $.get("../json/dataDev.json");    // replace with file location with for student and TA data
  var taInfo = $.get("iam.php");   // replace with file location for php actions
  $.when(courseInfo, taInfo).done( (courseInfo, taInfo) => {
    taHelper = new TAHelper(courseInfo,taInfo);
    taHelper.loaded();
  });
}

class TAHelper {

  /* Class constructor */
  constructor (courseInfo, taInfo) {
    this.courseInfo = courseInfo[0];
    this.taInfo = taInfo[0];
    // console.log(this.courseInfo, this.taInfo)
  }

  /* Returns information on all of the groups that the TA oversees */
  getTAGroupsInfo (taName) {
    return this.courseInfo["TA Groups"][taName];
  }


  /* Returns information on all of the students in the course */
  getStudGroupsInfo() {
    return this.courseInfo["Student Groups"];
  }


  /* Returns array of all of the students in the same group as the specified TA */
  getTAStudGroups (taName) {
    var groupInfo = this.getTAGroupsInfo(taName);
    return groupInfo.Group.map(i => this.getStudGroup(i.id, this.courseInfo["Student Groups"]));
  }


  /* Returns array of students groups */
  getStudGroup (groupID, studentGroups) {
    return Object.keys(studentGroups)
      .filter((item) => { return studentGroups[item].Group == groupID })
      .map((item) => Object.assign( {hexID: item}, studentGroups[item] ));
  }


  /* Returns array of students in group */
  getStudsInGroup (groupID) {
    return this.taStudGroups.filter(i => i[0].Group == groupID)[0];
  }


  /* Loads the initial page */
  loaded() {
    var taName = `${this.taInfo.nickname} ${this.taInfo.sn}`.replace(/ /g,"_"); // replaces all spaces with underscore
    this.taGroupInfo = this.getTAGroupsInfo(taName);
    this.taStudGroups = this.getTAStudGroups(taName);

    // create a UI instance by fetching script from separate source file
    $.getScript('js/TAHelperUI.js', () => {
      this.ui = new TAHelperUI(this.taGroupInfo, this.taStudGroups);
      this.ui.addBackBtn();
      this.ui.showTAGroups();
    });

    // install an event listener to be triggered when a student has been selected
    $('#group_divs').submit((evt, studInfo) => {
      this.initStudForm(studInfo[0], studInfo[1]);
    });
  }


  /* Retrieves or intializes selected student's copy of questionnaire */
  initStudForm (studentName, groupID) {
    var hexID = this.getStudsInGroup(groupID).filter(stud => stud.Name == studentName)[0].hexID;
    var url = `questionInfo.php?studentName=${studentName}_${hexID}`;

    $.getJSON(url).done(result => {
      this.ui.setTemplate(result);  // set ui template

      // delay for ui to finish loading
      setTimeout(() =>  {
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
        })}, 10);
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
