"use strict";

// parses URL params
const getParams = window
	.location
	.search
	.slice(1)
	.split("&")
	.map(p => p.split("="))
	.reduce((obj,[key,value]) =>
		({ ...obj, [key]: decodeURIComponent(value) }),
		{}
	);
const searchQuery = getParams["search"];

const displaySearchTerm = () => {
    document.getElementById("title").innerText = searchQuery + " - Quatalog Search";
    document.getElementById("searchTerm").innerHTML = '"' + searchQuery + '"';
}

const makeAttrListHTML = (courseCode) => {
    const beginPill = '<div class="attr sattr sattr-pill ';
    var attrListHTML = '';
    if(courseCode in attrs){
        const thisCourseAttrs = attrs[courseCode];
        for(var i = 0; i < thisCourseAttrs.length; i++){
            var thisAttr = thisCourseAttrs[i];
            if(thisAttr == "Communication Intensive"){
                attrListHTML += beginPill+`CI-pill">CI${getSVG("message")}</div>`;
                continue;
            }
            if(thisAttr == "Writing Intensive"){
                attrListHTML += beginPill+`WI-pill">WI${getSVG("pencil")}</div>`;
                continue;
            }
            if(thisAttr == "HASS Inquiry"){
                attrListHTML += beginPill+`HI-pill">HInq${getSVG("magnifying")}</div>`;
                continue;
            }
            if(thisAttr == "PDII Option for Engr Majors"){
                attrListHTML += beginPill+`PD-pill">PDII${getSVG("briefcase")}</div>`;
                continue;
            }
            if(thisAttr == "Online Course"){
                //attrListHTML += beginPill+`">Online${getSVG("laptop")}</div>`;
                continue;
            }
            if(thisAttr == "Hybrid:Online/In-Person Course"){
                //attrListHTML += beginPill+`">Hybrid${getSVG("house-laptop")}</div>`;
                continue;
            }
            if(thisAttr == "Introductory Level Course") continue;
            if(thisAttr == "Culminating Exp/Capstone"){
                attrListHTML += beginPill+`">CulmExp${getSVG("cubes")}</div>`;
                continue;
            }
            attrListHTML += beginPill+`">${thisAttr}</div>`;
        }
    }
    return attrListHTML;
}

const isCourseDead = (courseCode)=>{
    const last_term_offered = getLastTermOffered(courseCode);
    if(last_term_offered == undefined){
        return 2;
    }
    const lastYear = last_term_offered.toString().substring(0,4);
    const currentYear = current_term.toString().substring(0,4);
    return currentYear-lastYear > 4;
}

const makeDeadHTML = (courseCode) => {
    const isDead = isCourseDead(courseCode);
    const beginPill = '<div class="attr sattr sattr-pill>';
    if(isDead == 2) {
        return beginPill+`Not Yet Offered${getSVG("amogus")}</div>`;
    } else if(isDead) {
        return beginPill+`Probably Dead${getSVG("skull")}</div>`;
    }
    return '';
}

const makeCreditCountHTML = (courseCode) => {
    const last_term_offered = getLastTermOffered(courseCode);
    const credit_count = last_term_offered ? courses[courseCode][last_term_offered][1] : "Unknown";
    return '<div class="attr sattr sattr-pill">'
        +credit_count
        +' credit'
        +(credit_count == 1 ? '' : 's')
        +'</div>';
}

const makeCourseHTML = (courseCode,score) => {
    const thisCourse = catalog[courseCode];
    return `
    <a href="./coursedisplay.html?course=${courseCode}" style="text-decoration: none;">
        <div class="courseContainer">
            <div class="courseShelf">
                <div class="courseName sattr">${thisCourse.name}</div>
                <div class="courseCode sattr">${courseCode}</div>
                ${makeCreditCountHTML(courseCode)}
                ${makeAttrListHTML(courseCode)}
                ${makeDeadHTML(courseCode)}
            </div>
            <div class="attrs"></div>
            <div class="description">${thisCourse.description}</div>
        </div>
    </a>
    `
}

// so we can use fuse.js to fuzzy search it
const makeSearchableCatalog = (ctlg) => {
    const ctlgKeys = Object.keys(ctlg);
    var ctlgArray = [];
    for(var c = 0; c < ctlgKeys.length; c++){
        var thisElem = ctlg[ctlgKeys[c]];
        thisElem["fullCode"] = ctlgKeys[c];
        ctlgArray.push(thisElem);
    }
    return ctlgArray;
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
    ],
}

const fuzzySearchCourses = (searchInput) => {
    const fuse = new Fuse(makeSearchableCatalog(catalog), searchConfig);
    console.log(`searching for "${searchInput}"...`);
    return fuse.search(searchInput, {limit: 25});
}

const showSearchResults = () => {
    const searchResults = fuzzySearchCourses(searchQuery.toLowerCase());
    searchResults.sort((a,b)=>{ //prioritize lower course code for similar scores
        if(a.score - b.score > 0.05)
            return 1;
        else if(b.score - a.score > 0.05)
            return -1;
        return (a.item.crse > b.item.crse) || -1;
    })
    // console.table(searchResults);
    for(var i = 0; i < searchResults.length; i++) {
        const code = searchResults[i].item.fullCode;
        const score = searchResults[i].score;
        const entry = makeCourseHTML(code, score);
        document.getElementById("searchResultsContainer").innerHTML += entry;
    }
}

window.onload = async () =>{
    await loadData();
    displaySearchTerm();
    showSearchResults();
}
