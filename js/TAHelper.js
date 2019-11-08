/* Javscript file for handling the UI */

$(init);


function init() {
  var courseInfo = $.get("../json/dataDev.json")    // fetches student and TA groups
  var taInfo = $.get("iam.php")   // fetches TA info
  $.when(courseInfo, taInfo).done(loaded);
}


function loaded (courseInfo, taInfo) {
  // console.log(courseInfo[0], taInfo[0])
  var taName = `${taInfo[0].nickname}_${taInfo[0].sn}`;
  var tacourseInfo = courseInfo[0]["TA Groups"][taName];
  var studcourseInfo = courseInfo[0]["Student Groups"];

  var taGroups = tacourseInfo.Group.map(i => getStudentGroup(i.id, courseInfo[0]["Student Groups"]));
  var taGroupsDiv = tacourseInfo.Group.map(i => $('<div/>', {
    id: `group-${i.id}`,
    class: `ta-group flexChildren`
  }).append( $('<div/>', {
    class: `flexText`,
    html: `Group ${i.id}`
  })));

  addToParentDiv('group_divs', taGroupsDiv);

  $('.ta-group').click(function() {
    var clickedItem = $(this);
    var clickedID = clickedItem.attr("id").slice(6,7);

    clickedItem.off();    // removes click event
    clickedItem.removeClass("flexChildren").addClass("flexContainer");

    hideAndExpand(clickedItem);
    showStudentGroups(clickedItem, taGroups.filter(i => i[0].Group == clickedID)[0]);
  });
}


function showStudentGroups (taGroup, studGroup) {
  var clickedText = $(taGroup.children()[0]);
  clickedText.css({ width: "100%", padding: "20px" });

  // console.log(taGroup, studGroup)
  var studDivs = studGroup.map(i => $('<div/>', {
    id: `${i.Name}`,
    class: `student group-${i.Group} flexChildren`,
  }).append( $('<div/>', {
    class: `flexText`,
    html: `${i.Name.replace('_', ' ')}`
  })));

  var group_div = taGroup.attr("id");
  addToParentDiv(group_div, studDivs);

  $('.student').click(function() {
    var clickedItem = $(this);
    clickedItem.off();    // removes click event
    clickedItem.removeClass("flexChildren").addClass("flexContainer");
    clickedItem.css({ margin:"0px", "padding-top":"10px" });

    var clickedText = $(clickedItem.children()[0]);
    clickedText.css({ width: "100%", "padding-left": "10px", "justify-content": "left" });

    var studentName = clickedItem.attr("id");
    hideAndExpand(clickedItem);
    showStudentInfo(studentName);
  });
}


function showStudentInfo (studentName) {
  var url = `questionInfo.php?studentName=${studentName}`;
  var tagType = {"range":"input", "textarea":"textarea"};

  $.getJSON(url).done((result) => {
    var formDivs = result.map(i => [  $('<label/>', {
      class: `${i.class}-label`,
      for: `${i.class}`,
      html: `${i.class}: ${i.value}`
    }), $(`<${tagType[i.type]}>`, i) ]);

    $.each(formDivs, function(i) {
      addToParentDiv(studentName, formDivs[i]);
    });

    $(`#${studentName} input`).on('input change', function(evt) {
      var thisClass = $(this).attr("class");
      var value = $(this).val();

      $(`.${thisClass}-label`).html(`${thisClass}: ${value}`);
      // console.log(evt.type)
      if (evt.type == 'change') {
        sendQuestionnaire(url, result, thisClass, value);
      }
    });

    $(`#${studentName} textarea`).on('change', function(evt) {
      var thisClass = $(this).attr("class");
      var value = $(this).val();
      sendQuestionnaire(url, result, thisClass, value);
    });
  });
}

function sendQuestionnaire (url, result, className, value) {
  result.find((item) => item.class == `${className}`).value = value;
  console.log(result)
  $.post(url, { data:result });
}

// Returns array of students groups
function getStudentGroup (groupID, studentGroups) {
  return Object.keys(studentGroups)
            .filter((item) => { return studentGroups[item].Group == groupID })
            .map((item)=> studentGroups[item]);
}


// Scale clicked item to window size and hide all other items in same class
function hideAndExpand (clickedItem) {
  // console.log(clickedItem)
  var clickedID = clickedItem.attr("id")
  var clickedClass = '.' + clickedItem.attr("class").split(" ")[0];

  grow(clickedItem);
  hide(clickedID, clickedClass);
}


function hide (clickedID, clickedClass) {
  // console.log($(clickedClass).filter(i => $(i).attr("id") != clickedID).)
  for (i of $(clickedClass)) {
    if ($(i).attr("id") != clickedID) {
      $(i).hide(500);     // animated
    }
  }
}


function grow (clickedGroup) {
  clickedGroup.parent().css({ display: "block" });
  clickedGroup.animate({ width:"100%", height:"100%", left: 0, top: 0 });
}


function addToParentDiv (divID, child) {
  var id = '#' + divID;
  $(id).append(child);
}
