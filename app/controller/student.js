const studentQuery = require('../queries/studentQueries.js');
const userQuery = require("../queries/user.js");
const validationController = require("../controller/validation.js");
const {redisDb} = require("../config/database.js");
const eventQuery = require('../queries/eventQueries.js');
const session = require("express-session");

module.exports = {
  viewStudentEvents: async (req, res) => {
    try {

      let username_session = session.Session.username;
      let role_session = session.Session.userRole;
	  
	    let username = await redisDb.get(`user_${username_session}`);
      let role = await redisDb.get(`role_${role_session}`);

        let getStudentEvent = await studentQuery.getStudentEvent(username);
        let getmodules = await userQuery.getModules(username);

        return res.render("viewStudentEvent", {
          module: getmodules,
          event: getStudentEvent.rows,
        });
    } catch (error) {
      console.log(error.message);
      return res.redirect(`${res.locals.BASE_URL}elective/error`);
    }
  },

  checkEventBeforeSelection: async (req, res) => {
    try {
        let { eventId } = req.body;

      let username_session = session.Session.username;
      let role_session = session.Session.userRole;
	  
	    let username = await redisDb.get(`user_${username_session}`);
      let role = await redisDb.get(`role_${role_session}`);

        let getEvent = await eventQuery.getEventData(eventId);
        let checkEventSelected = await eventQuery.checkEventSelected(eventId,username);

        console.log('checkEventSelected ',checkEventSelected)
        if(checkEventSelected.rowCount > 0){
          return res.json({ message: `The Event's Subjects Have Been Selected!!` });
        }

        console.log('Event:', getEvent.rows);

        const startDateUTC = new Date(getEvent.rows[0].startdate);
        const endDateUTC = new Date(getEvent.rows[0].end_date);
        const currentDate = new Date();


       const startDateLocal = startDateUTC.toLocaleString();
       const endDateLocal = endDateUTC.toLocaleString();
       const currentDateLocal = currentDate.toLocaleString();

       console.log('startdate and enddate ',startDateLocal,endDateLocal,currentDateLocal)

    
            if (currentDateLocal >= startDateLocal && currentDateLocal <= endDateLocal) {
                return res.json({ status: 'success', redirectTo: `${res.locals.BASE_URL}elective/startCourseSelection` });
            } else {
                return res.json({ message: 'Cannot Elect Event!!' });
            }
     
    } catch (error) {
        console.log(error.message);
        return res.json({ status: "Error", redirectTo: `${res.locals.BASE_URL}elective/error` });
    }
},


  startCourseSelection: async (req, res) => {
    try {

      let username_session = session.Session.username;
      let role_session = session.Session.userRole;
	  
	    let username = await redisDb.get(`user_${username_session}`);
      let role = await redisDb.get(`role_${role_session}`);

        let eventId = req.query.id;


        console.log(eventId, username);
        let displayBasket = await studentQuery.displayBasket(eventId, username);
        let showYearBackSubjects = await studentQuery.showYearBackSubjects(
          username,
          eventId
        );
        console.log('showyearbacksubjects ',JSON.stringify(showYearBackSubjects))
        let getModules = await userQuery.getModules(username);

        return res.render("selectBasket", {
          module: getModules,
          showBasket: displayBasket.rows,
          yearBackSubjects: showYearBackSubjects.rows,
        });
    } catch (error) {
      console.log(error.message);
      return res.redirect(`${res.locals.BASE_URL}elective/error`);
    }
  },

  insertStudentCourses: async (req, res) => {
    try {

      let username_session = session.Session.username;
      let role_session = session.Session.userRole;
	  
	    let username = await redisDb.get(`user_${username_session}`);
      let role = await redisDb.get(`role_${role_session}`);
    
        let { eventLid, timeString, courseArray, userLid, basketLid } =
          req.body;
        let basketObj = {
          eventLid,
          timeString,
          courseArray,
          userLid,
          basketLid,
        };
        console.log(
          JSON.stringify({
            eventLid,
            timeString,
            courseArray,
            userLid,
            basketLid,
          })
        );

        let redisData = await redisDb.set(
          "basketData",
          JSON.stringify(basketObj),
          { EX: 2592000 }
        );
        let insertStudentBasket = await studentQuery.insertStudentCourse(
          JSON.stringify(basketObj)
        );

        let nextBasketData = insertStudentBasket.rows;
       
        let yearBackSubjects = await studentQuery.showYearBackSubjects(
          username,
          eventLid
        );

        if (insertStudentBasket.rowCount > 0) {
          console.log(insertStudentBasket);
          return res.json({
            status: "success",
            basketData: nextBasketData,
            yearBackSubjects: yearBackSubjects.rows,
          });
        } else {
          let redisBasketData = await redisDb.get("basketData");
          await studentQuery.insertStudentCourse(
            JSON.stringify(redisBasketData)
          );
          return res.json({ message: "Failed to insert !!" });
        }
    } catch (error) {
      console.log(error.message);
      return res.json({ status: "Error", redirectTo: `${res.locals.BASE_URL}elective/error` });
    }
  },

  viewStudentElectedEvents: async (req, res) => {
    try {

      let username_session = session.Session.username;
      let role_session = session.Session.userRole;
	  
	    let username = await redisDb.get(`user_${username_session}`);
      let role = await redisDb.get(`role_${role_session}`);
    
        let eventId = req.query.id;
        let getModules = await userQuery.getModules(username);
        let viewElectedStudentBasket =
          await studentQuery.viewStudentElectedBasket(eventId,username);
          console.log(JSON.stringify(viewElectedStudentBasket.rows));

        return res.render("ViewAllocatedEvents", {
          module: getModules,
          electedEvent: viewElectedStudentBasket.rows,
        });
    } catch (error) {
      console.log(error.message);
      return res.redirect(`${res.locals.BASE_URL}elective/error`);
    }
  },

  viewElectedEvents: async (req,res) => {
    try {

      let username_session = session.Session.username;
      let role_session = session.Session.userRole;
	  
	    let username = await redisDb.get(`user_${username_session}`);
      let role = await redisDb.get(`role_${role_session}`);

     let electedEvents = await studentQuery.viewStudentElectedEvent(username); 
     let rowlength = electedEvents.length;
     let getModules = await userQuery.getModules(username);
     return res.render('viewElectedEvent',{module:getModules,event:electedEvents.rows,dataRows:rowlength});

    } catch (error) {
      console.log(error.message);
      return res.redirect(`${res.locals.BASE_URL}elective/error`);
    }
  }
};