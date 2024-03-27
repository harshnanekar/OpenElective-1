const query = require("../queries/user.js");
const eventQuery = require("../queries/eventQueries.js");
const validation = require("../controller/validation.js");
const excelController = require("../controller/excel.js");
const {redisDb} = require("../config/database.js");
const path = require('path');
const student = require("./student.js");
const emailController = require("../controller/email.js");




let controller = {
  event: async (req, res) => {
    try {
      let username = await redisDb.get("user");
      console.log("redis user ", username);

      let getmodules = await query.getModules(username);
      let childmodules = await eventQuery.getChildModules(username, "Event");

      return res.render("eventPage", {
        module: getmodules,
        childModules: childmodules.rows,
      });
    } catch (err) {
      console.log("Error " + err.message);
      return res.redirect(`${res.locals.BASE_URL}elective/error`);
    }
  },

  addEvent: async (req, res) => {
    try {
      let username = await redisDb.get("user");

      let modules = await query.getModules(username);
      let campus = await eventQuery.getCampus();
      let acadSession = await eventQuery.getacadSession();

      return res.render("addEvent", {
        module: modules,
        campus: campus.rows,
        acadSession: acadSession.rows,
      });
    } catch (err) {
      console.log(err.message);
      return res.redirect(`${res.locals.BASE_URL}elective/error`);
    }
  },

  eventData: async function (req, res) {
    try {
      let username = await redisDb.get("user");
      let user_role = await redisDb.get("role");

      console.log("event query");
      let { eventName, semester, acad_year, campus, start_date, end_date } =
        req.body;

      let eventValidation = validation.eventvalidator(eventName);
      let campusValidate = validation.campusValidation(campus);
      let sessionValidate = validation.acadSessionValidation(semester);
      let acadYearValidation = validation.newAcadYearValidation(acad_year);

      if (
        eventValidation &&
        start_date != undefined &&
        end_date != undefined &&
        campusValidate &&
        sessionValidate &&
        acadYearValidation
      ) {
        let startDate = start_date.split("T")[0];
        let endDate = end_date.split("T")[0];

        console.log("start_date", startDate, "end_date", endDate);
        let dateValidate = new Date(startDate) < new Date(endDate);
        if (dateValidate) {
          let jsonData = JSON.stringify({
            eventName,
            semester,
            acad_year,
            campus,
            start_date,
            end_date,
            username,
          });

          if (user_role === "Role_Admin") {
            let query = await eventQuery.addEventdata(jsonData);

            console.log("query return--- ", query);

            if (query.rowCount > 0) {
              return res.json({
                status: "success",
                redirectTo: `${res.locals.BASE_URL}elective/viewEvent`,
              });
            } else {
              return res.json({
                message: "Failed To Create Event !!",
              });
            }
          } else {
            res.clearCookie("jwtauth");
            return res.json({
              status: "error",
              redirectTo: `${res.locals.BASE_URL}elective/loginPage`,
            });
          }
        } else {
          return res.json({
            message: "Invalid Date Input !!",
          });
        }
      }
    } catch (error) {
      console.log(error.message);
      return res.json({
        status: "error",
        redirectTo: `${res.locals.BASE_URL}elective/error`,
      });
    }
  },

  viewEvent: async function (req, res) {
    try {
      let username = await redisDb.get("user");

      let getmodules = await query.getModules(username);
      let eventData = await eventQuery.getAllEventData(username);
      let campus = await eventQuery.getCampus();
      let acadSessions = await eventQuery.getacadSession();

      let dataRows = eventData.rowCount;

      return res.render("viewEvent", {
        module: getmodules,
        eventData: eventData.rows,
        campus: campus.rows,
        acadSession: acadSessions.rows,
        dataRows: dataRows,
      });
    } catch (err) {
      console.log("Error " + err.message);
      return res.redirect(`${res.locals.BASE_URL}elective/error`);
    }
  },

  registerStudent: async (req, res) => {
    try {
      let username = await redisDb.get("user");

      let getmodules = await query.getModules(username);
      let campus = await eventQuery.getCampus();
      let acadSession = await eventQuery.getacadSession();

      return res.render("registerStudent", {
        module: getmodules,
        campus: campus.rows,
        acadSession: acadSession.rows,
      });
    } catch (err) {
      console.log(err.message);
      return res.redirect(`${res.locals.BASE_URL}elective/error`);
    }
  },

  uploadStudentData: async (req, res) => {
    try {
      console.log("File function called");
      let username = await redisDb.get("user");
      let user_role = await redisDb.get("role");

      let file = req.file;

      console.log("File found ", file);
      if (file != undefined) {
        let studentArray = [];
        let emptyStudentArray = [];

        let studentUserColumn = "Username";
        let studentFirstNameColumn = "FirstName";
        let studentLastNameColumn = "LastName";
        let studentSession = "Acad_Session";
        let studentYear = "Acad_Year";
        let studentCampus = "Campus";
        let studentRoll = "RollNo";

        let programJson = {
          studentUserColumn,
          studentFirstNameColumn,
          studentLastNameColumn,
          studentSession,
          studentYear,
          studentCampus,
          studentRoll,
        };

        let getData = excelController.readExcelFile(file);
        let arrLength = getData.length;

        if (arrLength > 0) {
          let excelKeys = getData[0];
          let excelHeader = Object.keys(excelKeys);

          console.log(
            "length of object ",
            Object.keys(programJson).length,
            excelHeader.length
          );

          if (Object.keys(programJson).length == excelHeader.length || Object.keys(programJson).length-1 == excelHeader.length ) {
            for (let data of excelHeader) {
              if (!Object.values(programJson).includes(data)) {
                return res.json({
                  status: "fileError",
                  message: "Invalid Excel Format !!",
                });
              }
            }
          } else {
            return res.json({
              status: "fileError",
              message: "Invalid Excel Format !!",
            });
          }

          getData.forEach(async (data) => {
            let excelStudentUname = new String(data.Username);
            let excelFirstName = new String(data.FirstName);
            let excelLastName = new String(data.LastName);
            let excelSession = new String(data.Acad_Session);
            let excelYear = new String(data.Acad_Year);
            let excelCampus = new String(data.Campus);
            let excelRoll = new String(data.RollNo);

            console.log('excel roll no ',excelRoll)

            let studentUname =
              excelStudentUname != undefined
                ? excelStudentUname.trim()
                : undefined;
            let studentFirstName =
              excelFirstName != undefined ? excelFirstName.trim() : undefined;
            let studentLastName =
              excelLastName != undefined ? excelLastName.trim() : undefined;
            let acadSession =
              excelSession != undefined ? excelSession.trim() : undefined;
            let acadYear =
              excelYear != undefined ? excelYear.trim() : undefined;
            let campus =
              excelCampus != undefined ? excelCampus.trim() : undefined;
            let rollNo = excelRoll != undefined ? excelRoll.trim() : undefined;

            // let usernameValidation =
            //   studentUname != undefined
            //     ? validation.NumberValidation(studentUname)
            //     : false;

            // if (usernameValidation) {
            //   if (studentUname.length == 11) {
            //     usernameValidation = true;
            //    let checkUsername = await eventQuery.checkUser(studentUname); 
            //    console.log('checkUsername ',checkUsername)

            //    if(checkUsername.rows[0].userCount > 0){
            //     usernameValidation=false;    
            //    }
            //   } else {
            //     usernameValidation = false;
            //   }
            // }

            // let firstNameValidation =
            //   studentFirstName != undefined
            //     ? validation.fnameValidation(studentFirstName)
            //     : false;
            // let lastNameValidation =
            //   studentLastName != undefined
            //     ? validation.lnameValidation(studentLastName)
            //     : false;
            // let sessionValidation =
            //   acadSession != undefined
            //     ? validation.acadSessionValidation(acadSession)
            //     : false;
            // let yearValidation =
            //   acadYear != undefined
            //     ? validation.newAcadYearValidation(acadYear)
            //     : false;
            // let campusValidation =
            //   campus != undefined ? validation.campusValidation(campus) : false;
            // let rollValidation =
            //   rollNo != undefined ? validation.rollNoValidation(rollNo) : false;

            // console.log("validations ", usernameValidation,
            // firstNameValidation ,
            // lastNameValidation ,
            // sessionValidation ,
            // yearValidation,
            // campusValidation, 
            // rollValidation);

            // if (
            //   usernameValidation &&
            //   firstNameValidation &&
            //   lastNameValidation &&
            //   sessionValidation &&
            //   yearValidation &&
            //   campusValidation &&
            //   rollValidation
            // ) {

           if(rollNo === 'undefined'){
              rollNo = null;
           }
              studentArray.push({
                studentUname,
                studentFirstName,
                studentLastName,
                acadSession,
                acadYear,
                campus,
                rollNo,
                username,
              });
           
            })
          //     console.log("Array found--- ", studentArray);
            
          //   } else {
          //     console.log("Array not found empty");
          //     emptyStudentArray.push({
          //       studentUname,
          //       studentFirstName,
          //       studentLastName,
          //       acadSession,
          //       acadYear,
          //       campus,
          //       rollNo,
          //       username,
          //     });
          //   }
          // });

          console.log("studentArray :::::::::::::::::::::::",studentArray);

          if (user_role === "Role_Admin") {
            let registerStudentCall = await eventQuery.registerStudentExcel({studentArray});
            console.log("registerStudentCall:::::::::::", registerStudentCall);

            if (registerStudentCall.rowCount > 0) {
              return res.json({
                message: "Registered Students Successfully !!",
                status: "success",
                nonInserted: emptyStudentArray,
              });
            } else {
              return res.json({ message: "Failed To Upload File !!" });
            }
          } else {
            res.clearCookie("jwtauth");
            return res.json({
              status: "error",
              redirectTo: `${res.locals.BASE_URL}elective/loginPage`,
            });
          }
        } else {
          console.log("Array not found");
          return res.json({ message: "File Cannot Be Empty !!" });
        }
      } else {
        return res.json({ status: "File Not Found !!" });
      }
    } catch (err) {
      console.log(err.message);
      return res.json({
        status: "error",
        redirectTo: `${res.locals.BASE_URL}elective/error`,
      });
    }
  },

  registerStudentManually: async (req, res) => {
    try {
      let username = await redisDb.get("user");
      let user_role = await redisDb.get("role");

      let {
        fname,
        lname,
        rollNo,
        campus,
        studUsername,
        acadYear,
        acadSession,
      } = req.body;

      console.log('manually function')
      const validationPromises = [
        validation.fnameValidation(fname),
        validation.lnameValidation(lname),
        validation.campusValidation(campus),
        validation.newAcadYearValidation(acadYear),
        validation.acadSessionValidation(acadSession),
        validation.UsernameValidation(studUsername),
      ];

      const [
        fnameVal,
        lnameVal,
        campusVal,
        acadYearVal,
        sessionVal,
        usernameVal,
      ] = await Promise.all(validationPromises);
      console.log(
        "Validate----roll ",
        campusVal,
        acadYearVal,
        sessionVal
      );
      let studentArray = [];

      if (
        fnameVal &&
        lnameVal &&
        campusVal &&
        acadYearVal &&
        sessionVal &&
        usernameVal
      ) {
        studentFirstName = fname;
        studentLastName = lname;
        studentUname = studUsername;

        console.log(
          "Validated rightly",
          fnameVal,
          lnameVal,
          campusVal,
          acadYearVal,
          sessionVal,
          usernameVal
        );

        console.log('username ',studUsername)
        let checkUsername = await eventQuery.checkUser(studUsername);
        console.log("username :::: " , checkUsername)
        if(checkUsername.rows[0].usercount > 0){
          return res.json({message:'Username Should Be Unique !!'})
        }

        let rollNoVal = rollNo!= undefined ? validation.rollNoValidation(rollNo) : undefined;
         
       if(rollNoVal != undefined){ 
        studentArray.push({
          studentFirstName,
          studentLastName,
          rollNo,
          campus,
          studentUname,
          acadYear,
          acadSession,
          username,
        });
      }else{
        if(!rollNoVal){
          return res.json({
            message: "Invalid Credentials !!",
          });
        }else{
          rollNo = null;

          studentArray.push({
          studentFirstName,
          studentLastName,
          rollNo,
          campus,
          studentUname,
          acadYear,
          acadSession,
          username,
        });
      }
      }

      console.log('manual array ', JSON.stringify(studentArray))

        if (user_role === "Role_Admin") {
          let registerManually = await eventQuery.registerStudentExcel({
            studentArray
          });

          if (registerManually.rowCount > 0) {
            return res.json({
              status: "success",
              message: "Student Registered Successfully !!",
            });
          } else {
            return res.json({
              status: "error",
              message: "Failed To Registered Student !!",
            });
          }
        } else {
          res.clearCookie("jwtauth");
          return res.json({
            status: "error",
            redirectTo: `${res.locals.BASE_URL}elective/loginPage`,
          });
        }
      } else {
        return res.json({
          message: "Invalid Credentials !!",
        });
      }
    } catch (error) {
      console.log(error.message);
      return res.json({
        status: "error",
        redirectTo: `${res.locals.BASE_URL}elective/error`,
      });
    }
  },

  deleteEvent: async (req, res) => {
    try {
      let role = await redisDb.get("role");

      let { eventId } = req.body;

      if (role === "Role_Admin") {
        let deleteEventId = await eventQuery.deleteEvent(eventId);
        if (deleteEventId.rowCount > 0) {
          return res.json({
            status: "success",
            message: "Event Deleted Succesfully !!",
          });
        } else {
          return res.json({ message: "Failed To Delete Event !!" });
        }
      } else {
        res.clearCookie("jwtauth");
        return res.json({
          status: "error",
          redirectTo: `${res.locals.BASE_URL}elective/loginPage`,
        });
      }
    } catch (error) {
      console.log(error);
      return res.json({
        status: "error",
        redirectTo: `${res.locals.BASE_URL}elective/error`,
      });
    }
  },

  editEvent: async (req, res) => {
    try {
      let username = await redisDb.get("user");
      let role = await redisDb.get("role");

      let {
        eventId,
        eventName,
        campus,
        startDate,
        endDate,
        semester,
        acad_year,
      } = req.body;

      let campusValidate = validation.campusValidation(campus);
      let sessionValidate = validation.acadSessionValidation(semester);
      let acadYearValidation = validation.newAcadYearValidation(acad_year);

      console.log(
        "event validation ",
        campusValidate,
        sessionValidate,
        acadYearValidation,
        startDate,
        endDate
      );

      if (
        eventName != undefined &&
        campusValidate &&
        sessionValidate &&
        acadYearValidation &&
        startDate != undefined &&
        endDate != undefined
      ) {
        let start_date = startDate.split("T");
        let end_date = endDate.split("T");

        console.log("start_date ", startDate, "end_date", endDate);

        if (role === "Role_Admin") {
          let eventObj = {
            eventId,
            eventName,
            campus,
            start_date,
            end_date,
            semester,
            acad_year,
            username,
          };
          let upsertEvent = await eventQuery.addEventdata(eventObj);

          if (upsertEvent.rowCount > 0) {
            return res.json({
              status: "success",
              message: "Event Updated Successfully !!",
            });
          } else {
            return res.json({ message: "Failed To Update Event !!" });
          }
        } else {
          res.clearCookie("jwtauth");
          return res.json({
            status: "error",
            redirectTo: `${res.locals.BASE_URL}elective/loginPage`,
          });
        }
      } else {
        return res.json({ message: `Invalid Inputs !!` });
      }
    } catch (error) {
      console.log(error);
      return res.json({
        status: "error",
        redirectTo: `${res.locals.BASE_URL}elective/error`,
      });
    }
  },

  publishEvent: async (req, res) => {
    try {
      let role = await redisDb.get("role");
      let { eventId } = req.body;
      if (role === "Role_Admin") {
        let eventDate = await eventQuery.checkEventDate(eventId);
        console.log("event date: ", eventDate);

        if (eventDate.rows[0].status == true) {
          let publishEvent = await eventQuery.publishEvent(eventId);
          if (publishEvent.rowCount > 0) {
            return res.json({
              status: "success",
              message: "Event Published Successfully !!",
            });
          } else {
            return res.json({ message: "Failed To Publish Event !!" });
          }
        } else {
          return res.json({
            message: "Cannot Publish Event, End Date Is Over !!",
          });
        }
      } else {
        res.clearCookie("jwtauth");
        return res.json({
          status: "error",
          redirectTo: `${res.locals.BASE_URL}elective/loginPage`,
        });
      }
    } catch (error) {
      console.log(error);
      return res.json({
        status: "error",
        redirectTo: `${res.locals.BASE_URL}elective/error`,
      });
    }
  },

  viewPreferences: async (req, res) => {
    try {
      let username = await redisDb.get("user");
      let eventId = req.query.id;
      let modules = await query.getModules(username);
      let viewBasketPreference = await eventQuery.viewPreference(eventId);
      return res.render("viewBasketPreference", {
        module: modules,
        basketPreference: viewBasketPreference.rows,
      });
    } catch (error) {
      console.log("Error " + err.message);
      return res.redirect(`${res.locals.BASE_URL}elective/error`);
    }
  },

  viewBasketPreference: async (req, res) => {
    try {
      let username = await redisDb.get("user");
      let basketId = req.query.id;
      let modules = await query.getModules(username);
      let viewBasketUser = await eventQuery.getBasketPreference(basketId);
      let rowlength = viewBasketUser.length;

      return res.render("viewBasketUserPreference", {
        module: modules,
        basketUser: viewBasketUser.rows,
        dataRows: rowlength,
      });
    } catch (error) {
      console.log("Error " + err.message);
      return res.redirect(`${res.locals.BASE_URL}elective/error`);
    }
  },

  createExcelPreference: async (req, res) => {
    try {
      let basketId = req.query.id;
      let studentList = await eventQuery.getBasketPreference(basketId);
      if (studentList.rowCount > 0) {
        let file = "D:/StudentsPreference.xlsx";
        excelController.createExcel(studentList.rows, file);

        let filePath = path.resolve(__dirname, file);

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", "attachment; filename=" + file);

        return res.sendFile(filePath);
      }
    } catch (error) {
      console.log("Error " + error.message);
      return res.redirect(`${res.locals.BASE_URL}elective/error`);
    }
  },

  adminAllocatingEvents: async (req, res) => {
    try {
      let { eventId } = req.body;
      let result = await eventQuery.adminAllocatingEvents(eventId);

      if (result.rowCount > 0) {
        return res.json({
          status: "success",
          message: "Event Allocated Succesfully !!",
        });
      } else {
        return res.json({ message: "Failed To Allocate Event !!" });
      }
    } catch (error) {
      console.log(error);
      return res.json({
        status: "error",
        redirectTo: `${res.locals.BASE_URL}elective/error`,
      });
    }
  },

  downloadAllocationReport: async (req, res) => {
    try {
      let eventId = req.query.id;
      let allocationData = await eventQuery.getAllocationReport(eventId);
      console.log('allocation data ',allocationData.rowCount)

      if (allocationData.rowCount > 0) {
        let file = "D:/AllocationReport.xlsx";
        excelController.createExcel(allocationData.rows, file);

        let filePath = path.resolve(__dirname, file);

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", "attachment; filename=" + file);

        return res.sendFile(filePath);
      }
    } catch (error) {
      console.log("Error " + error.message);
      return res.redirect(`${res.locals.BASE_URL}elective/error`);
    }
  },

  sendEventMail: async (req, res) => {
    try {
      let { eventId } = req.body;
      console.log('event ',eventId)
      let studentAllocateData = await eventQuery.loadStudentData(eventId);
      console.log('student allocation ',studentAllocateData.rowCount);
      let sendMailResults;
  
      if (studentAllocateData.rowCount > 0) {
        let studentArray =  studentAllocateData.rows;
          studentArray.map(async (data) => {
          let electedEventData = await eventQuery.electedData(data.user_lid, eventId);
          let electedArray = electedEventData.rows;
  
          let sendMailTo = new Array(data.email);
          let subject = `Elected Subjects for Event ${electedEventData.rows[0].event_name} `;
          let message = `<p>Hello ${data.username}, below are the mentioned elected subjects for the Event ${electedEventData.rows[0].event_name}</p>
          <table border="1" style="text-align:center;">
          <tr>
          <th>Sr.No</th>
          <th>Username</th>
          <th>Basket Name</th>
          <th>Elective No</th>
          <th>Subject Name</th>
          <th>Subject Preference</th>
          </tr>
          ${electedArray.map( (data, index) => `
          <tr>
          <td>${index + 1}</td>
          <td>${data.username}</td>
          <td>${data.basket_name}</td>
          <td>${data.elective_no}</td>
          <td>${data.subject_name}</td>
          <td>${data.sub_pref}</td>
          </tr>`).join("")}
          </table>`;
  
          sendMailResults = await Promise.all([emailController.sendMail(sendMailTo, subject, message)]);

        });
         
        // if (sendMailResults.rowCount > 0) {
        //   return res.json({ message: "Emails Sent Successfully !!" });
        // } else {
        //   return res.json({ message: "Failed To Send Emails !!" });
        // }
      } else {
        return res.json({ message: "No Students Found !!" });
      }
    } catch (error) {
      console.log(error);
      return res.json({
        status: "error",
        redirectTo: `${res.locals.BASE_URL}elective/error`,
      });
    }
  },
  
};


module.exports = controller;
