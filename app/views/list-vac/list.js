var observableModule = require("data/observable");
var oA = require("data/observable-array");
var rI = require("./../../backend/restIntegration-vac");
var view = require("ui/core/view");
var frameModule = require("ui/frame");

var page;

var maincontext
var selectedTenant = {
    selectedId:-1
}


function jobtap(args) {
    var itemIndex = args.index;
    //console.log(maincontext.jobs[itemIndex].name)

    var topmost = frameModule.topmost();
    topmost.navigate({moduleName:"views/jobdetail-vac/jobdetail",context:{job:maincontext.jobs[itemIndex],maincontext:maincontext}});
}
function selectTenant() {
    if(maincontext.tenants.length > 0) {
        var topmost = frameModule.topmost();
        //console.log(maincontext.tenants.length)
        topmost.navigate({moduleName:"views/tenantselect-vac/tenantselect",context:{tenants:maincontext.tenants,selection:selectedTenant}});
        //alert("Select your tenants")
    }
}
function getTenantFromCache(id) {
    var tenant = null
    var ts = maincontext.tenants
    for(var i=0;i<ts.length;i++) {
        if(ts[i].id = id) {
            tenant = ts[i];
        }
    }
    return tenant
}
function displayJobs(listjobs) {
    var now = (new Date()).getTime()
    var rpomaxdiff = 1*24*60*60*1000
    var rpobreak = now - rpomaxdiff;

    var filteredList = []

    for(var i=0;i < listjobs.length;i++) {
        var job = listjobs[i];

        
        job.rpoicon = "res://rpo_unknown"
        job.statusicon = "res://state_unknown"
        
        job.tenantName = "Unknown"

        var detecttenantid = -1

        if(job._links !== undefined && job._links.tenants !== undefined && job._links.tenants.length > 0 && job._links.tenants[0].href !== undefined) {
            var tmatches = job._links.tenants[0].href.match(/[tT]enants\/([0-9]+)$/);
            
            if (tmatches != null && tmatches.length > 1) {
                detecttenantid = parseInt(tmatches[1]);
                
                //console.log("Found tenant "+tenantid)
                var ctenant = getTenantFromCache(detecttenantid)
                if (ctenant != null) {
                    job.tenantName = ctenant.name
                }
            } 
        } 

        if (selectedTenant.selectedId == -1 || selectedTenant.selectedId == detecttenantid) {
            var rpoicon = "unknown"
            var statusicon = "unknown"

            //console.log(job.name+" "+job.status)
        
            switch(job.status) {
                case "-":
                    statusicon  = "warning"
                    break;
                case "Failed":
                    statusicon  = "bad"
                    break;
                case "Success":
                    statusicon  = "ok"
                    break;
                case "Warning":
                    statusicon  = "warning"
                    break;
                case "Starting":
                    statusicon  = "running"
                    break;
                case "Running":
                    statusicon  = "running"
                    break;
                case "Idle":
                    statusicon  = "ok"
                    break;
                default:
                    statusicon  = "unknown"
            }

            if (job.lastRun != "0001-01-01T00:00:00" ) {
                    var lastjobrun = (new Date(job.lastRun)).getTime()
                    if (rpobreak > lastjobrun) {
                        rpoicon = "bad"
                    } else {
                        rpoicon = "ok"
                    }
            } else {
                rpoicon = "warning"
            } 

            job.rpoicon = "res://rpo_"+rpoicon
            job.statusicon = "res://state_"+statusicon

            filteredList.push(job)
        }
    }
    
    maincontext.jobs = filteredList.reverse()

    joblist = view.getViewById(page,"joblist")
    if (joblist != null) {
        joblist.refresh()
    }
}
function refreshJobs() { 
    var failure = (error) => {
        alert("Error retrieving jobs : "+error)
    }
    rI.getJobs(maincontext,displayJobs,failure);
}

function refreshPage() {
    var success = (tenants) => {
        maincontext.tenants = tenants
        refreshJobs();
    }
    var failure = (error) => {
        alert("Error retrieving tenants : "+error)
    }
    rI.getTenants(maincontext,success,failure);
}
exports.loaded = function(args) {
    page = args.object;
    page.bindingContext = page.navigationContext;
    maincontext = page.navigationContext;
    maincontext.jobs = []
    maincontext.tenants = []

  
    refreshPage()
    
};
exports.jobtap = jobtap;
exports.refreshPage = refreshPage;
exports.selectTenant = selectTenant;