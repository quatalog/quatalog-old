const displaySearchTerm = () => {
    document.getElementById("searchTerm").innerHTML = '"' + ccode.replaceAll("+", " ").toLowerCase() + '"';
}

var makeAttrListHTML = (courseCode) => {
    var attrListHTML = '';
    if(courseCode in attrs){
        var thisCourseAttrs = attrs[courseCode];
        for(var i = 0; i < thisCourseAttrs.length; i++){
            var thisAttr = thisCourseAttrs[i];
            if(thisAttr == "Communication Intensive"){
                attrListHTML += `<div class="attr sattr sattr-pill CI-pill">CI${iconSVGs.message}</div>`;
                continue;
            }
            if(thisAttr == "Writing Intensive"){
                attrListHTML += `<div class="attr sattr sattr-pill WI-pill">WI${iconSVGs.pencil}</div>`;
                continue;
            }
            if(thisAttr == "HASS Inquiry"){
                attrListHTML += `<div class="attr sattr sattr-pill HI-pill">HInq${iconSVGs.magnifying}</div>`;
                continue;
            }
            if(thisAttr == "PDII Option for Engr Majors"){
                attrListHTML += `<div class="attr sattr sattr-pill PD-pill">PDII${iconSVGs.briefcase}</div>`;
                continue;
            }
            if(thisAttr == "Online Course"){
                attrListHTML += `<div class="attr sattr sattr-pill">Online${iconSVGs.laptop}</div>`;
                continue;
            }
            if(thisAttr == "Hybrid:Online/In-Person Course"){
                attrListHTML += `<div class="attr sattr sattr-pill">Hybrid${iconSVGs["house-laptop"]}</div>`;
                continue;
            }
            if(thisAttr == "Introductory Level Course") continue;
            if(thisAttr == "Culminating Exp/Capstone"){
                attrListHTML += `<div class="attr sattr sattr-pill">CulmExp${iconSVGs.cubes}</div>`;
                continue;
            }
            attrListHTML += `<div class="attr sattr sattr-pill">${thisAttr}</div>`;
        }
    }
    return attrListHTML;
}

var makeDeadHTML = (courseCode) => {
    var isDead = isCourseDead(courseCode);
    if(isDead == 2){
        return `<div class="dead sattr sattr-pill">Not Yet Offered${iconSVGs.amogus}</div>`;
    }
    if(isDead){
        return `<div class="dead sattr sattr-pill">Probably Dead${iconSVGs.skull}</div>`;
    }
    return '';
}

var makeCourseHTML = (courseCode, score) => {
    var thisCourse = catalog[courseCode];
    return `
    <div class="courseContainer" onclick="gotoCourse('${courseCode}')">
        <div class="courseShelf">
            <div class="courseName sattr">${thisCourse.name}</div>
            <div class="courseCode sattr">${courseCode}</div>
            ${makeAttrListHTML(courseCode)}
            ${makeDeadHTML(courseCode)}
        </div>
        <div class="attrs"></div>
        <div class="description">${thisCourse.description}</div>
    </div>
    `
}

const searchConfig = {
    includeScore: true,
    ignoreLocation: true,
    useExtendedSearch: true,
    threshold: 0.01,
    keys: [
        {
            name: 'fullCode',
            weight: 0.15
        },
        {
            name: 'name',
            weight: 0.7
        },
        {
            name: 'description',
            weight: 0.15
        }
    ]
}
const searchConfigFuzzy = {
    includeScore: true,
    ignoreLocation: true,
    threshold: 0.1,
    keys: [
        {
            name: 'fullCode',
            weight: 0.15
        },
        {
            name: 'name',
            weight: 0.7
        },
        {
            name: 'description',
            weight: 0.15
        }
    ]
}

var fuzzySearchCourses = (searchInput) => {
    const fuse = new Fuse(searchableCatalog, searchConfig);
    console.log(`searching for ${searchInput}...`);
    // return fuse.search(`="${searchInput}"`);
    var includeResults = fuse.search(`'"${searchInput}"`);
    if(includeResults.length > 0){
        return includeResults;
    } else {
        const fuzzyFuse = new Fuse(searchableCatalog, searchConfigFuzzy);
        return fuzzyFuse.search(searchInput);
    }
}

var showSearchResults = () => {
    var searchResults = fuzzySearchCourses(ccode.replaceAll("+", " ").toLowerCase());
    var validResults = [];
    for(var i = 0; i < 20; i++){
        var thisResult = searchResults[i];
        if(thisResult){
            var thisCourse = thisResult.item;
            var thisCourseCode = thisCourse.fullCode;
            if(thisResult.score > 0.5){
                // break;
            }
            validResults.push(thisResult);
            // document.getElementById("searchResultsContainer").innerHTML += makeCourseHTML(thisCourseCode, thisResult.score);
        }
    }
    // show the closest matches first but otherwise sort by course code
    validResults.sort((a,b)=>{
        if(a.score - b.score > 0.05){
            return 1;
        } else if(b.score - a.score > 0.05){
            return -1;
        }
        return a.item.crse > b.item.crse;
    })
    for(var i = 0; i < validResults.length; i++){
        var thisResult = validResults[i];
        var thisCourse = thisResult.item;
        var thisCourseCode = thisCourse.fullCode;
        document.getElementById("searchResultsContainer").innerHTML += makeCourseHTML(thisCourseCode, thisResult.score);
    }
}

window.onload = async () =>{
    await loadData();
    displaySearchTerm();
    showSearchResults();
}