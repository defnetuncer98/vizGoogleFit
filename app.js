const margin = { top: 80, right: 40, bottom: 40, left: 200 };
const width = 600 - margin.right - margin.left;
const height = 500 - margin.top - margin.bottom;

const svg = d3
    .select('.vizGoogleFit')
    .append('svg')
    .attr('width', width + margin.right + margin.left)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

var apiKey = 'AIzaSyCuvY16_caGg_Yq2JPIFSIHhbcMZC0keIs';
var clientId = '283704614465-a6octk36hj6inh564f23d2t10mt0u9fr.apps.googleusercontent.com';
var scopes = 'https://www.googleapis.com/auth/fitness.activity.read';
var auth2;
var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');
function handleClientLoad() {
  // Load the API client and auth library
    gapi.load('client:auth2', initAuth);
}
function initAuth() {
    gapi.client.setApiKey(apiKey);
    gapi.auth2.init({
        client_id: clientId,
        scope: scopes
    }).then(function () {
        auth2 = gapi.auth2.getAuthInstance();
        // Listen for sign-in state changes.
        auth2.isSignedIn.listen(updateSigninStatus);
        // Handle the initial sign-in state.
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
}
// Load the API and make an API call.
function makeApiCall() {
    gapi.client.load('fitness', 'v1', function() {
        var request = gapi.client.fitness.users.dataSources.datasets.get({
            userId: 'me',
            dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
            datasetId: '1476092378000000-' + new Date().getTime() + '000000',
        });
        request.execute(function(resp) {
          console.log(resp);
        });
    });

    console.log(auth2.currentUser.get().getBasicProfile().getGivenName());
    }