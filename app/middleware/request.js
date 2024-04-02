const jwt = require("jsonwebtoken");
const controller = require("../controller/user.js");
const { redisDb } = require("../config/database.js");
const session = require("express-session");

module.exports = {
  verifyLogin: (cookietoken, res) => {
    let secretkey = process.env.JWT_SECRETKEY;

    console.log(cookietoken, " cookietoken");
    if (cookietoken == undefined) {
      res.clearCookie("jwtauth");
      return "invalid";
    } else {
      try {
        let verified = jwt.verify(cookietoken, secretkey);
        console.log("jwt verifier--- ", verified);
        return verified;
      } catch (error) {
        res.clearCookie("jwtauth");
        return res.redirect(`${res.locals.BASE_URL}elective/loginPage`);
      }
    }
  },

  verifyRequest: async (req, res, next) => {
    try {
      let token = process.env.JWT_SECRETKEY;
      let cookietoken = req.signedCookies.jwtauth || undefined;

      console.log("request cookie", cookietoken);

      let username_session = session.Session.username;
      let role_session = session.Session.userRole;
      console.log('username role in session ',username_session,role_session)

      console.log("SESSION IN MIDDLEWARE: ",{
        username_session,role_session
      });

      let verified = jwt.verify(cookietoken, token);
      let username = await redisDb.get(`user_${username_session}`);
      let role = await redisDb.get(`role_${role_session}`);

      console.log('username and role in midlleware ',verified,username,role )
      
      if (verified && username != undefined && role != undefined) {
        next();
      } else {
        res.clearCookie("jwtauth");
        return res.redirect(`${res.locals.BASE_URL}elective/loginPage`);
      }
    } catch (error) {
      res.clearCookie("jwtauth");
      return res.redirect(`${res.locals.BASE_URL}elective/loginPage`);
    }
  },
};
