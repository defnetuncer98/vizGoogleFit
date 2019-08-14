var days = [];
var apiKey = '';
var clientId = '';
var scopes = 'https://www.googleapis.com/auth/fitness.activity.read';
var auth2;
var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');
var darkTheme = document.getElementById('dark-theme');
var lightTheme = document.getElementById('light-theme');
var stepsButton = document.getElementById('steps-button');
var caloriesButton = document.getElementById('calories-button');
var plotCard = document.getElementById('plot-card');
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
        max = days.length;
    }
    else{
        data = days.slice(days.length-max, days.length);
    }
    d3.select(".header").text("Daily Steps | Last " + max + " Days");
    width = document.getElementById("vizGoogleFit").offsetWidth;
    height_margin = window.innerHeight/2 + 80;
    height = window.innerHeight/2;

    var maxDate = new Date();
    var minDate = new Date();
    minDate.setDate(maxDate.getDate()-max);
    
    var xScale =  d3.scaleTime()
        .domain([minDate, maxDate])
        .range([0, width]);

    var yScale = d3.scaleLinear()
        .domain([0, Math.max(...data)]) 
        .range([height, 0]); 

    console.log(data);
    
    // remove the previous plot
    d3.select('.svg').remove();
    
    // display the slider
    d3.select('.slider').attr('style','display:block;height:50px;');

    // new plot 
    var svg = d3.select(".vizGoogleFit")
    .append("svg")
    .attr("class","svg")
    .attr("width", width)
    .attr("height", height_margin)
    .append("g");

    // draw path
    svg.append("path")
    .datum(data)
    .style('fill', 'none')
    .attr("class", "line-plot")
    .attr("stroke", "purple")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
        .x(function(d, i) { return xScale(new Date().setDate(new Date().getDate()-(max-i))); })
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
    .attr("cx", function(d, i) { return xScale(new Date().setDate(new Date().getDate()-(max-i))); })
    .attr("cy", function(d) { return yScale(d); })
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

    var formatTime = d3.timeFormat("%b %d");
    
    svg.selectAll("text")
        .data(data)
        .enter()
        .append("svg:text")
        .text(function(d,i) { return formatTime(new Date().setDate(new Date().getDate()-(max-i-1)))})
        .attr('transform', (d,i)=>{
            return 'translate( '+ xScale(new Date().setDate(new Date().getDate()-(max-i))) + ' , '+ (height+10) +'),'+ 'rotate(-90)';})
        .attr("fill", "gray")
        .attr('x', 0)
        .attr('y', 0)
        .style("text-anchor", "end")
        .attr("dy", "0.4em");

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
        darkTheme.onclick = handleDarkThemeClick;
        lightTheme.onclick = handleLightThemeClick;
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
        stepsButton.style.display = 'block';
        caloriesButton.style.display = 'block';
        handleStepsClick();
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
        d3.select('.auth-image').attr('style','display:none;');
        d3.select('.daily-step').attr('style','display:none;');
        d3.select('.auth-info').text('Get Started by Connecting your Google Account!');
        stepsButton.style.display = 'none';
        caloriesButton.style.display = 'none';
        d3.select('.svg').remove();
        d3.select('.slider').attr('style','display:none;height:50px;');
        d3.select('.header').text('');
    }
}

function handleAuthClick() {
    auth2.signIn();
}

function handleSignoutClick() {
    auth2.signOut();
}

function handleStepsClick() {
    d3.select('.calories-button').attr('style','background-color:#e4e4e4;color:black;');
    d3.select('.steps-button').attr('style','background-color:purple;color:white;');
    makeApiCallSteps();
}

function handleCaloriesClick() {
    d3.select('.calories-button').attr('style','background-color:indigo;color:white;');
    d3.select('.steps-button').attr('style','background-color:#e4e4e4;color:black;');
}

function handleDarkThemeClick(){
    d3.select('.body').attr('style', 'background-color:#080808;')
    lightTheme.style.display = 'block';
    darkTheme.style.display = 'none';
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

function handleLightThemeClick(){
    var rndm = getRandomColor();
//    if(rndm>'#0000ff') plotCard.style.backgroundColor = '#1f1f1f';
//    else plotCard.style.backgroundColor = '#lightGray';
    document.body.style.backgroundColor = rndm;
    d3.select('.line-plot').attr("stroke", rndm);
    lightTheme.style.display = 'none';
    darkTheme.style.display = 'block';
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