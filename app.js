var days = [];
var apiKey = 'AIzaSyAFE7Ispkhhy9ZR68mzTL6TWFMrJufkWfU';
var clientId = '283704614465-h0ngd6qusn2pv0rkiuus4ohilltqovem.apps.googleusercontent.com';
var scopes = 'https://www.googleapis.com/auth/fitness.activity.read';
var auth2;
var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');
var randomcolor = document.getElementById('random-color');
var stepsButton = document.getElementById('steps-button');
var caloriesButton = document.getElementById('calories-button');
var right = document.getElementById('right');
var plotCard = document.getElementById('plot-card');
var midnight = new Date().setHours(0,0,0,0);
var dailystep;
var formatTime = d3.timeFormat("%b %d");

function prepareData(data){
    var sum = 0;
    var dayends = 0;
    data.reverse();
    days.push(dailystep);
    data.forEach(function(element) {
        if(!sum){
            dayends = parseInt(element.startTimeNanos)-86400000000000;
        }
        if(parseInt(element.endTimeNanos)<dayends){
            days.push(sum);
            sum=0;
            dayends = parseInt(element.startTimeNanos)-86400000000000;
        }
        sum+=element.value[0].intVal;            
    });
    days.push(sum);
    days.reverse();
}

function formatNumber(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function viz(values){
    var values = [parseInt(values[0]),parseInt(values[1])]
    var max = values[1]-values[0];
    var data = days.slice(values[0], values[1]);
    data.reverse();
    var avg = data.reduce((a,b) => a + b, 0)/max;
    width = document.getElementById("vizGoogleFit").offsetWidth;
    height = window.innerHeight*3/4 -50;
    height_margin = window.innerHeight + 10;
    var maxDate = new Date();
    var minDate = new Date();
    maxDate.setDate(new Date().getDate()-(days.length-values[1]));
    minDate.setDate((new Date().getDate()-(days.length-values[1])-max+1));

    d3.select('.noUi-handle-lower .noUi-tooltip').text(formatTime(minDate));
    d3.select('.noUi-handle-upper .noUi-tooltip').text(formatTime(maxDate));

    d3.select(".min").text(formatNumber(Math.min.apply(Math, data)));
    d3.select(".max").text(formatNumber(Math.max.apply(Math, data)));
    d3.select(".avg").text(formatNumber(parseInt(avg)));
    d3.select(".header").text(formatTime(minDate) + " - " + maxDate.getDate());

    var xScale =  d3.scaleTime()
        .domain([minDate, maxDate])
        .range([10, width-10]);

    var yScale = d3.scaleLinear()
        .domain([0, Math.max(...data)]) 
        .range([height, 10]); 
    
    // remove the previous plot
    d3.select('.svg').remove();
    
    // display the slider
    slider.style='display:block;';

    // new plot 
    var svg = d3.select(".vizGoogleFit")
    .append("svg")
    .attr("class","svg")
    .attr("width", width)
    .attr("height", height+10)
    .append("g");

    // draw path
    svg.append("path")
    .datum(data)
    .style('fill', 'none')
    .attr("class", "line-plot")
    .attr("stroke", "purple")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
        .x(function(d, i) { 
            var date = new Date();
            date.setMonth(maxDate.getMonth());
            date.setDate(maxDate.getDate()-i);
            return xScale(date);})
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
    .attr("class","hoverable")
    .attr("cx", function(d, i) { 
        var date = new Date();
        date.setMonth(maxDate.getMonth());
        date.setDate(maxDate.getDate()-i);
        return xScale(date);})
    .attr("cy", function(d) { return yScale(d); })
    .attr("r", 3)
    .attr("style","fill:indigo;stroke:indigo")
    .on("mouseover", function(a, b, c) {
        var date = new Date();
        date.setMonth(maxDate.getMonth());
        date.setDate(maxDate.getDate()-b);
        d3.select(this).attr("r", "6");
        tooltip.text(formatNumber(a) + "\n" + formatTime(date));
        tooltip.style("transform","translate(-50%,-120%) ")
        return tooltip.style("visibility", "visible");
    })
    .on("mousemove", function(){
        return tooltip.style("top",d3.event.pageY+"px").style("left",d3.event.pageX+"px");
    })
    .on("mouseout", function() { 
        d3.select(this).attr("r", "3")
        return tooltip.style("visibility", "hidden");
    });

    
    // svg.selectAll("text")
    //     .data(data)
    //     .enter()
    //     .append("svg:text")
    //     .text(function(d,i) {
    //         var date = new Date();
    //         date.setMonth(maxDate.getMonth());
    //         date.setDate(maxDate.getDate()-i);
    //         return formatTime(date);})
    //     .attr('transform', (d,i)=>{
    //         var date = new Date();
    //         date.setMonth(maxDate.getMonth());
    //         date.setDate(maxDate.getDate()-i);
    //         return 'translate( '+ xScale(date) + ' , '+ (height+10) +'),'+ 'rotate(-90)';})
    //     .attr("fill", "gray")
    //     .attr('x', 0)
    //     .attr('y', 0)
    //     .style("text-anchor", "end")
    //     .attr("dy", "0.4em");

    yAxis = d3.axisLeft().scale(yScale).ticks(3);
    
    // svg.append("g")
    //     .attr("style", "color:gray;font-size:14px;")
    //     .attr("transform", "translate("+(width+6)+",0)")
    //     .call(yAxis);
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
        //randomcolor.onclick = handleRandomColorClick;
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
        right.style.display='block';
        handleStepsClick();
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
        d3.select('.auth-image').attr('style','display:none;');
        d3.select('.daily-step').attr('style','display:none;');
        d3.select('.auth-info').text('Get Started by Connecting your Google Account!');
        stepsButton.style.display = 'none';
        caloriesButton.style.display = 'none';
        right.style.display = 'none';
        d3.select('.svg').remove();
        slider.style = 'display:none;';
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

// function getRandomColor() {
//     var letters = '0123456789ABCDEF';
//     var color = '#';
//     for (var i = 0; i < 6; i++) {
//       color += letters[Math.floor(Math.random() * 16)];
//     }
//     return color;
//   }

// function handleRandomColorClick(){
//     var rndm = getRandomColor();
//     d3.select('.line-plot').attr("stroke", rndm);
// }

function makeApiCallSteps() {
    gapi.client.load('fitness', 'v1', function() {
        var request = gapi.client.fitness.users.dataSources.datasets.get({
            userId: 'me',
            dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
            datasetId: midnight-86400000*100 + '000000-' + midnight + '000000', // last 100 days
        });
        request.execute(function(resp) {
            prepareData(resp.point);
            var slider = document.getElementById('slider');
                noUiSlider.create(slider, {
                start: [days.length-7,days.length],
                connect: true,
                step: 1,
                orientation: 'horizontal', 
                behaviour: 'tap-drag', 
                range: {
                'min': 0,
                'max': days.length
                },
                tooltips:true
            });
            slider.noUiSlider.on('update', function () {
                viz(slider.noUiSlider.get());
            });
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
            d3.select('.daily-step').attr('style','display:block;color:white;').text(dailystep);
            //d3.select('.date').text(formatTime(new Date())+", "+new Date().getFullYear())
        });
    });
}
