const apiRouter = require('express').Router();
const controller = require('../controller/user.js');
const middleware = require('../middleware/request.js');
const eventController = require('../controller/event.js');
const programController = require('../controller/programs.js');
const courseController = require('../controller/course.js');
const basketController = require('../controller/basket.js');
const studentController = require('../controller/student.js');

const multer = require('multer');

//Get Requests
apiRouter.get('/loginPage',controller.loginPage);
apiRouter.get('/error',controller.errorPage);
apiRouter.get('/dashboard',middleware.verifyRequest,controller.dashboard);
apiRouter.get('/logout',controller.logout);
apiRouter.get('/event',middleware.verifyRequest,eventController.event);
apiRouter.get('/addEvent',middleware.verifyRequest,eventController.addEvent);
apiRouter.get('/viewEvent',middleware.verifyRequest,eventController.viewEvent);
apiRouter.get('/register',middleware.verifyRequest,eventController.registerStudent);
apiRouter.get('/programs',middleware.verifyRequest,programController.programs);
apiRouter.get('/addPrograms',middleware.verifyRequest,programController.addPrograms);
apiRouter.get('/viewPrograms',middleware.verifyRequest,programController.viewPrograms);
apiRouter.get('/course',middleware.verifyRequest,courseController.addCourses);
apiRouter.get('/getAllCourses',middleware.verifyRequest,courseController.getAllCourses);
apiRouter.get('/programList',middleware.verifyRequest,programController.getAllProgramsList);
apiRouter.get('/addBasketPage',middleware.verifyRequest,basketController.addBasketPage);
apiRouter.get('/basketCourseConfig',middleware.verifyRequest,basketController.basketCourseConfig);
apiRouter.get('/viewStudentEvents',middleware.verifyRequest,studentController.viewStudentEvents);
apiRouter.get('/startCourseSelection',middleware.verifyRequest,studentController.startCourseSelection);
apiRouter.get('/viewStudentElectedEvents',middleware.verifyRequest,studentController.viewStudentElectedEvents);
apiRouter.get('/viewElectedEvents',middleware.verifyRequest,studentController.viewElectedEvents);
apiRouter.get('/viewPreferences',middleware.verifyRequest,eventController.viewPreferences);
apiRouter.get('/viewBasketPreference',middleware.verifyRequest,eventController.viewBasketPreference);
apiRouter.get('/createExcelPreference',middleware.verifyRequest,eventController.createExcelPreference);
apiRouter.get('/viewProfile',middleware.verifyRequest,controller.viewProfile)
apiRouter.get('/downloadAllocationReport',middleware.verifyRequest,eventController.downloadAllocationReport);
apiRouter.get('/programsList',middleware.verifyRequest,programController.programsList);
apiRouter.get('/viewStudents',middleware.verifyRequest,controller.viewStudents);
apiRouter.get('/editProfile',middleware.verifyRequest,controller.editProfile);
apiRouter.get('/analytics',middleware.verifyRequest,eventController.analytics);

//testing
apiRouter.get('/getSvelte',controller.getSvelte)


//Post Requests
apiRouter.post('/login',controller.login);
apiRouter.post('/eventData',middleware.verifyRequest,eventController.eventData);
apiRouter.post('/editEvent',middleware.verifyRequest,eventController.editEvent);
apiRouter.post('/publishEvent',middleware.verifyRequest,eventController.publishEvent)
apiRouter.post('/uploadStudentData',middleware.verifyRequest,multer().single('studentDetails'),eventController.uploadStudentData);
apiRouter.post('/registerStudentManually',middleware.verifyRequest,eventController.registerStudentManually);
apiRouter.post('/insertProgramsViaExcel',middleware.verifyRequest,multer().single('programFile'),programController.insertProgramsViaExcel);
apiRouter.post('/insertprogramManually',middleware.verifyRequest,programController.insertProgramManaully);
apiRouter.post('/deleteProgram',middleware.verifyRequest,programController.deleteProgram);
apiRouter.post('/insertCourseViaExcel',middleware.verifyRequest,multer().single('courseDetails'),courseController.insertCourseViaExcel);
apiRouter.post('/insertCourseManually',middleware.verifyRequest,courseController.insertCourseManually);
apiRouter.post('/allocatePrograms',middleware.verifyRequest,courseController.allocatePrograms);
apiRouter.post('/commonDelete',middleware.verifyRequest,courseController.commonCourseDelete);
apiRouter.post('/getAllCoursePrograms',middleware.verifyRequest,courseController.getAllCoursePrograms);
apiRouter.post('/editCourse',middleware.verifyRequest,courseController.editCourse);
apiRouter.post('/deleteCourse',middleware.verifyRequest,courseController.deleteCourse);
apiRouter.post('/createBasket',middleware.verifyRequest,basketController.createBasket);
apiRouter.post('/deleteBasket',middleware.verifyRequest,basketController.deleteBasket);
apiRouter.post('/editBasket',middleware.verifyRequest,basketController.editBasket);
apiRouter.post('/deleteEvent',middleware.verifyRequest,eventController.deleteEvent);
apiRouter.post('/getBasketSubject',middleware.verifyRequest,basketController.getBasketSubject);
apiRouter.post('/insertBasketCourses',middleware.verifyRequest,basketController.insertBasketCourses);
apiRouter.post('/deletEventBasket',middleware.verifyRequest,basketController.deleteEventBasket);
apiRouter.post('/checkBasketAbbr',middleware.verifyRequest,basketController.checkBasketAbbr);
apiRouter.post('/insertStudentCourses',middleware.verifyRequest,studentController.insertStudentCourses);
apiRouter.post('/assignedBasketCourse',middleware.verifyRequest,basketController.assignedBasketCourse);
apiRouter.post('/checkProgramId',middleware.verifyRequest,programController.checkProgramId);
apiRouter.post('/checkUsernameForOtp',controller.checkUsernameForOtp);
apiRouter.post('/checkOtpFromUser',controller.checkOtpFromUser); 
apiRouter.post('/resetPass',controller.resetPass);
apiRouter.post('/adminAllocatingEvents',middleware.verifyRequest,eventController.adminAllocatingEvents);
apiRouter.post('/insertProfileDetails',middleware.verifyRequest,controller.insertProfileDetails);
apiRouter.post('/sendEventMail',middleware.verifyRequest,eventController.sendEventMail);
apiRouter.post('/checkEventBeforeSelection',middleware.verifyRequest,studentController.checkEventBeforeSelection)
apiRouter.post('/fetchAnalyticsData',middleware.verifyRequest,eventController.fetchAnalyticsData);


//testing0
apiRouter.post('/addCampus',controller.addCampus);

module.exports = apiRouter;