/* JavaScript file for handling UI in TAHelper */

class TAHelperUI {
  constructor (userInfo, studInfo) {
    this.userInfo = userInfo;
    this.studInfo = studInfo;
    // console.log(this.userInfo, this.studInfo)
  }

  /* Set UI template */
  setQuesTemplate (template) { this.questionTemplate = template; }
  setEvalTemplate (template) { this.evaluationTemplate = template; }

  /* Updates any data changes to questionnaire form */
  setValue (formType, inputType, value) {
    var template = (formType == "student") ? this.questionTemplate : this.evaluationTemplate;
    var formElem = template.find(item => item.class == `${inputType}`);
    if (inputType == 'Comments') {
      formElem.html = value; // textarea
    } else {
      formElem.value = value;
    }
  }

  /* Adds child to parent div specified by ID */
  addToParentById (divID, child) {
    $(`#${divID}`).append(child);
  }

  /* Adds child to parent div specified by class */
  addToParentByClass (divClass, child) {
    $(`.${divClass}`).append(child);
  }


  // /* Updates any data changes to evaluation form */
  // setQuesHTML (inputType, value) {
  //   var formElem = this.questionTemplate.find(item => item.class == `${inputType}`);
  //   // console.log(formElem)
  //   if (inputType == 'Comments') {
  //     formElem.html = value;
  //   } else {
  //     formElem.value = value;
  //   }
  // }
  //
  //
  // /* Updates any data changes to evaluation form */
  // setEvalHTML (inputType, value) {
  //   var formElem = this.evaluationTemplate.find(item => item.class == `${inputType}`);
  //   // console.log(formElem)
  //   if (inputType == 'Comments') {
  //     formElem.html = value;
  //   } else {
  //     formElem.value = value;
  //   }
  // }


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

      this.addMenu();
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
    })).click(evt => { this.handleClickEvent($(evt.currentTarget)) }));

    this.addToParentById("content" /* parent container */, sessionDivs);
  }


  /* Displays all of the groups that the user is responsible for */
  showSessionGroups (sessionID=null) {
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
    })).click(evt => { this.handleClickEvent($(evt.currentTarget)) }));

    this.addToParentById("content" /* parent container */, groupDivs);
  }


  /* Displays all of the students in the group */
  showStudsInGroup (groupID) {
    var groupInfo = this.studInfo.filter(grp => grp.length > 0 && grp[0].Group == groupID)[0];
    // console.log(groupInfo);
    if (groupInfo == undefined) {
      // TODO: alert user somehow
      console.log("Warning: no students in this group");
      return;
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

    // if (this.userInfo.Type == "Group Facilitator") {
    //   this.showDropdownBtn();
    // }

    this.showBackBtn();
    this.showEvalBtn();
    this.addToParentById(`${groupID}`, studDivs);
  }


  /* Displays student questionnaire form */
  showStudForm (studentName, groupID) {
    // make sure that a UI template has been provided, otherwise return error
    if (typeof(this.questionTemplate) == 'undefined') {
      console.log("Please define a UI template first")
      return;
    }

    // $('.profile').addClass('minimize'); // shrink the student picture
    this.addToParentById(studentName, this.makeForm(this.questionTemplate));
  }


  /* Displays group evaluation questions and responses */
  showGroupForm (groupID) {
    // make sure that a UI template has been provided, otherwise return error
    if (typeof(this.evaluationTemplate) == 'undefined') {
      console.log("Please define a UI template first")
      return;
    }

    var evalText = $('<div/>', {
      html: `Group Evaluation`
    }).css({ "padding-left": "20px" }); // override inherited css

    var evalDiv = $('<div/>', {
      class: `student ${groupID} flexContainer`
    }).css({ margin: "0px", "padding-top": "10px" }); // override inherited css

    evalDiv.append(evalText, this.makeForm(this.evaluationTemplate));
    this.addToParentById(`${groupID}`, evalDiv);
  }


  /* Expands selected item to window size and hide all other items in same class */
  expandCardItem (item) {
    item.parent().animate({ display: "block" });
    item.removeClass("flexChildren").addClass("flexContainer");
    item.css("width", "100%");
    item.animate({ height: "100%" });

    // var itemID = item.attr("id");
    var itemClass = item.attr("class").split(" ")[0];
    // console.log(item, itemID, itemClass)
    if (itemClass == "student") {
      item.css({"margin":"0px", "padding-top":"10px"});
    }
  }


  /* Constructs and returns a DOM element with the given tag, options, and any other data necessary */
  makeFormInput (tag, options, data) {
    // console.log(tag)
    var tagTypes = {
      "hidden": "input",
      "radio": "input",
      "textarea": "textarea"
    };

    switch (data.type) {
      case 'radio':
        return options.map(option => $('<input>', {
            type: `radio`,
            name: `${data.class}`,
            value: `${option}`,
            checked: (option == data.value),
          }).add($('<text/>', {
            html: `${option}`
          }))
        );
        break;
      case 'textarea':
        return $(`<${tagTypes[tag]}>`, { html: `${data.html}` });
      default:
        return $(`<${tagTypes[tag]}>`, data);
    }
  }


  /* Creates and returns a questionnaire form using the given template */
  makeForm (template) {
    console.log("making form")
    var formElements = template.map(i => $('<div/>', {
      id: `question-${i.class.toLowerCase()}`,
      class: `form-element`,
    }).append($('<label/>', {
      html: `${i.label}`,
    }), ...this.makeFormInput(i.type, i.options, i)));

    var formDiv = $('<div/>', {
      id: `questionnaire`,
    }).append(...formElements);

    return formDiv;
  }


  /* Post an announcement in the header */
  postAnnouncement() {
    var d = new Date();
    var month = d.getMonth()+1;
    var day = d.getDate();
    var formatDate = d.getFullYear() + '-' + (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day;
    console.log(formatDate);

    var text = $('<text/>', {
      html: `Evaluations will be cleared on `
    });

    var date = $('<input/>', {
      type: `datetime-local`,
      value: `${formatDate}`,
    });

    this.addToParentById('header' /* parent container */, text);
    this.addToParentById('header' /* parent container */, date);
  }


  /* Handles click event when a group is selected */
  handleClickEvent (clickedItem) {
    // console.log(clickedItem)
    clickedItem.off("click"); // removes click event listener to prevent registering multiple clicks

    var clickedID = clickedItem.attr("id");
    var clickedClass = clickedItem.attr("class").split(' ')[0];
    console.log(clickedID, clickedClass);
    switch (clickedClass) {
      case "session":
        this.hideItemsByClass(clickedClass);
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
        this.hideItemsByClass(clickedClass, clickedID);
        this.showStudsInGroup(clickedID);
        break
      case "student":
        this.expandCardItem(clickedItem);
        this.hideItemsByClass(clickedClass, clickedID);

        let studentName = $(clickedItem.children()[1]).html().replaceAll(' ','_').replaceAll('\'','-'); // students might have names with special characters
        let groupID = $(clickedItem.parent()).attr("id");
        console.log(studentName, groupID);
        $("#content").trigger('student:clicked', [studentName, groupID]);  // notify TAHelper that a student has been selected
        break
      default:
        console.log("Invalid class: " + clickedClass)
    }
    
    // if (clickedClass == 'student') {
    //   clickedItem.css({ margin: "0px", "padding-top": "10px" });
    // }

    // var clickedText = $(clickedItem.children()[0]);
    // if (clickedClass == 'session-group') {
    //   clickedText.html(clickedText.html().replace('<br>', ' | '));
    //   clickedText.addClass("flexContainerText");
    // }

    // var clickedGrpID = (clickedClass == 'session-group') ? clickedItem.attr("id") : clickedItem.attr("class").split(" ")[1];
    // if (clickedClass == 'session-group') {
    //   this.showStudsInGroup(clickedGrpID);
    // } else {
    //   var studentName = clickedItem.attr("id");
    //   // console.log(studentName, clickedGrpID);
    //   $("#content").trigger('student:clicked', [studentName, clickedGrpID]);  // notify TAHelper that a student has been selected
    // }

    // clickedItem.removeClass("flexChildren").addClass("flexContainer");
    // this.expandCardItem(clickedItem);
  }


  /* Handles click event for back button */
  handleBackRequest() {
    $('#content').attr("style", "");
    $('#evalBtn').attr("disabled", false); // enables evaluation button

    var formLength = document.getElementsByTagName('input').length;
    if (formLength > 1) { // backing up from student info
      $('.student').remove();

      // crude way of determining which group is selected, contains unique list of class names
      var groupID = $('.session-group.flexContainer').attr("id");
      this.showStudsInGroup(groupID);
    } else {  // backing up from student groups
      $('.session-group').remove();
      this.hideBackBtn();
      this.hideEvalBtn();
      if (this.userInfo.Type != "Group Administrator") {
        this.hideDropdownBtn();
      }
      this.showSessionGroups();
    }
  }


  /* Handles click event for evaluation button */
  handleEvaluationRequest() {
    $('#evalBtn').attr("disabled", true); // prevents request from being sent multiple times
    $('.student').fadeOut(300);  // animated

    // crude way of determining which group is selected, contains unique list of class names
    var groupID = $('.session-group.flexContainer').attr("id");
    $('#right-menu').trigger('request:evaluations', groupID);
  }


  /* Handles click event for download button */
  handleDownloadRequest() {
    $('#right-menu').trigger('request:download', {type: "all", groupInfo: this.userInfo});
  }

  /* Handles click event for clear button */
  handleClearRequest() {
    $('#right-menu').trigger('request:clear', {type: "all", groupInfo: this.userInfo});
  }


  /* Hides all items with the same class name. An optional argument for an exception can be provided. */
  hideItemsByClass (className, exceptID=null) {
    // console.log(exceptID)
    for (var i of $(`.${className}`)) {
      if ( $(i).attr("id") != exceptID) {
        $(i).hide();
      }
    }
  }

  /* Turns left menu button visible or invisible */
  showDropdownBtn() { $('#dropdownBtn').show(); }
  hideDropdownBtn() { $('#dropdownBtn').hide(); }

  /* Turns back button visible or invisible */
  showBackBtn() { $('#backBtn').show(); }
  hideBackBtn() { $('#backBtn').hide(); }

  /* Turns evaluation button visible or invisible */
  showEvalBtn() { $('#evalBtn').show(); }
  hideEvalBtn() { $('#evalBtn').hide(); }

  /* Turns download button visible or invisible */
  showDownloadAllBtn() { $('#dwnAllBtn').show(); }
  hideDownloadAllBtn() { $('#dwnAllBtn').hide(); }

  /* Turns download button visible or invisible */
  showDownloadTABtn() { $('#dwnTABtn').show(); }
  hideDownloadTABtn() { $('#dwnTABtn').hide(); }

  /* Turns download button visible or invisible */
  showDownloadGroupBtn() { $('#dwnGroupBtn').show(); }
  hideDownloadGroupBtn() { $('#dwnGroupBtn').hide(); }


  /* Add menu options to the top of the page */
  addMenu() {
    this.initRightMenu();
    this.initLeftMenu();
  }

  /* Initialize the right menu */
  initRightMenu() {
    this.addDropdownMenu();
  }

  /* Initialize the left menu */
  initLeftMenu() {
    this.addBackBtn();
  }


  /* Adds a back button to the top of the page */
  addBackBtn() {
    var backBtn = $('<button/>', {
      id: 'backBtn',
      class: `menu-button`,
      html: 'Back'
    });

    $(backBtn).hide();  // initially hidden
    $(backBtn).click(evt => this.handleBackRequest());
    this.addToParentById('left-menu' /* parent container */, backBtn);
  }


  /* Adds a dropdown menu to the page */
  addDropdownMenu() {
    var dropdownBtn = $('<button/>', {
      id: 'dropdownBtn',
      class: `menu-button`,
      html: 'Menu'
    });
    var dropdownMenu = $('<div/>', {
      id: 'dropdownMenu',
      class: 'dropdown-content'
    });
    var evalBtn = $('<button/>', {  // initally hidden
      id: 'evalBtn',
      html: 'Group Evaluation'
    }).click(evt => this.handleEvaluationRequest()).hide();
    var dwnAllBtn = $('<button/>', {  // initally hidden
      id: 'dwnAllBtn',
      class: 'downloadBtn',
      html: 'Download Responses for All TAs'
    }).click(evt => this.handleDownloadRequest()).hide();
    var dwnTABtn = $('<button/>', {  // initally hidden
      id: 'dwnTABtn',
      class: 'downloadBtn',
      html: 'Download All Responses for this TA'
    }).click(evt => this.handleDownloadRequest()).hide();
    var dwnGroupBtn = $('<button/>', {  // initally hidden
      id: 'dwnGroupBtn',
      class: 'downloadBtn',
      html: 'Download All Responses for this Group'
    }).click(evt => this.handleDownloadRequest()).hide();
    var clearBtn = $('<button/>', {
      id: 'clearBtn',
      html: 'Clear All Responses'
    }).click(evt => this.handleClearRequest());

    if (this.userInfo.Type == "Group Administrator") {
      dropdownMenu.append(evalBtn, dwnAllBtn, dwnTABtn, dwnGroupBtn, clearBtn);
    } else {
      dropdownMenu.append(evalBtn, dwnAllBtn, dwnTABtn, dwnGroupBtn);
      dropdownBtn.hide();
    }

    // dropdownMenu.append(evalBtn, dwnAllBtn, dwnTABtn, dwnGroupBtn, clearBtn);
    this.addToParentById('right-menu' /* parent container */, dropdownBtn);
    this.addToParentById('right-menu' /* parent container */, dropdownMenu);
  }

}
