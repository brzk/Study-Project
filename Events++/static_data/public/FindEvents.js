//var server_prefix = "https://eventspp.herokuapp.com";
var server_prefix = "http://localhost:5000";

$( "#publicEventCategory" ).change(function() {
    document.getElementById("myPublicEvents").innerHTML = "";
    var path = "/findPublicEvents/" + getSelectValue("publicEventCategory");
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if(this.readyState == 4 && this.status === 200)
        {
            var arr = JSON.parse(this.responseText);
            for (var i = 0; i < arr.length; i++) {
                addEvent(arr[i], "myPublicEvents");
            }
        } else if(this.readyState == 4 && this.status === 500)
        {
            alert(JSON.parse(this.responseText).error);
        }
    };
    request.open("GET", server_prefix + path, true );
    request.send();
});