

function viz(data){
    console.log(data);
    console.log((data.map(d => d.value[0].intVal)));
    var sum = d3.sum(data.map(d => d.value[0].intVal));
    var auth = auth2.currentUser.get().getBasicProfile();

    d3
    .select('.auth-info')
    .attr('style','display:block;color:gray;')
    .text(auth.getGivenName() + ' ' + auth.getFamilyName());
    
    d3
    .select('.daily-step')
    .attr('style','display:block;color:gray;')
    .text(sum + ' steps taken today');
}


var apiKey = 'AIzaSyAFE7Ispkhhy9ZR68mzTL6TWFMrJufkWfU';
var clientId = '283704614465-a6octk36hj6inh564f23d2t10mt0u9fr.apps.googleusercontent.com';
var scopes = 'https://www.googleapis.com/auth/fitness.activity.read';
var auth2;
var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

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
      });
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        makeApiCall();
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

function handleAuthClick(event) {
    auth2.signIn();
}

function handleSignoutClick(event) {
    auth2.signOut();
    d3.select('.daily-step').attr('style','display:none;');
    d3.select('.auth-info').attr('style','display:none;');
}

function makeApiCall() {
    var date = new Date().getTime();
    gapi.client.load('fitness', 'v1', function() {
        var request = gapi.client.fitness.users.dataSources.datasets.get({
            userId: 'me',
            dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
            datasetId: date-86400000 + '000000-' + date + '000000',
        });
        request.execute(function(resp) {
            viz(resp.point);
        });
    });
}