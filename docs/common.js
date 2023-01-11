
// just redirects you to the course code you enter. 
// need to add checking here
var prepSearch = (elem, event)=>{
    console.log(courses.length);
    if(event.key == "Enter"){
        var courseCodeInput = elem.value;
        courseCodeInput = courseCodeInput.replace(" ", "").replace("-", "");
        var subCode = courseCodeInput.substring(0,4).toUpperCase();
        var courseNum = courseCodeInput.substring(courseCodeInput.length-4,courseCodeInput.length);
        if(`${subCode}-${courseNum}` in catalog){
            // course exists
            gotoCourse(`${subCode}-${courseNum}`);
        } else {
            // course doesn't exist
            window.location.href = `./search.html?search=${elem.value.replace(" ", "+")}`;
            showSearchResults();
        }
    }
}

// gets just the course link, no HTML
const getClassHref = (course)=>{
    return `href="?course=${course}"`;
}

const gotoCourse = (courseCode)=>{
    window.location.href = `./coursedisplay.html?course=${courseCode}`;
}

const ccode = window.location.search.substring(1).toUpperCase().split("=").slice(-1)[0];
// quatalog data loading (in common so other files can access it)
const _courses = fetch("./quatalog-data/terms_offered.json").then(data => data.json());
const _catalog = fetch("./quatalog-data/catalog.json").then(data => data.json());
const _prereqs = fetch("./quatalog-data/prerequisites.json").then(data => data.json());
const _xlistings = fetch("./quatalog-data/cross_listings.json").then(data => data.json());
const _coreqs = fetch("./quatalog-data/corequisites.json").then(data => data.json());
const _attrs = fetch("./quatalog-data/attributes.json").then(data => data.json());

// so we can use fuse.js to fuzzy search it
var makeSearchableCatalog = (ctlg) => {
    var ctlgKeys = Object.keys(ctlg);
    ctlgArray = [];
    for(var c = 0; c < ctlgKeys.length; c++){
        var thisElem = ctlg[ctlgKeys[c]];
        thisElem["fullCode"] = ctlgKeys[c];
        ctlgArray.push(thisElem);
    }
    return ctlgArray;
}

// call this from any window.onload that needs access to the data 
var loadData = async ()=>{
    return new Promise(async (resolve)=>{
        console.log(`start loading data`);
        globalThis.xlistings = await _xlistings;
        globalThis.catalog = await _catalog;
        globalThis.courses = await _courses;
        globalThis.prereqs = await _prereqs;
        globalThis.coreqs = await _coreqs;
        globalThis.attrs = await _attrs;
        globalThis.searchableCatalog = makeSearchableCatalog(catalog);
        globalThis.current_term = Object.keys(courses["current_term"])[0];
        console.log(current_term.length);  
        resolve();
    })
}

// this will get overridden by other window.onload assignments. It is a backup.
window.onload = async ()=>{
    await loadData();
}