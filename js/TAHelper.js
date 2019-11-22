/* JavaScript source code for TAHelper */

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

    this.ui = new TAHelperUI(this.taGroupInfo, this.taStudGroups);
    this.ui.addBackBtn();
    this.ui.showTAGroups();

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



class TAHelperUI {

  /* Class constructor */
  constructor (groupInfo, studInfo) {
    this.groupInfo = groupInfo;
    this.studInfo = studInfo;
    console.log(this.groupInfo, this.studInfo)
  }

  /* Setter function */
  setTemplate (uiTemplate) { this.template = uiTemplate; }

  /* Creates a list of all the groups that the TA oversees */
  showTAGroups() {
    var taStudGroupsDiv = this.groupInfo.Group.map(i => $('<div/>', {
      id: `group-${i.id}`,
      class: `ta-group flexChildren`
    }).append($('<div/>', {
      class: `flexText`,
      html: `Group ${i.id}`
    })));

    this.addToParentById('group_divs' /* parent container */, taStudGroupsDiv);
    $('.ta-group').click(evt => this.handleClickEvent($(evt.currentTarget)));
  }


  /* Displays a list of students in the group */
  showStudentsInGroup (groupID) {
    this.showBackBtn();

    var studGroups = this.studInfo.filter(i => i[0].Group == groupID)[0];
    var studDivs = studGroups.map(i => $('<div/>', {
      id: `${i.Name}`,
      "data-hexID":`${i.hexID}`,
      class: `student group-${i.Group} flexChildren`,
    }).append($('<div/>', {
      class: `flexText`,
      html: `${i.Name.replace(/_/g, ' ')}`  // replaces all underscore with spaces
    })));

    this.addToParentById(`group-${groupID}`, studDivs);
    $('.student').click(evt => this.handleClickEvent($(evt.currentTarget)));
  }


  /* Displays student information */
  showStudentInfo (studentName) {
    // make sure that a UI template has been provided, otherwise return error
    if ($.type(this.template) == 'undefined') {
      console.log("Please define a UI template first")
      return;
    }

    var tagTypes = {
      "radio": "input",
      "textarea": "textarea"
    };
    var formLabels = {
      "Attendance": "How often is this student present in class?",
      "Focused": "How often is this student engaged in off-task behavior?",
      "Participation": "How often does this student share their ideas, confusions, or knowledge?",
      "Rating": "How would you rate this student?",
      "Comments": "Comments"
    };
    var optionLabels = {
      3: ["Exceptional", "Satisfactory", "Unsatisfactory"],
      4: ["Often", "Occasionally", "Rarely", "Not sure"]
    };

    var formDivs = this.template.map(i => [ $('<label/>', {
      class: `${i.class}-label`,
      for: `${i.class}`,
      html: `${formLabels[i.class]}`,
    }), ...this.makeFormInput(tagTypes[i.type], optionLabels[i.options], i) ]);

    $.each(formDivs, (i) => {
      this.addToParentById(studentName, formDivs[i]);
    });
  }


  /* Updates any data changes to UI */
  setHTML (inputType, value) {
    var inputElem = this.template.find(item => item.class == `${inputType}`);

    if (inputType == 'Comments') {
      inputElem.html = value;
    } else {
      inputElem.value = value;
    }
  }


  /* Adds child to Parent div specified by ID */
  addToParentById (divID, child) {
    var id = '#' + divID;
    $(id).append(child);
  }


  /* Adds child to Parent div specified by class */
  addToParentByClass (divClass, child) {
    var className = '.' + divClass;
    $(className).append(child);
  }


  /* Expands given item to window size and hide all other items in same class */
  hideAndExpand (item) {
    var itemID = item.attr("id")
    var itemClass = '.' + item.attr("class").split(" ")[0];
    // console.log(item, itemID, itemClass)

    this.grow(item);
    this.hide(itemClass, itemID);
  }


  /* Hides all items in a class, except the one with the given id */
  hide (className, skipID) {
    for (var i of $(className)) {
      if ($(i).attr("id") != skipID) {
        $(i).hide(300); // animated
      }
    }
  }


  /* Expands the item to window size */
  grow (item) {
    setTimeout(() => item.parent().css({ display: "block" }), 0); // timeout fixes weird animation transition
    item.animate({ height: "100%" });
  }


  /* Constructs and returns a DOM element with the given tag, options, and any other data necessary */
  makeFormInput (tag, options, data) {
    if (data.type == 'radio') {
      return options.map(option => $('<input>', {
          class: `${data.class}`,
          name: `${data.class}`,
          type: `radio`,
          checked: (option == data.value),
          value: `${option}`
        }).add($('<text/>', {
          class: `inputText`,
          html: `${option}`
        }))
      );
    } else {
      return $(`<${tag}>`, data);
    }
  }


  /* Handles click event when a group is selected */
  handleClickEvent (clickedItem) {
    // console.log(clickedItem)
    var clickedClass = clickedItem.attr("class").split(" ")[0];

    clickedItem.off(); // removes click event
    clickedItem.removeClass("flexChildren").addClass("flexContainer");
    if (clickedClass == 'student') {
      clickedItem.css({ margin: "0px", "padding-top": "10px" });
    }

    var clickedText = $(clickedItem.children()[0]);
    if (clickedClass == 'ta-group') {
      clickedText.addClass("flexContainerText");
    } else {
      clickedText.addClass("flexChildrenText");
    }

    var clickedID = (clickedClass == 'ta-group') ? clickedItem.attr("id").slice(6, 7) : clickedItem.attr("class").split(" ")[1].slice(6, 7);
    this.hideAndExpand(clickedItem);
    if (clickedClass == 'ta-group') {
      this.showStudentsInGroup(clickedID);
    } else {
      var studentName = clickedItem.attr("id");
      $('#group_divs').trigger('submit', {0:studentName, 1:clickedID}); // notify TAHelper that a student has been selected
      setTimeout(() => this.showStudentInfo(studentName, clickedID), 10); // delay to receive template
    }
  }


  /* Handles click event for back button */
  handleBackRequest() {
    $('#group_divs').attr("style", "");

    var formLength = document.getElementsByTagName('input').length;

    if (formLength) { // backing up from student info
      $('.student').remove();

      // crude way of determining what the currently selected group is
      var group = $('#group_divs').find($('div'));
      for (var i of $(group)) {
        var flexType = $(i).attr("class").split(" ")[1];
        if (flexType == 'flexContainer') {
          $(i).css({ display: "" });

          var groupID = $(i).attr("id").substring(6, 7);
          this.showStudentsInGroup(groupID);
        }
      }
    } else {  // backing up from student groups
      $('.ta-group').remove();
      this.hideBackBtn();
      this.showTAGroups();
    }
  }


  /* Adds a back button to the top of the page */
  addBackBtn() {
    var backBtn = $('<button/>', {
      id: 'backBtn',
      html: 'Back'
    });

    $(backBtn).hide();  // initially hidden
    $(backBtn).click(evt => this.handleBackRequest());
    this.addToParentById('back' /* button parent container */, backBtn);
  }


  /* Turns back button visible or invisible */
  showBackBtn() { $('#backBtn').show(300); /* animated */ }
  hideBackBtn() { $('#backBtn').hide(); }

}
