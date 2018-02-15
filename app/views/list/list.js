var observableModule = require("data/observable");
var oA = require("data/observable-array");
var rI = require("./../../backend/restIntegration");
var view = require("ui/core/view");
var frameModule = require("ui/frame");

var page;

var maincontext

function jobtap(args) {
    var itemIndex = args.index;
    //console.log(maincontext.jobs[itemIndex].name)

    var topmost = frameModule.topmost();
    topmost.navigate({moduleName:"views/jobdetail/jobdetail",context:{job:maincontext.jobs[itemIndex],maincontext:maincontext}});
}

function refreshJobs() {
    var success = (listjobs) => {
        //console.log("Got update job list"+listjobs.length);
        ps = []
        


        for(var i=0;i < listjobs.length;i++) {
            var job = listjobs[i];
            job.rpoicon = "res://rpo_unknown"
            job.statusicon = "res://state_unknown"

            var now = (new Date()).getTime()
            var rpomaxdiff = 1*24*60*60*1000
            var rpobreak = now - rpomaxdiff;


            //console.log("Launching update"+job.name+" "+i);
            ps.push(rI.updateJobStatus(maincontext,job,(job) => {
                var rpoicon = "unknown"
                var statusicon = "unknown"

                //console.log(job.status)
                if(job.status == "Success") {
                    statusicon = "ok"
                } else if (job.status == "Failed") {
                    statusicon = "bad"
                } else if (job.status == "Warning" || job.status == "NotRun")  {
                    statusicon = "warning"
                } else if (job.state == "Working" | job.state == "Postprocessing") {
                    statusicon = "running"
                }

                if (job.lastrunornull != 0 ) {
                    if (job.lastrunornull == 1) {
                        rpoicon = "ok"
                    } else {
                        var lastjobrun = (new Date(job.lastrunornull)).getTime()
                        if (rpobreak > lastjobrun) {
                            rpoicon = "bad"
                        } else {
                            rpoicon = "ok"
                        }
                    }
                } else {
                    rpoicon = "warning"
                }

                job.rpoicon = "res://rpo_"+rpoicon
                job.statusicon = "res://state_"+statusicon
            },(err)=> { job.lastrun = "Error "+err}))
        }
        
        maincontext.jobs = listjobs

        Promise.all(ps).then(() => {
            joblist = view.getViewById(page,"joblist")
            if (joblist != null) {
                joblist.refresh()
            }
        })
    }
    var failure = (error) => {
        alert("Error retrieving jobs : "+error)
    }
    //console.log("Loading jobs")
    rI.getJobs(maincontext,success,failure);
}
exports.loaded = function(args) {
    page = args.object;
    page.bindingContext = page.navigationContext;
    maincontext = page.navigationContext;
    maincontext.jobs = []
    refreshJobs()
};
exports.jobtap = jobtap;
exports.refreshJobs = refreshJobs;