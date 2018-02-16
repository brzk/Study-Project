//var server_prefix = "https://eventspp.herokuapp.com";
var server_prefix = "http://localhost:5000";

var current_user = "";
var isMale = true;

function male() {
    isMale = true;
}

function female() {
    isMale = false;
}

$('.form').find('input, textarea').on('keyup blur focus', function (e) {
    var $this = $(this),
        label = $this.prev('label');

    if (e.type === 'keyup') {
        if ($this.val() === '') {
            label.removeClass('active highlight');
        } else {
            label.addClass('active highlight');
        }
    } else if (e.type === 'blur') {
        if( $this.val() === '' ) {
            label.removeClass('active highlight');
        } else {
            label.removeClass('highlight');
        }
    } else if (e.type === 'focus') {

        if( $this.val() === '' ) {
            label.removeClass('highlight');
        }
        else if( $this.val() !== '' ) {
            label.addClass('highlight');
        }
    }
});

$('.tab a').on('click', function (e) {
    e.preventDefault();
    $(this).parent().addClass('active');
    $(this).parent().siblings().removeClass('active');

    target = $(this).attr('href');

    $('.tab-content > div').not(target).hide();
    $(target).fadeIn(600);
});

function moveToAfterLogin() {
    window.location.href = server_prefix + "/public/AfterLogin.html";
}
function initConnection() {
    var path = "/public/AfterLogin.html";
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if(this.readyState == 4 && this.status === 200)
        {}
        else if (this.readyState == 4 && this.status == 500) {}
    };
    request.open("POST", server_prefix + path, true );
    request.send();
}

function hidePrivate() {
    document.getElementById("private").style.display = "none";
    document.getElementById("privateLi").className = "tab";
    document.getElementById("publicLi").className = "tab active";
    document.getElementById("public").style.display = "block";
    currentFriendList = [];
}

function hidePublic() {
    document.getElementById("public").style.display = "none";
    document.getElementById("publicLi").className = "tab";
    document.getElementById("privateLi").className = "tab active";
    document.getElementById("private").style.display = "block";
    currentFriendList = [];
}

function login() {
    try {
        var user = document.getElementById("login_user").value;
        var password = document.getElementById("login_password").value;
        var path = "/login/" + encodeURIComponent(user) + "/" + encodeURIComponent(password);
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (this.readyState == 4 && this.status === 200) {
                current_user = user;
                alert("Welcome " + user + "!");
                moveToAfterLogin();
            } else if (this.readyState == 4 && this.status == 500) {
                alert(JSON.parse(this.responseText).error);
            }
        };
        request.open("POST", server_prefix + path, true);
        request.send();
    } catch(err) {
        alert(err);
    }
}

function signup() {
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    var email = document.getElementById("email").value;
    var birthday = document.getElementById("birthday").value;
    var sex = isMale ? "Male" : "Female";
    var timestamp = Date.parse(birthday);

    if (username !== "" && password !== "" &&
        email !== "" && isNaN(timestamp) === false) {
        var path = "/register/" + encodeURIComponent(username) + "/" + encodeURIComponent(password) +"/" + encodeURIComponent(email) + "/" + encodeURIComponent(birthday) + "/" + sex;
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                alert(" registered.");
            } else if (this.readyState == 4 && this.status == 500) {
                alert(JSON.parse(this.responseText).error);
            }
        };
        request.open("POST", server_prefix + path, true);
        request.send();
    }
    else{
        alert('Please fill all the fields');
    }
}