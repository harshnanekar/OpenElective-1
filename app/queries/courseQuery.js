const { pgPool } = require('../config/database.js');

module.exports = class CourseQuery {

static insertCourse(subjectName,departMentName,batchNo,maxCapacityPerBatch,minCapacityperBatch,campus,openPrograms,username){
 let query = {
    text : `insert into subject_master(subject_name,dept_name,batches,max_capacity_per_batch,min_capacity_per_batch,campus_lid,open_to_allprograms,
            createdby,created_date,modifiedby,modified_date,active) values ($1,$2,$3,$4,$5,(select campus_id from campus where campus_name = $6),
            $7,$8,now(),$9,now(),true)
            returning sub_id;`,
    values :[subjectName,departMentName,batchNo,maxCapacityPerBatch,minCapacityperBatch,campus,openPrograms,username,username]
 }   
 return pgPool.query(query);
}

static updateSubjectProgram(subjectId,programId,username){
       let query={
        text:`update subject_program_mapping set program_lid=$1,modifiedby=$2,modified_date=now(),active=true
        where subject_lid=$3 and program_lid=$4`,
        values:[programId,username,subjectId,programId]  
       }
       return pgPool.query(query);
 }

static getCourses(username){
 let query={
  text: `SELECT s.sub_id, s.subject_name,COALESCE(c.campus_name, 'No Campus Assigned') AS campus_name,s.open_to_allprograms,s.dept_name,s.max_capacity_per_batch,s.min_capacity_per_batch,s.batches,s.campus_lid
  FROM public.subject_master s LEFT JOIN campus c ON s.campus_lid = c.campus_id WHERE s.createdby =$1 AND s.active = true AND (c.active = true OR c.active IS NULL) 
  ORDER BY s.subject_name asc`,
  values:[username]  
 }   
 return pgPool.query(query);
}

static subjectProgram(courseData){
 let query = {
  text :`select subject_program($1)`,
  values: [JSON.stringify(courseData)]  
 }   
 return pgPool.query(query);
}

static allocateCoursePrograms(subjectId,programId,username){
 let query={
  text:`insert into subject_program_mapping(subject_lid,program_lid,createdby,created_date,modifiedby,modified_date,active)
        values($1,$2,$3,now(),$4,now(),true)`,
  values:[subjectId,programId,username,username]  
 }
 return pgPool.query(query);
}

static deleteCourse(courseId){
let query={
 text:`update subject_master set active=false where sub_id = $1`,
 values:[courseId]   
}
return pgPool.query(query);    
}

static deleteCourseMapping(courseId){
 let query ={
  text : `update subject_program_mapping set active=false where subject_lid = $1`,
  values:[courseId]  
 }  
 return pgPool.query(query); 
}

static async deleteCourseProgram(subjectId,programs,placeholders){
 console.log('delete program ' , placeholders,subjectId,JSON.stringify(programs))

 let query ={
 text : `update subject_program_mapping set active=false where subject_lid =$1 and program_lid not in (${placeholders})`,
 values:[subjectId,...programs]  
 }  
 return pgPool.query(query);  
}

static getAllCourseProgram(subId){
 let query= {
  text: `select p.program_id,p.program_name from subject_program_mapping s inner join program_master p on s.program_lid = p.program_id 
         where s.subject_lid = $1 and s.active = true and p.active =true;`,
  values:[subId]  
 }
 return pgPool.query(query);   
}

static updateCourse(subName,deptName,batches,capacity,minBatch,campus,username,subjectId){
 let query = {
  text: `update subject_master set subject_name= $1,dept_name=$2,batches=$3,max_capacity_per_batch=$4,
  min_capacity_per_batch=$5,campus_lid=(select campus_id from campus where campus_name=$6),modifiedby=$7,modified_date=now()
  where sub_id=$8`,
  values:[subName,deptName,batches,capacity,minBatch,campus,username,subjectId]
 }  
 return pgPool.query(query); 
}

static async checkCourseWithProgram(subId,program){
 let query ={
  text: `select count(*) as subjectCount from subject_program_mapping where subject_lid=$1 and 
         program_lid in ($2)`,
  values:[subId,program]            
 }
 return pgPool.query(query);       
}

static async getProgramId(program,username){
  let query = {
   text:`select program_id from program_master where program_id=$1 and active=true and createdby =$2`,
   values:[program,username]     
  }    
  return pgPool.query(query);  
}

static getAllCourses(username){
 let query = {
  text:`select sub_id,subject_name from subject_master where createdby=$1 and active = true order by subject_name asc`,     
  values:[username]
 }      
 return pgPool.query(query);
}

static fetchCourses(){
  let query ={
    text:`select * from subject_master where active=true order by subject_name asc`,    
  }     
  return pgPool.query(query);
}





}