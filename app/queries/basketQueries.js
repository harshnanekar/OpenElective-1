const {pgPool} = require('../config/database.js');

module.exports = class Basket{

static getBasketForEvent(eventId){

 let query = {   
 text:`select ba.id,ba.basket_name,ba.basket_abbr,c.campus_name from basket_event b inner join event_master e on 
 b.event_lid = e.id inner join basket ba on ba.id = b.basket_lid inner join campus c on b.campus_lid = c.campus_id
 where b.event_lid = $1 and b.active=true and e.active=true and ba.active=true and c.active=true`,
 values:[eventId]   
 }

 return pgPool.query(query);
}

static insertBasket(basketdata){
   let query = {
    text:`select createbasket($1)`,
    values:[JSON.stringify(basketdata)]
   } 
   return pgPool.query(query);
}

static deleteBasketEventData(basketId){
  let query = {
   text:`update basket_event set active=false where basket_lid=$1`,
   values:[basketId] 
  }  
  return pgPool.query(query);
} 

static deleteBasketData(basketId){
   let query ={
    text:`update basket set active=false where id = $1`,
    values:[basketId]
   } 
   return pgPool.query(query);
}

static getAllBaskets(eventId,username){
  let query = {
    text : `select b.id,b.basket_name from basket b inner join basket_event be on b.id=be.basket_lid where be.event_lid = $1 and be.active =true and b.active=true and b.createdby=$2`,
    values:[eventId,username]
  }
  return pgPool.query(query);  
}

static displayAllBaskets(eventId){
  let query ={
    text:`select b.id,b.basket_name,c.campus_name,s.current_session,be.basket_elective_no,be.no_of_comp_sub from basket_event be inner join basket b on be.basket_lid = b.id 
    inner join event_master e on be.event_lid=e.id inner join campus c on e.campus_lid = c.campus_id inner join session_master s on e.session_lid = s.sem_id where 
    be.active = true and b.active=true and e.active=true and c.active=true and s.active=true and be.event_lid=$1`,
    values:[eventId]
  }  
  return pgPool.query(query);
}

static getBasketCourses(basketLid){
 let query = {
  text:`select sub_id,subject_name from subject_master where sub_id not in (select s.sub_id from basket_event be inner join basket_subject bs on be.basket_lid=bs.basket_lid inner join subject_master s 
    on s.sub_id=bs.subject_lid where be.event_lid in(select e.id from event_master e inner join basket_event bse on e.id=bse.event_lid where bse.basket_lid =$1 and e.active=true and bse.active=true) 
    and be.active=true and bs.active=true and s.active=true) and active=true`,
  values:[basketLid]  
 }   
 return pgPool.query(query);
}

static insertBasketSubject(basketId,courses,username){
 let query = {
  text:`insert into basket_subject(basket_lid,subject_lid,created_date,createdby,modified_date,modifiedby,active) values
  ($1,$2,now(),$3,now(),$4,true)`,
  values:[basketId,courses,username,username]  
 }
 return pgPool.query(query);   
}

static insertCompulsorySub(basketId,compulsorySub){
 let query={
  text:`update basket_event set no_of_comp_sub=$1,modified_date=now() where basket_lid=$2`,
  values:[compulsorySub,basketId]  
 }   
 return pgPool.query(query);
}

static checkAbbr(abbr){
 let query = {
  text : `select basket_abbr from basket where basket_abbr=$1 and active=true`,
  values:[abbr]
 }
 return pgPool.query(query); 
}

static assignedBasketCourse(basketId){
  let query = {
    text:`select s.subject_name,b.basket_name from basket_subject bs inner join subject_master s on bs.subject_lid=s.sub_id inner join basket b on
    b.id=bs.basket_lid where bs.basket_lid=$1 and bs.active=true and s.active=true and b.active=true`,
    values:[basketId]
  }
  return pgPool.query(query);
}
} 