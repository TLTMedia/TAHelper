/* JavaScript file for handling UI in TAHelper */

class TAHelperUI {
  constructor (userInfo, studInfo) {
    this.userInfo = userInfo;
    this.studInfo = studInfo;
    // console.log(this.userInfo, this.studInfo)
  }

  /* Add menu options to the top of the page */
  initMenu() {
    this.addBackBtn();
    this.addDropdownMenu();
  }

  /* Displays the starting page that user sees when logged in */
  showHomePage() {
    return new Promise((resolve, reject) => {
      var role = this.userInfo.Type;
      // console.log(role)
      switch (role) {
        case "Professor":
        case "GTA":
          // TODO: show all sessions and groups
          // this.postAnnouncement();
          this.showSessions();
          break;
        case "Group Facilitator":
          // TODO: only show sessions and groups they are in charge of
          this.showSessionGroups();
          break;
        default:
          console.log("Invalid role: ", role)
      }

      this.initMenu();
      resolve("done");
    });
  }


  /* Displays all of the sessions that the user is responsible for */
  showSessions() {
    var sessions = new Set(this.userInfo.Group.map(id => id.split('-')[0]));
    var sessionDivs = Array.from(sessions).map(key => $('<div/>', {
      id: `${key}`,
      class: `session card-item flexChildren`
    }).append($('<div/>', {
      class: `flexText header-font`,
      html: `Session ${key}`
    })).click(evt => this.handleClickEvent($(evt.currentTarget))));

    this.hideBackBtn();
    this.addToParentById("content" /* parent container */, sessionDivs);
  }


  /* Displays all of the groups that the user is responsible for */
  showSessionGroups (sessionID=null) {
    var role = this.userInfo.Type;
    if (role == "Professor" || role == "GTA") {
      this.showBackBtn();
    }

    var groups = (sessionID) ? this.userInfo.Group.filter(key => key.split('-')[0] == sessionID) : this.userInfo.Group;
    var groupDivs = groups.map(key => $('<div/>', {
      id: `${key}`,
      class: `session-group card-item flexChildren`
    }).append($('<div/>', {
      class: `flexText subheader-font subtitle-color`,
      html: `Session ${key.split('-')[0]}`
    }), $('<div/>', {
      class: `flexText header-font`,
      html: `Group ${key.split('-')[1]}`
    })).click(evt => this.handleClickEvent($(evt.currentTarget))));

    this.addToParentById("content" /* parent container */, groupDivs);
  }


  /* Displays all of the students in the group */
  showStudsInGroup (groupID) {
    var groupInfo = this.studInfo.filter(grp => grp.length > 0 && grp[0].Group == groupID)[0];
    // console.log(groupInfo);
    if (groupInfo == undefined) { // no students in the selected group
      this.showNoStudLabel(groupID);
      return;
    }

    // include link to group evaluation form
    if ($('#group-evaluation-link').length == 0) {
      this.addGroupEvalLink(groupID);
    }

    var studDivs = groupInfo.map(i => $('<div/>', {
      id: `${i.hexID}`,
      // "data-hexID":`${i.hexID}`,
      class: `student subcard-item flexChildren`,
    }).append($('<img/>', {
      class: `profile`,
      src: `images/${i.Name + "," + i.hexID}.jpg`,
      onerror: `this.src='images/no-image-available.jpg'` // alt image if none found
    }), $('<div/>', {
      class: `studentInfo flexText subheader-font`,
      html: `${i.Name.replaceAll('_', ' ')}`  // replaces all underscore with spaces
    })).click(evt => this.handleClickEvent($(evt.currentTarget))));

    this.addToParentById(groupID, studDivs);
  }


  /* Displays student questionnaire form */
  showStudForm (template, studentID) {
    // TODO: group evaluation div takes a while to disappear
    $('#group-evaluation-div').remove();
    this.addToParentById(studentID, this.makeForm("student", template));
  }


  /* Displays group evaluation questions and responses */
  showGroupForm (template, groupID) {
    $('#group-evaluation-div').remove();
    this.addToParentById(groupID, this.makeForm("group", template));
  }


  /* Creates and returns a questionnaire form using the given template */
  makeForm (type, template) {
    // console.log(type, template)
    var formType = (type == "student") ? "stud-eval" : "group-eval";
    var formElements = template.map((data, i) => $('<div/>', {
      id: `question-${i}`, // question-[questionID]
      class: `form-element ${data["Type"]}`
    }).append(...this.makeFormInput(`${formType}-${i}`, data)));

    var saveDiv = $('<div/>', {
      id: `form-save-div`
    }).append($('<label/>', { // initially hidden until user saves form
      id: `form-saved-label`,
      for: `form-save-button`,
      html: `All changes have been saved.`
    }).hide(), $('<button/>', {
      id: `form-save-button`,
      class: `save-button`,
      html: `Save`
    }).click(evt => this.handleSaveRequest()));

    var form = $('<form/>', {
      class: (type == "group") ? `group-form` : ``,
      onsubmit: "return false" /* call handler instead */
    });

    form.append(formElements, saveDiv);
    return form;
  }

  /* Constructs and returns a DOM element with the given tag, options, and any other data necessary */
  makeFormInput (questionID, data) {
    const inputTypes = {
      "TB": "text",
      "TA": "textarea",
      "SC": "radio",
      "MC": "checkbox"
    };

    var question = data["Question"];
    var questionType = data["Type"];
    var options = data["Answer Choices"];
    // console.log(questionID, question, questionType, options)
    
    switch (questionType) {
      case "SC": case "MC":
        let optionElements = Object.values(options).map((opt, i) => {
          return $('<input/>', {
            id: `${questionID}-${i}`, // question-[questionID]-[optionNumber]
            type: inputTypes[questionType],
            name: questionID,
            checked: (opt == data["Value"])
          }).add($('<label/>', {
            class: `form-option`,
            for: `${questionID}-${i}`,
            html: opt
          }));
        });

        // console.log(optionElements)
        return (
          $('<fieldset/>').append(
            $('<legend>', {
              class: `question-label`,
              html: question
          }), optionElements)
        );
      case "TA":
        let textarea = $('<textarea/>', {id: `${questionID}-${question}`});
        textarea.html(data["Value"]);

        return (
          $('<label/>', {
            class: `question-label`,
            for: `${questionID}-${question}`,
            html: question
          }).add(textarea)
        );
      default:
        console.log("Unknown question type: ", questionType);
        return null;
    }
  }


  // /* Post an announcement in the header */
  // postAnnouncement() {
  //   var d = new Date();
  //   var month = d.getMonth()+1;
  //   var day = d.getDate();
  //   var formatDate = d.getFullYear() + '-' + (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day;
  //   console.log(formatDate);

  //   var text = $('<text/>', {
  //     html: `Evaluations will be cleared on `
  //   });

  //   var date = $('<input/>', {
  //     type: `datetime-local`,
  //     value: `${formatDate}`,
  //   });

  //   this.addToParentById('header' /* parent container */, text);
  //   this.addToParentById('header' /* parent container */, date);
  // }


  /* Handles click event when a group is selected */
  handleClickEvent (clickedItem) {
    // console.log(clickedItem)
    clickedItem.off("click"); // removes click event listener to prevent registering multiple clicks

    var clickedID = clickedItem.attr("id");
    var clickedClass = clickedItem.attr("class").split(' ')[0];
    console.log(clickedID, clickedClass);
    switch (clickedClass) {
      case "session":
        this.removeItemsByClass(clickedClass);
        this.showSessionGroups(clickedID);
        this.showBackBtn();
        break
      case "session-group":
        let clickedSubheaderText = $(clickedItem.children()[0]);
        let clickedHeaderText = $(clickedItem.children()[1]);
        let text = clickedSubheaderText.html() + " | " + clickedHeaderText.html();
        clickedHeaderText.html(text);
        clickedHeaderText.addClass("header-width");
        clickedSubheaderText.remove();

        this.expandCardItem(clickedItem);
        this.removeItemsByClass(clickedClass, clickedID);
        this.showStudsInGroup(clickedID);
        break
      case "student":
        let clickedProfile = $(clickedItem.children()[0]);
        // let clickedInfo = $(clickedItem.children()[1]);
        // console.log(clickedProfile, clickedInfo)
        clickedProfile.addClass("profile-left");

        this.expandCardItem(clickedItem);
        this.removeItemsByClass(clickedClass, clickedID);

        // let studentName = $(clickedItem.children()[1]).html().replaceAll(' ','_').replaceAll('\'','-'); // students might have names with special characters
        // let groupID = $(clickedItem.parent()).attr("id");
        // console.log(studentName, groupID);
        // $("#content").trigger('student:clicked', [clickedID, groupID]);  // notify TAHelper that a student has been selected
        $("#content").trigger('request:student-eval', [this.userInfo.netID, clickedID]);  // notify TAHelper that a student has been selected
        break
      default:
        console.log("Invalid class: " + clickedClass)
    }
  }


  /* Handles click event for save button */
  handleSaveRequest() {
    // TODO: somehow this is being triggered when visible label is clicked
    $("#form-saved-label").hide(); // hides saved label until changes have been saved

    var changes = [];
    $('.form-element').map((_, question) => {
      var questionType = $(question).attr("class").split(' ')[1];
      switch (questionType) {
        case "SC": case "MC":
          let inputGroup = $(question).find("input");
          let inputGroupName = $(inputGroup[0]).attr("name");
          let checked = $(`input[type=radio][name=${inputGroupName}]:checked`).next().html();

          // console.log(checked)
          // if (checked == undefined) {
          //   alert("An answer must be provided for all multiple choice questions.");
          //   return;
          // }
          changes.push((checked != undefined) ? checked : "");
          break
        case "TA":
          let textarea = $(question).find("textarea");
          let text = textarea.val();
          changes.push(text);
          break
        default:
          console.log("Unknown question type: ", questionType);
          return;
      }
    });
    // console.log(changes)

    // add form details to data needed to be sent over to TAHelper
    var data = {"details": null, "data": changes};
    var selected = ($('.selected-student').length > 0) ? $('.selected-student') : $('.selected-group');
    var formID = selected.attr("id");
    var formType = selected.attr("class").split(' ')[0];
    if (formType == "student") {
      var groupID = selected.parent().attr("id");
      var group = this.studInfo.filter(grp => grp.filter(stud => stud.Group == groupID).length > 0)[0];
      var studDetails = group.filter(stud => stud.hexID == formID)[0];
      // console.log(studDetails)
      data["details"] = studDetails;
    } else { // session-group
      formType = formType.split('-')[1];
      data["details"] = {"Group": formID};
    }

    // notify TAHelper that form has been changed and save request was made
    $('#content').trigger('request:save-eval', [formType, formID, this.userInfo.netID, data]);
  }


  /* Handles click event for back button */
  handleBackRequest() {
    var selectedStudent = $('.selected-student');
    var selectedGroup = $('.selected-group');
    var selectedGrpID = selectedGroup.attr("id");
    // console.log(selectedStudent, selectedGroup, selectedGrpID)

    // determine which page to backtrack to
    if (selectedStudent.length == 0) {
      var selectedGroup = $('.selected-group');
      if (selectedGroup.length == 0) { // backing up from all groups to all sessions
        this.removeItemsByClass("session-group");
        this.showSessions();
      } else {
        // check for group evluation form
        var groupForm = $('.group-form');
        if (groupForm.length == 0) { // backing up from selected group to all groups
          selectedGroup.remove();
          var selectedSessionID = selectedGrpID.split('-')[0];
          this.showSessionGroups(selectedSessionID);
        } else { // backing up from group evaluation form to students in selected group
          groupForm.remove();
          this.showStudsInGroup(selectedGrpID);
        }        
      }
    } else { // backing up from selected student to students in selected group
      selectedStudent.remove();
      this.showStudsInGroup(selectedGrpID);
    }
  }


  /* Handles click event for group evaluation button */
  handleGroupEvalRequest (groupID) {
    $('.student').fadeOut(300 /* smooth animation */, () => {
      this.removeItemsByClass("student");
      $('#group-evaluation-div').addClass("group");
    });

    // notify TAHelper that user is requesting for the group evaluation form
    $('#content').trigger('request:group-eval', [this.userInfo.netID, groupID]);
  }


  /* Handles click event for download button */
  handleDownloadRequest() {
    // $('#right-menu').trigger('request:download', {type: "all", groupInfo: this.userInfo});
    console.log("Download request was made");

    var modal = $('<div/>', {
      id: 'download-modal',
      class: 'modal'
    });

    this.addToParentById('content' /* parent container */, modal);
  }


  /* Handles click event for clear button */
  handleClearRequest() {
    $('#right-menu').trigger('request:clear', {type: "all", groupInfo: this.userInfo});
  }


  /* Adds a group evaluation link to the selected group page */
  addGroupEvalLink (groupID) {
    var grpEvalLink = $('<a/>', {
      href: `#`,
      id: `group-evaluation-link`,
      html: `Add a Group Evaluation`
    }).click(evt => this.handleGroupEvalRequest(groupID));

    var grpEvalDiv = $('<div/>', {
      id: `group-evaluation-div`
    });

    grpEvalDiv.append(grpEvalLink);
    this.addToParentById(`${groupID}`, grpEvalDiv);
  }

  /* Adds a back button to the top of the page */
  addBackBtn() {
    var backBtn = $('<button/>', { // initially hidden
      id: 'backBtn',
      class: `menu-button`,
      html: 'Back'
    }).click(evt => this.handleBackRequest()).hide();

    this.addToParentById('left-menu' /* parent container */, backBtn);
  }

  /* Adds a dropdown menu to the page */
  addDropdownMenu() {
    var drpdwnBtn = $('<button/>', {
      id: 'dropdownBtn',
      class: `menu-button`,
      html: 'Menu'
    });
    var drpdwnMenu = $('<div/>', {
      id: 'dropdownMenu',
      class: 'dropdown-content'
    });

    // var evalBtn = $('<button/>', {  // initally hidden
    //   id: 'evalBtn',
    //   html: 'Group Evaluation'
    // }).click(evt => this.handleEvaluationRequest());

    var downloadBtn = $('<button/>', {
      id: 'download-responses-button',
      class: 'download-button',
      title: 'Download responses in CSV format',
      html: 'Download Responses'
    }).click(evt => this.handleDownloadRequest());
    var clearBtn = $('<button/>', {
      id: 'clear-responses-button',
      class: 'clear-button',
      title: 'Clear responses',
      html: 'Clear Responses'
    }).click(evt => this.handleClearRequest());

    // var dwnAllSessionBtn = $('<button/>', {  // initally hidden
    //   id: 'dwnAll-session-btn',
    //   class: 'downloadBtn',
    //   html: 'Download All Responses from All Sessions'
    // }).click(evt => this.handleDownloadRequest()).hide();
    // var dwnAllGroupBtn = $('<button/>', {  // initally hidden
    //   id: 'dwnAll-group-btn',
    //   class: 'downloadBtn',
    //   html: 'Download All Responses from All Groups in Current Session'
    // }).click(evt => this.handleDownloadRequest()).hide();
    // var dwnAllBtn = $('<button/>', {  // initally hidden
    //   id: 'dwnAllBtn',
    //   class: 'downloadBtn',
    //   html: 'Download All Responses for All TAs'
    // }).click(evt => this.handleDownloadRequest()).hide();
    // var dwnGroupBtn = $('<button/>', {  // initally hidden
    //   id: 'dwnGroupBtn',
    //   class: 'downloadBtn',
    //   html: 'Download All Responses for this Group'
    // }).click(evt => this.handleDownloadRequest()).hide();

    var role = this.userInfo.Type;
    if (role == "Professor" || role == "GTA") {
      // drpdwnMenu.append(dwnAllBtn, dwnTABtn, dwnGroupBtn, clearBtn);
      drpdwnMenu.append(downloadBtn, clearBtn);
    } else {
      // drpdwnMenu.append(dwnAllBtn, dwnTABtn, dwnGroupBtn);
      console.log(role)
    }

    // dropdownMenu.append(evalBtn, dwnAllBtn, dwnTABtn, dwnGroupBtn, clearBtn);
    this.addToParentById('right-menu' /* parent container */, drpdwnBtn);
    this.addToParentById('right-menu' /* parent container */, drpdwnMenu);
  }
  
  /* Notifies the user that there are no students in the selected group */
  showNoStudLabel (groupID) { 
    var noStudLabel = $('<label/>', {
      id: `no-students-label`,
      html: `No students in this group`
    });
    this.addToParentById(`${groupID}`, noStudLabel);
  }

  /* Notifies the user that form has been saved to database */
  showSavedLabel() { $("#form-saved-label").show(); }

  /* Turns back button visible or invisible */
  showBackBtn() { $('#backBtn').show(); }
  hideBackBtn() { $('#backBtn').hide(); }

  /* Turns left menu button visible or invisible */
  showDropdownBtn() { $('#dropdownBtn').show(); }
  hideDropdownBtn() { $('#dropdownBtn').hide(); }

  /* Turns download button visible or invisible */
  showDownloadAllBtn() { $('#dwnAllBtn').show(); }
  hideDownloadAllBtn() { $('#dwnAllBtn').hide(); }

  /* Turns download button visible or invisible */
  showDownloadTABtn() { $('#dwnTABtn').show(); }
  hideDownloadTABtn() { $('#dwnTABtn').hide(); }

  /* Turns download button visible or invisible */
  showDownloadGroupBtn() { $('#dwnGroupBtn').show(); }
  hideDownloadGroupBtn() { $('#dwnGroupBtn').hide(); }

  /* Adds child to parent div specified by ID */
  addToParentById (divID, child) {
    $(`#${divID}`).append(child);
  }

  /* Adds child to parent div specified by class */
  addToParentByClass (divClass, child) {
    $(`.${divClass}`).append(child);
  }

  /* Removes all items with the same class name. An optional argument for an exception can be provided. */
  removeItemsByClass (className, exceptID=null) {
    // console.log(exceptID)
    for (var i of $(`.${className}`)) {
      if ( $(i).attr("id") != exceptID) {
        $(i).remove();
      }
    }
  }

  /* Expands selected item to window size and hide all other items in same class */
  expandCardItem (item) {
    item.parent().animate({ display: "block" });
    item.removeClass("flexChildren").addClass("flexContainer");
    item.animate({ height: "100%" });

    // var itemID = item.attr("id");
    var itemClass = item.attr("class").split(" ")[0];
    switch (itemClass) {
      case "session-group":
        item.addClass("selected-group");
        break;
      case "student":
        item.addClass("selected-student");
        break;
      default:
        console.log("Unexpected call for expandCardItem() on HTML DOM element with class: ", itemClass);
        return;
    }
  }

}
