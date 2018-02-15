var frameModule = require("ui/frame");
var observableModule = require("data/observable");
var rVac = require("./../../backend/restIntegration-vac")
var rEnt = require("./../../backend/restIntegration")
var rDetection = require("./../../backend/restDetection")
var applicationSettings = require("application-settings");
var view = require("ui/core/view");


var page;




var maincontext = new observableModule.fromObject({
    apiurl: "",
    login: "",
    password: "",
    sessionid: null,
    loginPageDoc: null,
    querySVC: null,
    jobs:[],
    tenants:[],
});


exports.loaded = function(args) {
    page = args.object;

    maincontext.apiurl = applicationSettings.getString("apiurl", "https://localhost:1281");
    maincontext.login = applicationSettings.getString("login", "administrator");
    
    

    page.bindingContext = maincontext;
    //console.log("Page loaded");
};
/*exports.login2 = function() {
    var success = () => {
        applicationSettings.setString("apiurl", maincontext.apiurl);
        applicationSettings.setString("login", maincontext.login);

        
        //alert("Logged in")
        topmost.navigate({moduleName:"views/list-vac/list",context:maincontext});
    }
    var failure = (error) => {
        alert("Could not login : "+error)
    }
    rVac.restLogin(maincontext,success,failure);
};*/
exports.login = function() {
    var btnlogin = view.getViewById(page, "btnlogin")
    btnlogin.isEnabled = false;
    var success = (api) => {
        if (api == "vac") {
            var successvac = () => {
                applicationSettings.setString("apiurl", maincontext.apiurl);
                applicationSettings.setString("login", maincontext.login);
        
                //alert("Logged in")
                var topmost = frameModule.topmost();
                topmost.navigate({moduleName:"views/list-vac/list",context:maincontext});

                btnlogin.isEnabled = true;
            }
            var failurevac = (error) => {
                alert("Could not login into vac : "+error)
                btnlogin.isEnabled = true;
            }
            rVac.restLogin(maincontext,successvac,failurevac);

        } else if (api == "ent") {
            var successent = () => {
                applicationSettings.setString("apiurl", maincontext.apiurl);
                applicationSettings.setString("login", maincontext.login);
        
                
                //alert("Logged in")
                var topmost = frameModule.topmost();
                topmost.navigate({moduleName:"views/list/list",context:maincontext});
                btnlogin.isEnabled = true;
            }
            var failureent = (error) => {
                alert("Could not login into enterprise manager : "+error)
                btnlogin.isEnabled = true;
            }
            rEnt.restLogin(maincontext,successent,failureent);
        }
    }
    var failure = (message) => {
        alert(message+" (Should be VAC or Enterprise Manager) ")
        btnlogin.isEnabled = true;
    }
    rDetection.detectAPI(maincontext,success,failure) 
}