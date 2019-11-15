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

  constructor (courseInfo, taInfo) {
    this.courseInfo = courseInfo[0];
    this.taInfo = taInfo[0];
    console.log(this.courseInfo, this.taInfo)
  }

  /* Loads the initial page */
  loaded() {
    this.addBackBtn();

    var taName = `${this.taInfo.nickname} ${this.taInfo.sn}`.replace(/ /g,"_"); // replaces all spaces with underscore
    this.taGroupInfo = this.getTAGroupInfo(taName);
    this.taStudGroups = this.getTAStudGroups(taName);
    // this.studGroupInfo = this.getStudGroupInfo();
    this.showTAGroups();
  }


  /* Displays a list of all the groups that the TA oversees */
  showTAGroups() {
    var taStudGroupsDiv = this.taGroupInfo.Group.map(i => $('<div/>', {
      id: `group-${i.id}`,
      class: `ta-group flexChildren`
    }).append($('<div/>', {
      class: `flexText`,
      html: `Group ${i.id}`
    })));
    this.addToParentDivById('group_divs' /* parent container */, taStudGroupsDiv);

    $('.ta-group').click((evt) => {
      var clickedItem = $(evt.currentTarget);
      clickedItem.off(); // removes click event
      clickedItem.removeClass("flexChildren").addClass("flexContainer");

      var clickedText = $(clickedItem.children()[0]);
      clickedText.css({ width: "100%", padding: "20px" });

      var clickedID = clickedItem.attr("id");
      this.hideAndExpand(clickedItem);
      this.showStudentsInGroup(clickedID);
    });
  }


  /* Displays a list of students in the group */
  showStudentsInGroup (groupID) {
    this.showBackBtn();

    var studGroups = this.getStudsInGroup(groupID.slice(6, 7) /* group ID */);
    var studDivs = studGroups.map(i => $('<div/>', {
      id: `${i.Name}`,
      "data-hexID":`${i.hexID}`,
      class: `student group-${i.Group} flexChildren`,
    }).append($('<div/>', {
      class: `flexText`,
      html: `${i.Name.replace(/_/g, ' ')}`  // replaces all underscore with spaces
    })));
    this.addToParentDivById(groupID, studDivs);

    $('.student').click((evt) => {
      var clickedItem = $(evt.currentTarget);
      clickedItem.off(); // removes click event
      clickedItem.removeClass("flexChildren").addClass("flexContainer");
      clickedItem.css({ margin: "0px", "padding-top": "10px" });

      var clickedText = $(clickedItem.children()[0]);
      clickedText.css({ width: "100%", "padding-left": "10px", "justify-content": "left" });

      var clickedClass = clickedItem.attr("class");
      var clickedGroupID = clickedClass.split(" ")[1].slice(6, 7);  // group ID

      var studentName = clickedItem.attr("id");
      this.hideAndExpand(clickedItem);
      this.showStudentInfo(studentName, clickedGroupID);
    });
  }


  /* Displays student information */
  showStudentInfo (studentName, groupID) {
    var hexID = this.taStudGroups.filter(group => group[0].Group == groupID)[0].filter(stud => stud.Name == studentName)[0].hexID;
    var url = `questionInfo.php?studentName=${studentName}_${hexID}`;

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

    $.getJSON(url).done(result => {
      var formDivs = result.map(i => [ $('<label/>', {
        class: `${i.class}-label`,
        for: `${i.class}`,
        html: `${formLabels[i.class]}`,
      }), ...this.makeFormInput(tagTypes[i.type], optionLabels[i.options], i) ]);

      $.each(formDivs, (i) => {
        this.addToParentDivById(studentName, formDivs[i]);
      });

      $(`#${studentName} input`).on('input change', (evt)=> {
        var className = $(evt.currentTarget).attr("class");
        var value = $(evt.currentTarget).val();
        console.log(className, value)

        if (evt.type == 'change') {
          this.updateFormHTML(result, className, value);
          this.sendQuestionnaire(url, result);
        }
      })

      $(`#${studentName} textarea`).on('change blur', (evt)=> {
        var className = $(evt.currentTarget).attr("class");
        var value = $(evt.currentTarget).val();
        this.updateFormHTML(result, className, value);
        this.sendQuestionnaire(url, result);
      });
    });
  }


  /* Update the text on the form with a new value */
  updateFormHTML (form, question, newValue) {
    if (question == 'Comments') {
      form.find(item => item.class == `${question}`).html = newValue;
    } else {
      form.find(item => item.class == `${question.split('-')[0]}`).value = newValue;
    }
  }


  /* Post updated results to student's copy of questionnaire */
  sendQuestionnaire (url, form) {
    $.post(url, { data: form });
  }


  /* Returns information on all of the groups that the TA oversees */
  getTAGroupInfo (taName) {
    return this.courseInfo["TA Groups"][taName];
  }


  /* Returns information on all of the students in the course */
  getStudGroupInfo() {
    return this.courseInfo["Student Groups"];
  }


  /* Returns array of all of the students in the same group as the specified TA */
  getTAStudGroups (taName) {
    var groupInfo = this.getTAGroupInfo(taName);
    return groupInfo.Group.map(i => this.getStudGroup(i.id, this.courseInfo["Student Groups"]));
  }


  /* Returns array of students groups */
  getStudGroup (groupID, studentGroups) {
    return Object.keys(studentGroups)
      .filter((item) => {
        return studentGroups[item].Group == groupID
      })
      .map((item) =>Object.assign({hexID:item},studentGroups[item]));
  }


  /* Returns array of students in group */
  getStudsInGroup (groupID) {
    return this.taStudGroups.filter(i => i[0].Group == groupID)[0];
  }


  /* Adds child to parent div specified by ID */
  addToParentDivById (divID, child) {
    var id = '#' + divID;
    $(id).append(child);
  }


  /* Adds child to parent div specified by class */
  addToParentDivByClass (divClass, child) {
    var className = '.' + divClass;
    $(className).append(child);
  }


  /* Expands given item to window size and hide all other items in same class */
  hideAndExpand (item) {
    var itemID = item.attr("id")
    var itemClass = '.' + item.attr("class").split(" ")[0];
    console.log(item, itemID, itemClass)

    this.grow(item);
    this.hide(itemClass, itemID);
  }


  /* Hides all items in a class, except the one with the given id */
  hide (className, skipID) {
    for (var i of $(className)) {
      if ($(i).attr("id") != skipID) {
        $(i).hide(500); // animated
      }
    }
  }


  /* Expands the item to window size */
  grow (item) {
    item.parent().css({ display: "block" });
    item.animate({ width: "100%", height: "100%", left: 0, top: 0 });
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
    }

    return $(`<${tag}>`, data);
  }


  /* Adds a back button to the top of the page */
  addBackBtn() {
    var backBtn = $('<button/>', {
      id: 'backBtn',
      html: 'Back'
    });

    $(backBtn).click(function(e) {
      console.log($(this))
    })

    $(backBtn).hide();  // initially hidden
    this.addToParentDivById('back', backBtn);
  }


  /* Turns back button visible */
  showBackBtn() {
    $('#backBtn').show(500);  // animated
  }

}
