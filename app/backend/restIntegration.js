//tns plugin add nativescript-xmlobjects
//npm install base-64 --save
//npm install utf8 --save

var fetchModule = require("fetch");
var xmlo = require("nativescript-xmlobjects")
var base64 = require("base-64")
var utf8 = require("utf8")

function getCommonHeaders() {
    return {
        "Content-Type": "application/xml"
    }
}
function getLoginHeader(username,password) {
    var bytes = utf8.encode(username + ":" + password);
    var encodedStr = base64.encode(bytes);
    var authheader = "Basic " + encodedStr
    //console.log(username+" "+authheader);
    
    return {
        "Content-Type": "application/xml",
        "Authorization" : authheader 
    }
}
function getAuthenticatedHeader(sessid) {
    return {
        "Content-Type": "application/xml",
        "x-restsvcsessionid":sessid
    }   
}

function findLink(links,attributeName,attributeValue,returnAttribute) {
    for (var i = 0; i < links.length; i++) {
        var linkel = links[i];
        rel = linkel.attribute(attributeName);
        if (rel.value == attributeValue) {
            return linkel.attribute(returnAttribute).value;
        }
    }
    return null;
}
function findRelLink(links,reltype,returnAttribute) { return findLink(links,"Rel",reltype,returnAttribute)}
function findTypeLink(links,typetype,returnAttribute) { return findLink(links,"Type",typetype,returnAttribute)}

function getQuerySVC(maincontext) {
    if (maincontext.querySVC == null) {
        var q = findTypeLink(maincontext.loginPageDoc.root.element("Links").elements("Link"),"QueryService","Href");
        maincontext.querySVC = q.replace(/Svc$/,"");
        
    }
    return maincontext.querySVC
}
function actionJob(maincontext,job,jobaction,success,failure) {
    var jl = findTypeLink(maincontext.loginPageDoc.root.element("Links").elements("Link"),"JobReferenceList","Href");
    if (jl != null) {
        fetchModule.fetch(jl+'/'+job.uid+'?action='+jobaction, {
            method: "POST",
            headers: getAuthenticatedHeader(maincontext.sessionid)
        }).then(res => res.text()).then(body => {
            success();
        })
    } else {
        failure("Could not find job link")
    }
}
function updateJobStatus(maincontext,job,success,failure) {
    var q = getQuerySVC(maincontext);
    //console.log("Updating "+job.name)

    var jobtypesession = "BackupJobSession"
    if(job.type == "Replica") {
        jobtypesession = "ReplicaJobSession"
    }

    return fetchModule.fetch(q+'?type='+jobtypesession+'&format=Entities&sortDesc=name&pageSize=1&page=1&filter=JobUid=='+job.uid, {
        method: "GET",
        headers: getAuthenticatedHeader(maincontext.sessionid)
    }).then(res => res.text()).then(body => {
        var doc = xmlo.parse(body)
        //console.dir(doc.root.element("Entities"))
        var jsess = doc.root.element("Entities").element(jobtypesession+"s").element(jobtypesession)
        if (jsess != null) {
           // console.log("Found"+job.name)
            var end = jsess.element("EndTimeUTC")
            var res = jsess.element("Result").value
            var state = jsess.element("State").value
            var starttime = jsess.element("CreationTimeUTC").value
            var progress = parseInt(jsess.element("Progress").value)

            job.lastrunornull = 0;
            if (end != null) {
                job.lastrun = end.value;
                job.lastrunornull = end.value;
            } else if (state == "Working") {
                job.lastrun = "Job is running"
                job.lastrunornull = 1;
            } else {
                job.lastrun = "Unknown job state"
            }
            job.status = res
            job.starttime  = starttime;
            job.progress = progress;
            job.state = state;
            success(job)
        } else {
            job.lastrun = "Did not find session / Did not run"
            job.status = "NotRun"
            success(job)
        }
        
    }).catch(err=> {
        failure(err);
    })
}
function getJobs(maincontext,success,failure) {
    var jobref = findTypeLink(maincontext.loginPageDoc.root.element("Links").elements("Link"),"JobReferenceList","Href");
    //console.log("Getting jobs ..")
    if(jobref != null) {
        //console.log("Going to "+jobref)

        fetchModule.fetch(jobref+"?format=Entity", {
            method: "GET",
            headers: getAuthenticatedHeader(maincontext.sessionid)
        }).then(res => res.text()).then(body => {
            //console.log(body);
            var doc = xmlo.parse(body)
            var httpjobs = doc.root.elements("Job")
            var jobs = []
            for(var i = 0;i < httpjobs.length;i++) {
                var httpjob = httpjobs[i]
                var jobname = httpjob.attribute("Name").value;
                var uid = httpjob.attribute("UID").value;
                var jobtype = httpjob.element("JobType").value
                var newjob = {name:jobname,uid:uid,status:"Loading",lastrun:"loading...",type:jobtype,starttime:"loading...",state:"loading...",progress:0,lastrunornull:0};
                jobs.push(newjob);
            }
            success(jobs);
        }).catch(err=> {
            failure(err)
        }) 
    } else {
        failure("Could not find job url")
    }
}
function restLogin(maincontext,success,failure) {

    fetchModule.fetch(maincontext.apiurl+"/api/", {
        method: "GET",
        headers: getCommonHeaders()
    }).then(res => res.text()).then(body => {
        //console.log(body+" "+maincontext.apiurl)
        var doc = xmlo.parse(body)
        var linksarr = doc.root.element("Links").elements("Link")
        var latesturl = findRelLink(linksarr,"Create","Href");
        
        if (latesturl) {
            //console.log("Trying login on"+latesturl+" <-"+maincontext.apiurl)
            fetchModule.fetch(latesturl, {
                method: "POST",
                headers: getLoginHeader(maincontext.login,maincontext.password)
            }).then(res => {
                var sessid = res.headers.get("x-restsvcsessionid")
                if (sessid != null) {
                    maincontext.sessionid = sessid
                    res.text().then(body => {
                        //console.log(maincontext.sessionid)
                        //console.log(body)
                        var doclogin = xmlo.parse(body)
                        maincontext.loginPageDoc = doclogin
                        success()
                    })
                } else {
                    //console.dir(res.headers)
                    failure("No session id found, are you sure the credentials are right")
                }
            }).catch(error=> {
                failure("Something went wrong when trying to login in "+error)
            });    
        } else {
            failure("Could not find login url")
        }
    }).catch(error=> {
        failure("Something went wrong when fetching initial api page "+error)
    });
}
module.exports.restLogin = restLogin;
module.exports.getJobs = getJobs;
module.exports.actionJob = actionJob;
module.exports.updateJobStatus = updateJobStatus;
