const userQuery = require("../queries/user.js");
const query = require("../queries/eventQueries.js");
const excel = require("../controller/excel.js");
const courseQuery = require("../queries/courseQuery.js");
const validation = require("../controller/validation.js");
const programQuery = require("../queries/programQueries.js");
const Validation = require("../controller/validation.js");
const {redisDb} = require("../config/database.js");
const session = require("express-session");


module.exports = {
  addCourses: async (req, res) => {
    try {

      let username = session.Session.username;
      let role = session.Session.userRole;

        let getmodules = await userQuery.getModules(username);
        let campus = await query.getCampus();
        return res.render("course", {
          module: getmodules,
          campus: campus.rows,
        });
   
    } catch (error) {
      console.log(error);
      return res.redirect(`${res.locals.BASE_URL}elective/error`);
    }
  },

  insertCourseViaExcel: async (req, res) => {
    try {

      let username = session.Session.username;
      let role = session.Session.userRole;
   
        let file = req.file;
        if (file != undefined) {
           let subjectColumn = 'Subject_Name';
           let departmentColumn = 'Department_Name';
           let campusColumn = 'Campus';
           let batchColumn = 'No_Of_Batches';
           let maxcapacityColumn = 'Max_Capacity_Per_Batch';
           let mincapacityColumn = 'Min_Capacity_Per_Batch';
           let openColumn = 'Open_To_All_Programs';
        
           let courseExcel= {subjectColumn,departmentColumn,campusColumn,batchColumn,maxcapacityColumn,mincapacityColumn,openColumn};
           let excelData = excel.readExcelFile(file);
      
          if (excelData.length > 0) {
           
           let excelHeaderKeys = excelData[0];
           let excelHeader =Object.keys(excelHeaderKeys);

           if(Object.keys(courseExcel).length == excelHeader.length){
           for (let data of excelHeader) {
            if (!Object.values(courseExcel).includes(data)) {
                return res.json({ status: 'fileError', message: 'Invalid Excel Format !!' });
            }
           }
           }else{
            return res.json({ status: 'fileError', message: 'Invalid Excel Format!!' });
           }

            excelData.forEach(async (data) => {
              let subName = new String(data.Subject_Name);
              let deptName = new String(data.Department_Name);
              let campusName = new String(data.Campus);
              let batches = new String(data.No_Of_Batches);
              let maxCapacity = new String(data.Max_Capacity_Per_Batch);
              let minCapacity =new String(data.Min_Capacity_Per_Batch);
              let openToPrograms = new String(data.Open_To_All_Programs);

              let subjectName = subName ? subName.trim() : undefined;
              let departMentName = deptName ? deptName.trim() : undefined;
              let campus = campusName ? campusName.trim() : null;
              let batchNo = batches ? batches.trim() : undefined;
              let maxCapacityPerBatch = maxCapacity
                ? maxCapacity.trim()
                : undefined;
              let minCapacityperBatch = minCapacity
                ? minCapacity.trim()
                : undefined;  
              let openToAllPrograms = openToPrograms
                ? openToPrograms.trim()
                : undefined;
              let openPrograms;  

              let subjectValidation = subjectName ? Validation.courseNameValidator(subjectName) : false;
              let departmentValidation = departMentName ? Validation.alphabetValidation(departMentName) : false;
              let campusValidation = campus ? Validation.campusValidation(campus) : false ;
              let batchValidation = batchNo ? Validation.NumberValidation(batchNo) : false;
              let maxValidation = maxCapacityPerBatch ? Validation.NumberValidation(maxCapacityPerBatch) : false;
              let minValidation = minCapacityperBatch ? Validation.NumberValidation(minCapacityperBatch) : false;
              let checkMinCapacity; 

              // if(minValidation){
              //    if (minCapacity < maxCapacity) { 
              //     checkMinCapacity= true 
              //   }else{ 
              //     checkMinCapacity= false 
              //   };
              // }

              console.log('subject validation ',checkMinCapacity,minCapacityperBatch,maxCapacityPerBatch)

              if (
                subjectValidation &&
                departmentValidation &&
                batchValidation &&
                maxValidation &&
                // checkMinCapacity &&
                openToAllPrograms != undefined
              ) {
                openPrograms = openToAllPrograms === "Yes" ? "Y" : "N";

                if (role === "Role_Admin") {
                  console.log("course campus ",campus)
                  let insertCourseQuery = await courseQuery.insertCourse(
                    subjectName,
                    departMentName,
                    batchNo,
                    maxCapacityPerBatch,
                    minCapacityperBatch,
                    campus,
                    openPrograms,
                    username
                  );
                  console.log("subject ids of excel", insertCourseQuery.rows);
                  let subjectArrayId = insertCourseQuery.rows;

                  let courseArray = subjectArrayId.map((arr) => ({
                    subjectId: arr.sub_id,
                    username: username,
                  }));

                  if (openPrograms === "Y") {
                    let insertCoursePrograms =
                      courseQuery.subjectProgram(courseArray);

                    if (insertCoursePrograms != undefined) {
                      return res.json({
                        status: "success",
                        message: "Course Uploaded Successfully !!",
                      });
                    } else {
                      return res.json({
                        message: "Error, Failed To Add Programs !!",
                      });
                    }
                  } else {
                    return res.json({
                      status: "success",
                      message: "Course Uploaded Successfully !!",
                    });
                  }
                } else {
                  res.clearCookie("jwtauth");
                  return res.json({
                    status: "error",
                    redirectTo: `${res.locals.BASE_URL}elective/loginPage`,
                  });
                }
              }else{
                return res.json({message:'Invalid Input Fields !!'})
              }
            });
          } else {
            console.log("Array Not Found");
            return res.json({ message: "File Should Not Be Empty !!" });
          }
        } else {
          return res.json({ message: "File Not Found" });
        }
    
    } catch (error) {
      console.log(error);
      return res.json({ status: "error", redirectTo: `${res.locals.BASE_URL}elective/error` });
    }
  },

  getAllCourses: async (req, res) => {
    try {

      let username = session.Session.username;
      let role = session.Session.userRole;

     
        let courseData = await courseQuery.getCourses(username);

        if (courseData.rowCount > 0) {
          return res.json({ courseData: courseData.rows });
        } else {
          return res.json({ courseData: [] });
        }

    } catch (error) {
      console.log(error);
      return res.json({ status: "error", redirectTo: `${res.locals.BASE_URL}elective/error` });
    }
  },

  insertCourseManually: async (req, res) => {
    try {

      let username = session.Session.username;
      let role = session.Session.userRole;


        let {
          subjectName,
          department,
          batches,
          batchCapacity,
          batchMinCapacity,
          campus,
          radioTypeValue,
        } = req.body;
        let subjectValidation = subjectName.length > 0 ? true : false;
        let departmentValidation = validation.departmentValidator(department);
        let batchValidation = validation.batchValidater(batches);
        let batchCapacityValidation =
          validation.batchCapacityValidater(batchCapacity);
        let batchMinValidation = validation.batchMinValidator(batchMinCapacity);

        if (
          subjectValidation &&
          departmentValidation &&
          batchValidation &&
          batchCapacityValidation &&
          batchMinValidation
        ) {
          let radioYesNoValue = radioTypeValue === "Yes" ? "Y" : "N";

          if (role === "Role_Admin") {
            let insertCourse = await courseQuery.insertCourse(
              subjectName,
              department,
              batches,
              batchCapacity,
              batchMinCapacity,
              campus,
              radioYesNoValue,
              username
            );
            let subjectArrayId = insertCourse.rows;

            let courseArray = subjectArrayId.map((arr) => ({
              subjectId: arr.sub_id,
              username: username,
            }));

            if (radioYesNoValue === "Y") {
              let insertCoursePrograms =
                courseQuery.subjectProgram(courseArray);

              if (insertCoursePrograms != undefined) {
                return res.json({
                  status: "success",
                  radioType: "Yes",
                  message: "Course Uploaded Successfully !!",
                });
              } else {
                return res.json({
                  message: "Error, Failed To Add Programs !!",
                });
              }
            } else {
              return res.json({
                status: "success",
                redirectTo:
                `${res.locals.BASE_URL}elective/programList?id=` + courseArray[0].subjectId,
                radioType: "No",
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
          return res.json({ message: "Invalid Inputs !!" });
        }
    
    } catch (error) {
      return res.json({ status: "error", redirectTo: `${res.locals.BASE_URL}elective/error` });
    }
  },

  allocatePrograms: async (req, res) => {
    try {

      let username = session.Session.username;
      let role = session.Session.userRole;

        let { programArray } = req.body;
        console.log("program array::: ", programArray);

        if (role === "Role_Admin") {
          const promises = programArray.map(async (arr) => {
            courseQuery.allocateCoursePrograms(
              arr.subjectId,
              arr.programId,
              username
            );
          });

          Promise.all(promises)
            .then(() => {
              return res.json({
                status: "success",
                message: "Programs Allocated Succesfully !!",
              });
            })
            .catch((error) => {
              return res.json({
                status: "error",
                redirectTo: `${res.locals.BASE_URL}elective/error`,
              });
            });
        } else {
          res.clearCookie("jwtauth");
          return res.json({
            status: "error",
            redirectTo: `${res.locals.BASE_URL}elective/loginPage`,
          });
        }
    } catch (error) {
      return res.json({ status: "error", redirectTo: `${res.locals.BASE_URL}elective/error` });
    }
  },

  commonCourseDelete: async (req, res) => {
    try {
      let role = await redisDb.get('role');

        let { courseArray } = req.body;

        if (role === "Role_Admin") {
          courseArray.forEach(async (course) => {
            await courseQuery.deleteCourseMapping(course);
            await courseQuery.deleteCourse(course);
          });

          return res.json({
            status: "success",
            message: "Course deleted Successfully !!",
          });
        } else {
          res.clearCookie("jwtauth");
          return res.json({
            status: "error",
            redirectTo: `${res.locals.BASE_URL}elective/loginPage`,
          });
        }
  
    } catch (error) {
      return res.json({ status: "error", redirectTo: `${res.locals.BASE_URL}elective/error` });
    }
  },

  getAllCoursePrograms: async (req, res) => {
    try {

      let username = session.Session.username;
      let role = session.Session.userRole;
    
        let { subId } = req.body;
        let coursePrograms = await courseQuery.getAllCourseProgram(subId);

        if (coursePrograms.rowCount > 0) {
          return res.json({ coursePrograms: coursePrograms.rows });
        } else {
          let allPrograms = await programQuery.getAllProgramsList(username);
          return res.json({ coursePrograms: allPrograms.rows });
        }
    } catch (error) {
      console.log("programs error ", error);
      return res.json({ status: "error", redirectTo: `${res.locals.BASE_URL}elective/error` });
    }
  },

  editCourse: async (req, res) => {
    try {
      
      let username = session.Session.username;
      let role = session.Session.userRole;

        console.log("function called");
        let {
          subjectId,
          subName,
          deptName,
          batch,
          capacity,
          minBatch,
          campus,
          programs,
        } = req.body;

        let departmentValidation = Validation.departmentValidator(deptName);
        let capacityValidation = Validation.batchCapacityValidater(capacity);
        let batchValidation = Validation.batchValidater(batch);
        let minBatchValidation =Validation.batchMinValidator(minBatch);

        console.log(
          "subid>>>>> ",
          subjectId,
          departmentValidation,
          capacityValidation,
          batchValidation
        );

        console.log("programs >>>>>>> ", JSON.stringify(programs));
        if (
          subName != undefined &&
          departmentValidation &&
          batchValidation &&
          capacityValidation &&
          minBatchValidation &&
          programs.length > 0
        ) {
          if (role === "Role_Admin") {
            let insertCourse = await courseQuery.updateCourse(
              subName,
              deptName,
              batch,
              capacity,
              minBatch,
              campus,
              username,
              subjectId
            );
           
            let upsertPrograms;
            let placeholders;

            placeholders = programs
            .map((id, index) => `$${index + 2},`)
            .join("");
          placeholders = placeholders.substring(0, placeholders.length - 1);

          console.log("placeholder ",JSON.stringify(placeholders))
          upsertPrograms =await courseQuery.deleteCourseProgram(
                  subjectId,
                  programs,
                  placeholders
                )
              for (let i = 0; i < programs.length; i++) {
                let checkCourseWithProgram =
                  await courseQuery.checkCourseWithProgram(
                    subjectId,
                    programs[i]
                  );
               
                console.log("checkCourseWithPrograms, ",checkCourseWithProgram)

                if (checkCourseWithProgram.rows[0].subjectcount > 0) {
                  upsertPrograms = await courseQuery.updateSubjectProgram(
                    subjectId,
                    programs[i],
                    username
                  );
                } else {
                  upsertPrograms = await courseQuery.allocateCoursePrograms(
                    subjectId,
                    programs[i],
                    username
                  );
                }
              }

              
            if (
              (insertCourse.rowCount > 0 && upsertPrograms.rowCount > 0) ||
              upsertPrograms != undefined
            ) {
              return res.json({
                status: "success",
                message: "Course Updated SuccessFully !!",
              });
            } else {
              return res.json({ message: "Failed To Upload Course !! " });
            }
          } else {
            res.clearCookie("jwtauth");
            return res.json({
              status: "error",
              redirectTo: `${res.locals.BASE_URL}elective/loginPage`,
            });
          }
        } else {
          return res.json({ message: "Invalid Inputs !!" });
        }
    } catch (error) {
      console.log("error in course programs ", error);
      return res.json({ status: "error", redirectTo: `${res.locals.BASE_URL}elective/error` });
    }
  },

  deleteCourse: async (req, res) => {
    try {
      let role = await redisDb.get('role');

      console.log('delete api called')

        if (role === "Role_Admin") {
          let { subjectId } = req.body;
          let deleteCourseProgram = await courseQuery.deleteCourseMapping(
            subjectId
          );
          let deleteCourse = await courseQuery.deleteCourse(subjectId);

          if (deleteCourseProgram.rowCount > 0 && deleteCourse.rowCount > 0) {
            return res.json({
              status: "success",
              message: "Course Deleted Successfully !!",
            });
          } else {
            return res.json({ message: "Failed To Delete Course" });
          }
        } else {
          res.clearCookie("jwtauth");
          return res.json({
            status: "error",
            redirectTo: `${res.locals.BASE_URL}elective/loginPage`,
          });
        }
    } catch {
      return res.json({ status: "error", redirectTo: `${res.locals.BASE_URL}elective/error` });
    }
  },
};
