/* JavaScript file for handling data in TAHelper */

class TAHelperModel {
  constructor (courseInfo, loginInfo) {
    this.courseInfo = courseInfo;
    this.loginInfo = loginInfo;
    // console.log(this.courseInfo, this.loginInfo)
  }

  /* Returns the name of the user currently logged in */
  getLoginName() {
    return `${this.loginInfo.nickname} ${this.loginInfo.sn}`.replace(' ', '_');
  }

  /* Returns information on all of the groups that the user oversees and the user role */
  getUserInfo (username) {
    return this.courseInfo["TA Groups"][username];
  }

  /* Returns the user role for the given username */
  getUserRole (username) {
    return this.getUserInfo(username)["Type"];
  }

  /* Returns information on all of the groups that the user oversees */
  getUserGroups (username) {
    var userRole = this.getUserRole(username);
    return ((userRole == "Professor" || userRole == "GTA") ? this.getAllGroups() : this.getUserInfo(username)["Group"]);
  }

  /*  */
  getAllGroups() {
    var students = this.getAllStuds();
    var groupSet = new Set(Object.values(students).map(val => val.Group));
    return Array.from(groupSet).sort();
  }

  /* Returns information on all of the students in the course */
  getAllStuds() {
    return this.courseInfo["Student Groups"];
  }

  /* Returns array of all of the students in the group */
  getAllStudsInGroup (groupID) {
    var students = this.getAllStuds();
    return Object.keys(students)
      .filter(key => { return students[key].Group == groupID })
      .map(key => Object.assign(students[key], {hexID: key}));
  }

  /* Return array of all of the students in the groups that the user is responsible for */
  getAllStudsForUser (username) {
    var userGroups = this.getUserGroups(username);
    return userGroups.map(grp => this.getAllStudsInGroup(grp));
  }
  
}
