/* JavaScript file for handling UI in TAHelper */

class TAHelperUI {

  /* Class constructor */
  constructor (groupInfo, studInfo) {
    this.groupInfo = groupInfo;
    this.studInfo = studInfo;
    // console.log(this.groupInfo, this.studInfo)
  }

  /* Sets UI template */
  setQuesTemplate (uiTemplate) { this.questionTemplate = uiTemplate; }
  setEvalTemplate (uiTemplate) { this.evaluationTemplate = uiTemplate; }

  /* Updates any data changes to questionnaire form */
  setQuesHTML (inputType, value) {
    var inputElem = this.questionTemplate.find(item => item.class == `${inputType}`);
    // console.log(inputElem)
    if (inputType == 'Comments') {
      inputElem.html = value;
    } else {
      inputElem.value = value;
    }
  }


  /* Updates any data changes to evaluation form */
  setEvalHTML (inputType, value) {
    var inputElem = this.evaluationTemplate.find(item => item.class == `${inputType}`);
    // console.log(inputElem)
    if (inputType == 'Comments') {
      inputElem.html = value;
    } else {
      inputElem.value = value;
    }
  }


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
    this.showEvalBtn();

    // console.log(this.studInfo)
    var studGroups = this.studInfo.filter(i =>  i[0] && i[0].Group == groupID)[0];
    var studDivs = studGroups.map(i => $('<div/>', {
      id: `${i.Name}`,
      "data-hexID":`${i.hexID}`,
      class: `student group-${i.Group} flexChildren`,
    }).append($('<img/>', {
      class: `profile`,
      src: `images/${i.Name}.jpg`,
      onerror: `this.src='images/no-image-available.jpg'` // alt image if none found
    })).append($('<div/>', {
      class: `flexText`,
      html: `${i.Name.replace(/_/g, ' ')}`  // replaces all underscore with spaces
    })));

    this.addToParentById(`group-${groupID}`, studDivs);
    $('.student').on("click",evt => this.handleClickEvent($(evt.currentTarget)));
  }


  /* Displays student questionnaire questions and responses */
  showStudentInfo (studentName, groupID) {
    // make sure that a UI template has been provided, otherwise return error
    if ($.type(this.questionTemplate) == 'undefined') {
      console.log("Please define a UI template first")
      return;
    }

    $('.profile').addClass('minimize');

    var formDivs = this.questionTemplate.map(i => [ $('<label/>', {
      class: `${i.class}-label`,
      for: `${i.class}`,
      html: `${i.label}`,
    }), ...this.makeFormInput(i.type, i.options, i) ]);

    $.each(formDivs, (i) => {
      this.addToParentById(studentName, formDivs[i]);
    });
  }


  /* Displays group evaluation questions and responses */
  showGroupEval (groupID) {
    // make sure that a UI template has been provided, otherwise return error
    if ($.type(this.evaluationTemplate) == 'undefined') {
      console.log("Please define a UI template first")
      return;
    }

    var evalDiv = $('<div/>', {
      id: `group-evaluations`,
      class: `student flexContainer`
    }).append($('<div/>', {
      class: `flexText flexChildrenText`,
      html: `Group Evaluation`  // replaces all underscore with spaces
    }));

    this.addToParentById(`group-${groupID}`, evalDiv);
    $('#group-evaluations').css({ margin: "0px", "padding-top": "10px" }); // override inherited css

    var formDivs = this.evaluationTemplate.map(i => [ $('<label/>', {
      class: `${i.class}-label`,
      for: `${i.class}`,
      html: `${i.label}`,
    }), ...this.makeFormInput(i.type, i.options, i) ]);

    $.each(formDivs, (i) => {
      $('#group-evaluations').hide(); // for animation
      this.addToParentById('group-evaluations', formDivs[i]);
      $('#group-evaluations').slideDown(300); // animated
    });
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

    item.parent().animate({ display: "block" });
    item.css("width", "100%");  // in case few students in group
    item.animate({ height: "100%" });

    // hide all other items with the same class
    for (var i of $(itemClass)) {
      if ($(i).attr("id") != itemID) {
        $(i).hide('fast'); // animated
      }
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
        break;
      case 'textarea':
        return $(`<${tagTypes[tag]}>`, data).css("height", "100px");
        break;
      default:
        return $(`<${tagTypes[tag]}>`, data);
    }
  }


  /* Post an announcement in the header */
  postAnnouncement() {
    var d = new Date();
    var month = d.getMonth()+1;
    var day = d.getDate();
    var formatDate = d.getFullYear() + '-' + (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day;
    console.log(formatDate);

    var textBox = $('<div/>', {
      class: `headerText`,
      html: `Evaluations will be cleared on `
    }).append($('<input/>', {
      type: `datetime-local`,
      value: `${formatDate}`
    }));

    this.addToParentById('header' /* parent container */, textBox);
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

    var clickedID = (clickedClass == 'ta-group') ? clickedItem.attr("id").split("-")[1] : clickedItem.attr("class").split(" ")[1].split("-")[1];
    this.hideAndExpand(clickedItem);
    if (clickedClass == 'ta-group') {
      this.showStudentsInGroup(clickedID);
    } else {
      var studentName = clickedItem.attr("id");
      $('#group_divs').trigger('student:clicked', {0:studentName, 1:clickedID});  // notify TAHelper that a student has been selected
    }
  }


  /* Handles click event for back button */
  handleBackRequest() {
    $('#group_divs').attr("style", "");
    $('#evalBtn').attr("disabled", false); // enables evaluation button

    var formLength = document.getElementsByTagName('input').length;
    if (formLength > 1) { // backing up from student info
      $('.student').remove();

      // crude way of determining what the currently selected group is
      var group = $('#group_divs').find($('div'));
      for (var i of $(group)) {
        var flexType = $(i).attr("class").split(" ")[1];
        if (flexType == 'flexContainer') {
          $(i).css({ display: "" });

          var groupID = $(i).attr("id").split("-")[1];
          this.showStudentsInGroup(groupID);
        }
      }
    } else {  // backing up from student groups
      $('.ta-group').remove();
      this.hideBackBtn();
      this.showTAGroups();
    }
  }


  /* Handles click event for evaluation button */
  handleEvaluationRequest() {
    $('#evalBtn').attr("disabled", true); // prevents request from being sent multiple times
    $('.student').fadeOut(300);  // animated

    // crude way of determining what the currently selected group is
    var group = $('#group_divs').find($('div'));
    for (var i of $(group)) {
      var flexType = $(i).attr("class").split(" ")[1];
      if (flexType == 'flexContainer') {
        var groupID = $(i).attr("id").split("-")[1];
        // console.log(groupID)
      }
    }

    $('#right_menu').trigger('request:evaluations', groupID);
  }


  /* Handles click event for download button */
  handleDownloadRequest() {
    $('#right_menu').trigger('request:download', this.groupInfo);
  }

  /* Handles click event for clear button */
  handleClearRequest() {
    $('#right_menu').trigger('request:clear');
  }


  /* Turns back button visible or invisible */
  showBackBtn() { $('#backBtn').show(); }
  hideBackBtn() { $('#backBtn').hide(); }


  /* Turns evaluation button visible or invisible */
  showEvalBtn() { $('#evalBtn').show(); }
  hideEvalBtn() { $('#evalBtn').hide(); }


  /* Turns download button visible or invisible */
  showDownloadBtn() { $('#downloadBtn').show(); }
  hideDownloadBtn() { $('#downloadBtn').hide(); }


  /* Adds a back button to the top of the page */
  addBackBtn() {
    var backBtn = $('<button/>', {
      id: 'backBtn',
      html: 'Back'
    });

    $(backBtn).hide();  // initially hidden
    $(backBtn).click(evt => this.handleBackRequest());
    this.addToParentById('left_menu' /* parent container */, backBtn);
  }


  /* Adds a dropdown menu to the page */
  addDropdownMenu() {
    var dropdownBtn = $('<button/>', {
      id: 'dropdownBtn',
      html: 'Menu'
    });
    var dropdownMenu = $('<div/>', {
      id: 'dropdownMenu',
      class: 'dropdown-content'
    })
    var evalBtn = $('<button/>', {
      id: 'evalBtn',
      html: 'Group Evaluation',
    });
    var downloadBtn = $('<button/>', {
      id: 'downloadBtn',
      html: 'Download All Responses',
    });
    var clearBtn = $('<button/>', {
      id: 'clearBtn',
      html: 'Clear All Responses',
    });

    $(evalBtn).hide();  // initially hidden
    $(evalBtn).click(evt => this.handleEvaluationRequest());
    $(downloadBtn).click(evt => this.handleDownloadRequest());
    $(clearBtn).click(evt => this.handleClearRequest());

    dropdownMenu.append(evalBtn, downloadBtn, clearBtn);
    this.addToParentById('right_menu' /* parent container */, dropdownBtn);
    this.addToParentById('right_menu' /* parent container */, dropdownMenu);
  }

}
