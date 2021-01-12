/* JavaScript file for handling data in TAHelper */

class TAHelperModel {
  constructor (courseInfo, loginInfo) {
    this.courseInfo = courseInfo;
    this.loginInfo = loginInfo;
    // console.log(this.courseInfo, this.loginInfo)
  }

  /* Returns the name of the user currently logged in */
  getLoginName() {
    return `${this.loginInfo.nickname} ${this.loginInfo.sn}`.replaceAll(' ', '_');
  }

  /* Returns the netID of the user currently logged in */
  getLoginID() {
    return this.loginInfo.cn;
  }

  /* Returns information on all of the groups that the user oversees and the user role */
  getUserInfo (username) {
    var netID = this.getLoginID();
    return Object.assign(this.courseInfo["TA Groups"][username], {netID: netID});
  }

  /* Returns the user role for the given username */
  getUserRole (username) {
    return this.getUserInfo(username)["Type"];
  }

  /* Returns information on all of the groups that the user oversees */
  getUserGroups (username) {
    return this.getUserInfo(username)["Group"];
  }

  /* Returns information on all of the groups in the course */
  getAllGroups() {
    return this.courseInfo["GroupAll"];
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

  /* Returns information on the student evaluation form template */
  getStudEvalTemplate() {
    return this.courseInfo["Student Evaluation Template"];
  }

  /* Returns information on the group evaluation form template */
  getGroupEvalTemplate() {
    return this.courseInfo["Group Evaluation Template"];
  }
  
}
