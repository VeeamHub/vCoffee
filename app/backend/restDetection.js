var fetchModule = require("fetch");


function detectVac(maincontext,success,failure) {
    return fetchModule.fetch(maincontext.apiurl+"/v2/jobs", {
        method: "GET",
        timeout:5000,
        headers: {"Content-Type": "application/json"}
    }).then(res => res.json()).then(body => {
        if(body.message !== undefined) {
            success("vac")
        } else {
            failure("vac")
        }
    }).catch(err => {
        failure("vac")
    })
}
function detectEnt(maincontext,success,failure) {
    return fetchModule.fetch(maincontext.apiurl+"/api/", {
        method: "GET",
        timeout:5000,
        headers: {"Content-Type": "application/xml"}
    }).then(res => res.text()).then(body => {
        if (body.indexOf('EnterpriseManager xmlns="http://www.veeam.com/ent/v1.0"') > 0) {
            success("ent")
        } else {
            failure("ent")
        }
    }).catch(err => {
        failure("ent")
    })
}

function detectAPI(maincontext,incomingsuccess,incomingfailure) {
    var gotSuccess = false;

    var subsuccess = (name) => {
        //console.log("Think this one is"+name)
        gotSuccess = true;
        incomingsuccess(name)
    }
    var subfailure = (name) => {
        //console.log("It's not "+name)
    }
    var apipromises = []
    apipromises.push(detectVac(maincontext,subsuccess,subfailure))
    apipromises.push(detectEnt(maincontext,subsuccess,subfailure))

    setTimeout(function(){ if(!gotSuccess) { incomingfailure("Timeout on both API tests")} }, 5000);
    // Promise.all(apipromises).then(()=> {
    //     if(gotSuccess == false) {
    //         incomingfailure("Unknown API")
    //     } 
    // })
}
exports.detectEnt = detectEnt
exports.detectVac = detectVac
exports.detectAPI = detectAPI