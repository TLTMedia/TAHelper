/* JavaScript file for handling data in TAHelper */

class TAHelperModel {

  /* Class constructor */
  constructor (courseInfo, taInfo) {
    this.courseInfo = courseInfo[0];
    this.taInfo = taInfo[0];
    // console.log(this.courseInfo, this.taInfo)

    this.taName = this.getTAName();
    this.taGroupInfo = this.getTAGroupsInfo(this.taName);
    this.taStudGroups = this.getTAStudGroups(this.taName);
  }

  /* Returns the name of the TA currently logged in */
  getTAName() {
    return `${this.taInfo.nickname} ${this.taInfo.sn}`.replace(/ /g,"_"); // replaces all spaces with underscore
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

}
