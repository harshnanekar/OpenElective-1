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

  getUserObj : async(req, res) => {
    let token = process.env.JWT_SECRETKEY;
    let cookietoken = req.signedCookies.jwtauth || undefined;

    let verified = jwt.verify(cookietoken, token);
    let username = verified.username;
    let role = verified.role[0].role_name;
    return {username , role}
  },

  verifyRequest: async (req, res, next) => {
    try {
      let token = process.env.JWT_SECRETKEY;
      let cookietoken = req.signedCookies.jwtauth || undefined;

      let verified = jwt.verify(cookietoken, token);
      let username_session = verified.username;
      let role_session = verified.role[0].role_name;

      console.log("JWT IN MIDDLEWARE: ",verified);
      
      if (verified) {
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
