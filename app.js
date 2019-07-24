var days = [];
var apiKey = 'AIzaSyAFE7Ispkhhy9ZR68mzTL6TWFMrJufkWfU';
var clientId = '283704614465-a6octk36hj6inh564f23d2t10mt0u9fr.apps.googleusercontent.com';
var scopes = 'https://www.googleapis.com/auth/fitness.activity.read';
var auth2;
var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');
var stepsButton = document.getElementById('steps-button');
var caloriesButton = document.getElementById('calories-button');
var midnight = new Date().setHours(0,0,0,0);
var dailystep;

function prepareData(data){
    var sum = 0;
    var dayends = 0;
    data.forEach(function(element) {
        if(!sum){
            dayends = parseInt(element.startTimeNanos)+86400000000000;
        }
        sum+=element.value[0].intVal;      
        if(parseInt(element.endTimeNanos)>dayends){
            days.push(sum);
            sum=0;
        }
    });
    days.push(sum);
    days.push(dailystep);
}

function viz(max){
    if(max>days.length) {
        data = days;
        d3.select(".header").text("Daily Steps | Last " + days.length + " Days");
    }
    else{
        data = days.slice(days.length-max, days.length);
        d3.select(".header").text("Daily Steps | Last " + max + " Days");
    }
    offsetwidth = document.getElementById("vizGoogleFit").offsetWidth;

    var xScale = d3.scaleLinear()
        .domain([0, data.length]) // input
        .range([0, offsetwidth]); // output

    var yScale = d3.scaleLinear()
        .domain([0, Math.max(...data)]) // input 
        .range([window.innerHeight/2, 0]); // output 

    console.log(data);
    
    d3.select('.svg').remove();
    d3.select('.slider').attr('style','display:block;');
    var svg = d3.select(".vizGoogleFit").append("svg")
    .attr("class","svg")
    .attr("width", offsetwidth)
    .attr("height", window.innerHeight/2)
    .append("g");

    svg.append("path")
    .datum(data)
    .attr("class", "line") // Assign a class for styling 
    .style('fill', 'none')
    .attr("stroke", "purple")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
    .x(function(d, i) { return xScale(i); })
    .y(function(d) {return yScale(d); })
    .curve(d3.curveMonotoneX));

    var tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("color","white");

    svg.selectAll("circle")
    .data(data)
    .enter()    
    .append("svg:circle")
    .attr("cx", function(d, i) { return xScale(i) })
    .attr("cy", function(d) { return yScale(d) })
    .attr("r", 3)
    .attr("style","fill:indigo;stroke:indigo")
    .on("mouseover", function(a, b, c) {
        d3.select(this).attr("r", "6");
        tooltip.text(a);
        return tooltip.style("visibility", "visible");
    })
    .on("mousemove", function(){
        return tooltip.style("top",(d3.event.pageY-30)+"px").style("left",(d3.event.pageX-5)+"px");
    })
    .on("mouseout", function() { 
        d3.select(this).attr("r", "3")
        return tooltip.style("visibility", "hidden");
    });

}

function handleClientLoad() {
    gapi.load('client:auth2', initAuth);
}

function initAuth() {
    gapi.client.setApiKey(apiKey);
    gapi.auth2.init({
        client_id: clientId,
        scope: scopes
    }).then(function () {
        auth2 = gapi.auth2.getAuthInstance();
        auth2.isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(auth2.isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
        stepsButton.onclick = handleStepsClick;
        caloriesButton.onclick = handleCaloriesClick;
      });
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        makeApiCallDailySteps();
        var auth = auth2.currentUser.get().getBasicProfile();
        d3.select('.auth-image').attr('style','display:block;padding:12px;').attr('src',auth.getImageUrl());
        d3.select('.auth-info').text(auth.getGivenName() + ' ' + auth.getFamilyName());
        d3.select('.steps-button').attr('style','display:block;');
        d3.select('.calories-button').attr('style','display:block;');
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
        d3.select('.auth-image').attr('style','display:none;');
        d3.select('.daily-step').attr('style','display:none;');
        d3.select('.auth-info').text('Get Started by Connecting your Google Account!');
        d3.select('.steps-button').attr('style','display:none;');
        d3.select('.svg').remove();
        d3.select('.slider').attr('style','display:none;');
        d3.select('.header').text('');
    }
}

function handleAuthClick(event) {
    auth2.signIn();
}

function handleSignoutClick(event) {
    auth2.signOut();
}

function handleStepsClick(event) {
    d3.select('.calories-button').attr('style','background-color:#e4e4e4;color:black;');
    d3.select('.steps-button').attr('style','background-color:purple;color:white;');
    makeApiCallSteps();
}

function handleCaloriesClick(event) {
    d3.select('.calories-button').attr('style','background-color:indigo;color:white;');
    d3.select('.steps-button').attr('style','background-color:#e4e4e4;color:black;');
}

function makeApiCallSteps() {
    gapi.client.load('fitness', 'v1', function() {
        var request = gapi.client.fitness.users.dataSources.datasets.get({
            userId: 'me',
            dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
            datasetId: midnight-86400000*100 + '000000-' + midnight + '000000',
        });
        request.execute(function(resp) {
            prepareData(resp.point);
            viz(7);
        });
    });
}

function makeApiCallDailySteps() {
    gapi.client.load('fitness', 'v1', function() {
        var request = gapi.client.fitness.users.dataSources.datasets.get({
            userId: 'me',
            dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
            datasetId: midnight + '000000-' +  new Date().getTime() + '000000',
        });
        request.execute(function(resp) {
            dailystep = d3.sum(resp.point.map(d => d.value[0].intVal));
            d3
            .select('.daily-step')
            .attr('style','display:block;color:white;')
            .text(dailystep);
        });
    });
}