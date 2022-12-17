
// just redirects you to the course code you enter. 
// need to add checking here
var prepSearch = (elem, event)=>{
    if(event.key == "Enter"){
        var courseCodeInput = elem.value;
        courseCodeInput = courseCodeInput.replace(" ", "").replace("-", "");
        var subCode = courseCodeInput.substring(0,4).toUpperCase();
        var courseNum = courseCodeInput.substring(courseCodeInput.length-4,courseCodeInput.length);
        window.location.href = "./coursedisplay.html?course="+subCode+"-"+courseNum;
    }
}
