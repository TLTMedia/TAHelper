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
        $('#content').on('request:student-eval', (evt, evaluatorID, studentID) => {
          // console.log(evaluatorID, studentID)
          this.loadForm("student", studentID, evaluatorID);
        });

        // install an event listener to be triggered when a student has been selected
        $('#content').on('request:group-eval', (evt, evaluatorID, groupID) => {
          this.loadForm("group", groupID, evaluatorID);
        });

        // install an event listener to be triggered when a save button is clicked
        $('#content').on('request:save-eval', (evt, formType, formID, evaluatorID, data) => {
          console.log(evaluatorID, formID, formType, data)
          this.updateForm(formType, formID, evaluatorID, data);
        });

        // // install an event listener to be triggered when group evaluations button is selected
        // $('#right-menu').on('request:evaluations', (evt, groupID) => {
        //   // console.log(groupID)
        //   this.loadForm("group", null, groupID);
        // });

        // // install an event listener to be triggered when a download request is made
        // $('#right-menu').on('request:download', (evt, data) => {
        //   var type = data.type;
        //   var groups = data.groupInfo.Group;
        //   // console.log(data, type, groups)
        //   if (type == "all") {
        //     this.makeDownloadRequest("download", "student", groups).then(()=> this.makeDownloadRequest("download", "group", groups));
        //   } else {
        //     this.makeDownloadRequest("download", type, groups);
        //   }
        // });

        // // install an event listener to be triggered when a clear request is made
        // $('#right-menu').on('request:clear', (evt, data) => {
        //   var type = data.type;
        //   var groups = data.groupInfo.Group;
        //   // console.log(data, type, groups)
        //   if (type == "all") {
        //     if (confirm("Are you sure you would like to clear all responses?")) {
        //       this.makeDownloadRequest("clear", "student", groups).then(()=> this.makeDownloadRequest("clear", "group", groups));
        //       alert("All student evaluation responses have been cleared.");
        //       location.reload();  // reloads page, brings user back to the home page
        //     }
        //   }
        //   // else {
        //   //   this.makeDownloadRequest("clear", type, groups);
        //   // }
        // });
      });
    });
  }


  /* Initializes or retrieves a new or existing form */
  loadForm (type, id, evaluatorID) {
    var datetime = this.getCurrentDate();
    var filename = `${datetime}_${evaluatorID}_${id}`;
    var url = `responseInfo.php?type=${type}&filename=${filename}`;

    console.log(url)
    $.getJSON(url).done(result => {
      // console.log(result)
      switch (type) {
        case "student":
          this.ui.showStudForm(result, id);
          break
        case "group":
          this.ui.showGroupForm(result, id);
          break
        default:
          console.log("Invalid form type: ", type)
          return;
      }
    });
  }


  /* Post updated form results to the appropriate file in database */
  updateForm (type, id, evaluatorID, data) {
    var datetime = this.getCurrentDate();
    var filename = `${datetime}_${evaluatorID}_${id}`;
    var url = `responseInfo.php?type=${type}&filename=${filename}`;

    $.post(url, { data: data }).done(() => {
      this.ui.showSavedLabel(); // notify user that changes have been saved to database
    }).fail(() => {
      console.log("Failed to update form");
    });
  }


  /* Makes a download or clear request for responses in the database */
  makeDownloadRequest (request, type, groupInfo) {
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

  /* Returns the current date in YYYY-MM-DD string format */
  getCurrentDate() {
    var datetime = new Date();
    let year = datetime.getFullYear();
    let month = (datetime.getMonth()+1 < 10) ? `0${datetime.getMonth()+1}` : datetime.getMonth()+1;
    let date = (datetime.getDate() < 10) ? `0${datetime.getDate()}` : datetime.getDate();
    return `${year}-${month}-${date}`;
  }

}
