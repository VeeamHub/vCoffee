//tns plugin add nativescript-xmlobjects
//npm install base-64 --save
//npm install utf8 --save

var fetchModule = require("fetch");
var xmlo = require("nativescript-xmlobjects")
var base64 = require("base-64")
var utf8 = require("utf8")

function getCommonHeaders() {
    return {
        "Content-Type": "application/json"
    }
}

function getAuthenticatedHeader(sessid) {
    return {
        "Content-Type": "application/json",
        "Authorization":"Bearer "+sessid
    }   
}



function actionJob(maincontext,job,jobaction,success,failure) {
        var posting = '{"'+jobaction+'": null }'
        var uri = maincontext.apiurl+"/v2/Jobs/"+job.id+"/action"
        //console.log(uri+"=>"+posting);
        fetchModule.fetch(uri, {
            method: "POST",
            headers: getAuthenticatedHeader(maincontext.sessionid),
            body: posting
        }).then(res => res.json()).then(body => {
            //console.dir(body)
            success();
        }).catch(err=> {
            failure(err);
        })

}
function getJob(maincontext,jobid,success,failure) {
    return fetchModule.fetch(maincontext.apiurl+"/v2/Jobs/"+jobid, {
        method: "GET",
        headers: getAuthenticatedHeader(maincontext.sessionid)
    }).then(res => res.json()).then(newjob => {
        success(newjob)        
    }).catch(err=> {
        failure(err);
    })
}
function getList(maincontext,success,failure,type) {
    var ref = maincontext.apiurl+"/v2/"+type

    fetchModule.fetch(ref, {
        method: "GET",
        headers: getAuthenticatedHeader(maincontext.sessionid)
    }).then(res => res.json()).then(body => {
        success(body);
    }).catch(err=> {
        failure(err)
    }) 

}
function getTenants(maincontext,success,failure) {
    getList(maincontext,success,failure,"Tenants")
}
function getJobs(maincontext,success,failure) {
    getList(maincontext,success,failure,"Jobs")
}
function restLogin(maincontext,success,failure) {
    //console.log("posting")
    fetchModule.fetch(maincontext.apiurl+"/v2/jobs", {
        method: "GET",
        headers: getCommonHeaders()
    }).then(res => res.text()).then(body => {
        //console.log("ok is api"+body+" "+maincontext.apiurl)
        var doc = xmlo.parse(body)

        fetchModule.fetch(maincontext.apiurl+"/token",{
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer"
            },
            body: "grant_type=password&username="+maincontext.login+"&password="+maincontext.password
        }).then(r => { return r.json(); }).then(function (r) {
            if(r.access_token !== undefined) {
                maincontext.sessionid = r.access_token
                success()
                //console.log("logged in with "+r.access_token);
            } else {
                failure("Could not extract access token from api")
            }
        }).catch(error =>failure("Could not login"+error));
        
    }).catch(error=> {
        failure("Something went wrong when fetching initial api page "+error)
    });
}
module.exports.restLogin = restLogin;
module.exports.getJobs = getJobs;
module.exports.actionJob = actionJob;
module.exports.getJob = getJob;
module.exports.getTenants = getTenants;
