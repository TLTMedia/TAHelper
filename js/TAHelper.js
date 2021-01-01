/*** Javascript file for controlling interactions between TAHelperModel and TAHelperUI ***/

class TAHelper {
  constructor (courseInfo, loginInfo) {
    this.courseInfo = courseInfo[0];
    this.loginInfo = loginInfo[0];
    // console.log(this.courseInfo, this.loginInfo)
  }

  load() {
    // load model and gui scripts
    var model = $.get("./js/TAHelperModel.js");
    var ui = $.get("./js/TAHelperUI.js");

    $.when(model, ui).done(() => {
      this.model = new TAHelperModel(this.courseInfo, this.loginInfo);
      
      var user = this.model.getLoginName();
      var userInfo = this.model.getUserInfo(user);
      var studInfo = this.model.getAllStudsForUser(user);
      this.ui = new TAHelperUI(userInfo, studInfo);
      console.log(this.model, this.ui)

      this.ui.showHomePage().then(done => {
        // install an event listener to be triggered when a student has been selected
        $('#content').on('student:clicked', (evt, studName, groupID) => {
          // console.log(studInfo, groupID)
          this.loadForm("student", studName, groupID); // [0] = student name, [1] = group id
        });

        // install an event listener to be triggered when group evaluations button is selected
        $('#right-menu').on('request:evaluations', (evt, groupID) => {
          // console.log(groupID)
          this.loadForm("group", null, groupID);
        });

        // install an event listener to be triggered when a download request is made
        $('#right-menu').on('request:download', (evt, data) => {
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
        $('#right-menu').on('request:clear', (evt, data) => {
          var type = data.type;
          var groups = data.groupInfo.Group;
          // console.log(data, type, groups)
          if (type == "all") {
            if (confirm("Are you sure you would like to clear all responses?")) {
              this.makeRequest("clear", "student", groups).then(()=> this.makeRequest("clear", "group", groups));
              alert("All student evaluation responses have been cleared.");
              location.reload();  // reloads page, brings user back to the home page
            }
          }
          // else {
          //   this.makeRequest("clear", type, groups);
          // }
        });
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
      // console.log(result, result.formData)
      // check for existing form data (null means no previous form data was saved)
      if (result.formData != null) {
        result = result.formData;
      }

      // set ui template
      switch (type) {
        case "student":
          this.ui.setQuesTemplate(result);
          this.ui.showStudForm(studentName, groupID);
          break;
        case "group":
          this.ui.setEvalTemplate(result);
          this.ui.showGroupForm(groupID);
          break;
        default:
          console.log("Invalid type: ", type)
          return;
      }

      // add event listeners to UI elements
      // var id = (type == "student") ? studentName : "group-evaluations";

      $(`#questionnaire input`).on('input change', evt => {
        let parent = $(evt.currentTarget.parentNode);
        var className = parent.attr("id").split('-')[1];
        className = className.charAt(0).toUpperCase() + className.slice(1); // capitalizing first letter

        var value = $(evt.currentTarget).val();
        // console.log(className, value)

        if (evt.type == 'change') {
          this.updateUI(type, className, value);
          this.sendQuestionnaire(url, result);
        }
      });

      $(`#questionnaire textarea`).on('change blur', evt => {
        let parent = $(evt.currentTarget.parentNode);
        var className = parent.attr("id").split('-')[1];
        className = className.charAt(0).toUpperCase() + className.slice(1); // capitalizing first letter

        var value = $(evt.currentTarget).val();
        // console.log(className, value)

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
        var capType = type.substr(0,1).toUpperCase() + type.substr(1).toLowerCase();
        var hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(result);
        hiddenElement.target = '_blank';
        hiddenElement.download = `${capType} Evaluations.csv`;
        hiddenElement.click();
      }
    });
  }


  /* Update form UI to correctly reflect changes to data */
  updateUI (type, question, val) {
    this.ui.setValue(type, question, val);
  }


  /* Post updated results to student's copy of questionnaire */
  sendQuestionnaire (url, form) {
    $.post(url, { data: form });
  }

}
