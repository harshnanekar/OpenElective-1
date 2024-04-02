const basket = require("../queries/basketQueries.js");
const query = require("../queries/user.js");
const eventQuery = require("../queries/eventQueries.js");
const validation = require("../controller/validation.js");
const courseQuery = require("../queries/courseQuery.js");
const { redisDb } = require("../config/database.js");
const session = require("express-session");

module.exports = {
  addBasketPage: async (req, res) => {
    try {
      let username_session = session.Session.username;
      let role_session = session.Session.userRole;
	  
	  let username = await redisDb.get(`user_${username_session}`);
      let role = await redisDb.get(`role_${role_session}`);

      let eventId = req.query.id;
      console.log("eventId ", eventId);

      let basketData = await basket.getBasketForEvent(eventId);
      let getmodules = await query.getModules(username);
      let campusData = await eventQuery.getCampus();
      console.log("campus>>> ", campusData.rowCount, basketData.rowCount);

      if (basketData.rowCount > 0) {
        return res.render("addBasket", {
          module: getmodules,
          basket: basketData.rows,
          campus: campusData.rows,
        });
      } else {
        return res.render("addBasket", {
          module: getmodules,
          basket: [],
          campus: campusData.rows,
        });
      }
    } catch (error) {
      return res.redirect(`${res.locals.BASE_URL}elective/error`);
    }
  },

  createBasket: async (req, res) => {
    try {
      let username_session = session.Session.username;
      let role_session = session.Session.userRole;
	  
	  let username = await redisDb.get(`user_${username_session}`);
      let role = await redisDb.get(`role_${role_session}`);

      let { basketName, basketAbbr, eventId } = req.body;

      if (basketName != undefined && basketAbbr != undefined) {
        if (role === "Role_Admin") {
          let basket_abbr = basketAbbr;

          let addbasket = await basket.insertBasket({
            basketName,
            basket_abbr,
            eventId,
            username,
          });
          if (addbasket.rowCount > 0) {
            let bsLid = addbasket.rows[0].createbasket.basketLid;
            console.log("basket added ", addbasket, bsLid);
            return res.json({
              status: "success",
              message: "Basket Created Successfully !!",
              basketLid: bsLid,
            });
          } else {
            console.log("Failed to add basket");
            return res.json({ message: "Failed To Create Basket !!" });
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
      console.log("create basket ", error);
      return res.json({
        status: "error",
        redirectTo: `${res.locals.BASE_URL}elective/error`,
      });
    }
  },

  deleteBasket: async (req, res) => {
    try {
      let role = await redisDb.get("role");

      let { basketId } = req.body;

      if (role === "Role_Admin") {
        let deleteBasketEvent = await basket.deleteBasketEventData(basketId);
        let deleteBasket = await basket.deleteBasketData(basketId);

        if (deleteBasketEvent.rowCount > 0 && deleteBasket.rowCount > 0) {
          return res.json({
            status: "success",
            message: "Basket Deleted Successfully !!",
          });
        } else {
          return res.json({ message: "Failed To Delete Basket !!" });
        }
      } else {
        res.clearCookie("jwtauth");
        return res.json({
          status: "error",
          redirectTo: `${res.locals.BASE_URL}/elective/loginPage`,
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

  editBasket: async (req, res) => {
    try {
      let username_session = session.Session.username;
      let role_session = session.Session.userRole;
	  
	  let username = await redisDb.get(`user_${username_session}`);
      let role = await redisDb.get(`role_${role_session}`);

      let { basket_id, basketName, basket_abbr, eventId } = req.body;

      if (basketName != undefined && basket_abbr != undefined) {
        if (role === "Role_Admin") {
          let basketData = await basket.insertBasket({
            basket_id,
            basket_abbr,
            basketName,
            username,
            eventId,
          });
          if (basketData.rowCount > 0) {
            return res.json({
              status: "success",
              message: "Basket Edited Successfully !!",
            });
          } else {
            return res.json({ message: "Failed To Edit Basket !!" });
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
      console.log("basket error ", error);
      return res.json({
        status: "error",
        redirectTo: `${res.locals.BASE_URL}elective/error`,
      });
    }
  },

  basketCourseConfig: async (req, res) => {
    try {
      let username_session = session.Session.username;
      let role_session = session.Session.userRole;
	  
	  let username = await redisDb.get(`user_${username_session}`);
      let role = await redisDb.get(`role_${role_session}`);
      let eventLid = req.query.id;

      let getModules = await query.getModules(username);
      let getAllCourse = await courseQuery.getAllCourses(username);
      let getAllBaskets = await basket.getAllBaskets(eventLid, username);
      let displayBaskets = await basket.displayAllBaskets(eventLid);

      return res.render("basketCourseConfig", {
        module: getModules,
        course: getAllCourse.rows,
        baskets: getAllBaskets.rows,
        dispBasket: displayBaskets.rows,
      });
    } catch (error) {
      console.log(error);
      return res.redirect(`${res.locals.BASE_URL}elective/error`);
    }
  },

  getBasketSubject: async (req, res) => {
    try {
      let { basketId,eventId } = req.body;

      let getAllCourse = await courseQuery.fetchCourses();
      let basketCourses = await basket.getBasketCourses(basketId);
      let getSelectedCourses = await basket.getSelectedCourses(basketId,eventId)

      console.log('basket course ',basketId,JSON.stringify(basketCourses.rows),JSON.stringify(getAllCourse.rows))

        return res.json({ status: "success", courses: basketCourses.rows,courseList: getAllCourse.rows,assignedCourse:getSelectedCourses.rows});
      
    } catch (error) {
      console.log(error);
      return res.json({
        status: "error",
        redirectTo: `${res.locals.BASE_URL}elective/error`,
      });
    }
  },

  insertBasketCourses: async (req, res) => {
    try {
      let username_session = session.Session.username;
      let role_session = session.Session.userRole;
	  
	  let username = await redisDb.get(`user_${username_session}`);
      let role = await redisDb.get(`role_${role_session}`);

      let { basketId, basketCourses, compulsorySub } = req.body;
      console.log('basket courses')
      console.log(JSON.stringify(basketCourses));

      if (
        basketId != undefined &&
        basketCourses.length > 0 &&
        compulsorySub != undefined
      ) {
        if (role === "Role_Admin") {
          let basketSubject;
          for (let basketCourse of basketCourses) {

            let checkbasketSubject = await basket.checkBasketCourse(basketId,basketCourse);

            if(checkbasketSubject.rowCount > 0){

              basketSubject = await basket.updatebasketSubject(basketId,basketCourse);

            }else{

            basketSubject = await basket.insertBasketSubject(
              basketId,
              basketCourse,
              username
            );
            }
          }

          let compSub = await basket.insertCompulsorySub(
            basketId,
            compulsorySub
          );
          if (basketSubject.rowCount > 0 && compSub.rowCount > 0) {
            return res.json({
              status: "success",
              message: "Courses Added Successfully !!",
            });
          } else {
            return res.json({ message: " FailedTo Insert Data" });
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
      console.log(error);
      return res.json({
        status: "error",
        redirectTo: `${res.locals.BASE_URL}elective/error`,
      });
    }
  },

  deleteEventBasket: async (req, res) => {
    try {
      let role = await redisDb.get("role");

      let { basketId } = req.body;

      if (role === "Role_Admin") {
        let deleteBasketId = await basket.deleteBasketData(basketId);
        if (deleteBasketId.rowCount > 0) {
          res.json({
            status: "success",
            message: "Basket Deleted Successfully !!",
            basketLid: basketId,
          });
        } else {
          res.json({ message: "Failed To Delete Basket !!" });
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

  checkBasketAbbr: async (req, res) => {
    try {
      let { basketAbbr } = req.body;
      let checkabbr = await basket.checkAbbr(basketAbbr);

      console.log(checkabbr);

      if (checkabbr.rowCount > 0) {
        return res.json({
          status: "success",
          message: "*Basket Abbr Must Be Unique",
        });
      } else {
        return res.json({ message: undefined });
      }
    } catch (error) {
      console.log(error);
      return res.json({
        status: "error",
        redirectTo: `${res.locals.BASE_URL}elective/error`,
      });
    }
  },

  assignedBasketCourse: async (req, res) => {
    try {
      let { basketId } = req.body;
      let basketCourse = await basket.assignedBasketCourse(basketId);

      if (basketCourse.rowCount > 0) {
        return res.json({ status: "success", basket: basketCourse.rows });
      } else {
        return res.json({ message: "No Courses Found !!" });
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
