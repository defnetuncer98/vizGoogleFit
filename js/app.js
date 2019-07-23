function viz(data){
    var days = [];
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

    offsetwidth = document.getElementById("vizGoogleFit").offsetWidth;

    var xScale = d3.scaleLinear()
        .domain([1, days.length]) // input
        .range([0, offsetwidth]); // output

    var yScale = d3.scaleLinear()
        .domain([0, Math.max(...days)]) // input 
        .range([window.innerHeight/2, 0]); // output 

    console.log(days);

    var svg = d3.select(".vizGoogleFit").append("svg")
    .attr("width", offsetwidth)
    .attr("height", window.innerHeight/2)
    .attr("style","margin:20px;")
    .append("g");

    svg.append("path")
    .datum(days) // 10. Binds data to the line 
    .attr("class", "line") // Assign a class for styling 
    .style('fill', 'none')
    .attr("stroke", "purple")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
    .x(function(d, i) { return xScale(i); })
    .y(function(d) {return yScale(d); }));

    offsetheight = document.getElementById("vizGoogleFit").offsetHeight;
    debugger;
    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + offsetheight + ")")
    .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom

    svg.append("g")
    .attr("class", "y axis")
    .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft
}
var apiKey = 'AIzaSyAFE7Ispkhhy9ZR68mzTL6TWFMrJufkWfU';
var clientId = '283704614465-a6octk36hj6inh564f23d2t10mt0u9fr.apps.googleusercontent.com';
var scopes = 'https://www.googleapis.com/auth/fitness.activity.read';
var auth2;
var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');
var stepsButton = document.getElementById('steps-button');

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
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
        d3.select('.auth-image').attr('style','display:none;');
        d3.select('.daily-step').attr('style','display:none;');
        d3.select('.auth-info').text('Get Started by Connecting your Google Account!');
    }
}

function handleAuthClick(event) {
    auth2.signIn();
}

function handleSignoutClick(event) {
    auth2.signOut();
}

function handleStepsClick(event) {
    d3.select('.steps-button').attr('style','background-color:purple;color:white;');
    makeApiCallSteps();
}

function makeApiCallSteps() {
    var date = new Date().getTime();
    gapi.client.load('fitness', 'v1', function() {
        var request = gapi.client.fitness.users.dataSources.datasets.get({
            userId: 'me',
            dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
            datasetId: date-86400000*7 + '000000-' + date + '000000',
        });
        request.execute(function(resp) {
            viz(resp.point);
        });
    });
}

function makeApiCallDailySteps() {
    var date = new Date().getTime();
    gapi.client.load('fitness', 'v1', function() {
        var request = gapi.client.fitness.users.dataSources.datasets.get({
            userId: 'me',
            dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
            datasetId: date-86400000 + '000000-' + date + '000000',
        });
        request.execute(function(resp) {
            var sum = d3.sum(resp.point.map(d => d.value[0].intVal));
            d3
            .select('.daily-step')
            .attr('style','display:block;color:white;')
            .text(sum);
        });
    });
}