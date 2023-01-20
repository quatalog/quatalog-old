"use strict";
// Get course code from URL

const viewTypes = [
    "simple",
    "name",
    "prof"
]

const set_term = function(term,type = "offered", offered=true) {
    const inst = offered ? course_data[term] : []; // has [coursename, credits, attributes, instructors]
    var elem; 
    if(term.substring(4) == "05") {
        elem = document.getElementById(term+"02");
        elem.id = term;
        elem.classList.remove("summer2");
        elem.classList.add("summer");
        elem.colSpan = "2";
        document.getElementById(term+"03").remove();
    } else {
        elem = document.getElementById(term);
    }
    if(elem) {
        elem.classList.add(type);

        // want to add everything to this. We will hide and unhide based on the view
        var fullHTML = "";

        // only for offered pretty much
        if(inst.length){
            fullHTML += genDetailedViewHTML(inst); // for the detailed view
        }

        // put it in there !
        elem.innerHTML = fullHTML;
    }
}

// makes an array of instructors
var makeInstructorArray = (inst) => {
    // horrible will mess.
    return Array.from(
        new Set(inst.slice(3).map(x => x.split(",")[0]))
    )
}

var genDetailedViewHTML = (inst) => {
    return '<div class="view-container detail-view-container"><div class="term-course-info">'
    + '<span class="course-title">' + inst[0] + '</span>'
    + '<span class="course-credit-count"> (' + inst[1] + 'c)</span>'
    + '<span class="course-attributes"> ' + inst[2] + '</span></div>' 
    + '<ul class="prof-list"><li>' + makeInstructorArray(inst).join("</li><li>") + '</li></ul>' + '</div>';
}


// just make them available to other functions up here. not like we're gonna be dealing with multiple classes in this scope.
var all_terms;
var course_data;
var terms_offered;
var scheduled_terms;
var terms_offered_alt_code;
var terms_not_offered;
var unscheduled_terms;
var last_term_offered;
var alt_codes;


/*
db   db d88888b db      d8888b. d88888b d8888b. .d8888.
88   88 88'     88      88  `8D 88'     88  `8D 88'  YP
88ooo88 88ooooo 88      88oodD' 88ooooo 88oobY' `8bo.
88~~~88 88~~~~~ 88      88~~~   88~~~~~ 88`8b     `Y8b.
88   88 88.     88booo. 88      88.     88 `88. db   8D
YP   YP Y88888P Y88888P 88      Y88888P 88   YD `8888Y'

*/

// gets just the course link, no HTML
const getCourseHref = (course)=>{
	return 'href="?course='+course+'"';
}

// Helper to get the course name. Uses catalog and 
const getCourseName = function(course,catalog,courses_data) {
	if(catalog[course]) {
		return " " + catalog[course]["name"];
	} else {
		try {
			return " " + getCourseData(course,courses_data)[getLastTermOffered(course,courses_data)][0];
		} catch {
			return "";
		}
	}
}

// very similar to linkify except adds in pill styling. made separate so we don't mess up the linkify function
const pillLinkify = function(course,catalog,courses_data) {
    return '<a class="course-pill" '+getCourseHref(course)+">"
    +course
    +getCourseName(course,catalog,courses_data)
    +"</a>";
}

const noneRect = '<span class="none-rect">none</span>';
const unknownRect = '<span class="unknown-rect">unknown</span>';

// Helper functions for dealing with prerequisites
// Catalog prerequisites are occasionally wrong,
// so we will use SIS data
// returns up a pill based version of the prereq
const pillFormatPrerequisites = function(prereq,catalog,courses_data) {
    if(prereq) {
        const fp = _pillFormatPrerequisites(prereq,catalog,courses_data);
        if(fp.search(/^\(/) != -1) {
            return fp.slice(1,-1);
        } else {
            return fp;
        }
    } else {
        return noneRect;
    }
}

// Recursive helper function
const _pillFormatPrerequisites = function(prereq,catalog,courses_data) {
    if(prereq["type"] == "course") {
        const course = prereq["course"];
        return pillLinkify(course.substring(0,4)+"-"+course.substring(5),catalog,courses_data);
    } else if(prereq["type"] == "or"){
        return '<div class="pr-or-con"><div class="pr-or-title">one of:</div><div class="pr-or">'
        + prereq["nested"]
            .map((x) => _pillFormatPrerequisites(x,catalog,courses_data))
            .join("")
        + "</div></div>";
    } else if(prereq["type"] == "and"){
        return prereq["nested"]
            .map((x) => _pillFormatPrerequisites(x,catalog,courses_data))
            .join('<div class="pr-and">'+prereq.type+"</div>");
    } else {
        return "";
    }
}


/*
db   db d888888b  d888b  db   db      db      d88888b db    db d88888b db
88   88   `88'   88' Y8b 88   88      88      88'     88    88 88'     88
88ooo88    88    88      88ooo88      88      88ooooo Y8    8P 88ooooo 88
88~~~88    88    88  ooo 88~~~88      88      88~~~~~ `8b  d8' 88~~~~~ 88
88   88   .88.   88. ~8~ 88   88      88booo. 88.      `8bd8'  88.     88booo.
YP   YP Y888888P  Y888P  YP   YP      Y88888P Y88888P    YP    Y88888P Y88888P

high level functions called directly from onload.
*/


// adds the little pills for the attributes
const addAttrs = (attrList, attrContainerId) => {
    if(!attrList){
        return;
    }
    for(const thisAttr of attrList) {
        var idableAttr = thisAttr.replace(" ", "-").toLowerCase();
        var thisPill = document.getElementById(attrContainerId)
            .appendChild(document.createElement("span"));
        thisPill.setAttribute("class", "attr-pill");
        thisPill.id = 'attr-pill-'+idableAttr;
        thisPill.innerHTML = thisAttr;
    }
}

// either displays the cross-listings or hides the container
// works on coreqs too
const handleCrossListings = (cList, containerId, listId, catalog) => {
    var containerElem = document.getElementById(containerId);
    if(!cList){
        if(containerElem != null)
            containerElem.setAttribute("class", "hidden");
    } else {
        var listContainerElem = document.getElementById(listId);
        for(const cLists of cList){
            listContainerElem.innerHTML += pillLinkify(cLists, catalog);    
        }
    }
}

const makeTable = () => {
    // Use HTML template to create rows in the table
    const year_row_template = document.getElementById("year-row").innerHTML;
    const table = document.getElementById("years-table");
    all_terms = [];
    for(var i = parseInt(current_term.substring(0,4));i >= 2007;i--) {
        const row = table.insertRow(-1);
        row.classList.add(i);
        row.innerHTML = year_row_template;
        const cells = row.children;
        const j = i.toString();
        cells[0].innerText = i; // year
        cells[1].id = j+"01"; // spring
        cells[2].id = j+"0502"; // summer
        cells[3].id = j+"0503"; // summer
        cells[4].id = j+"09"; // fall
        cells[5].id = j+"12"; // winter
        all_terms.push(j+"01",
                    j+"05",
                    j+"0502",
                    j+"0503",
                    j+"09",
                    j+"12");
    }
    return all_terms;
}


const addCourseInfo = ()=>{
    // Set up the code, catalog title, and catalog description
    document.getElementById("ccode").innerText = ccode;
    const title = document.getElementById("title");
    title.innerText = ccode;
    const cname = getCourseName(ccode,catalog,courses);
    const catalog_entry = catalog[ccode];
    document.getElementById("cdesc").innerText = catalog_entry
		? catalog_entry["description"]
		: "This course is not in the most recent catalog. If the course code is X96X or X97X, this is because it is a topics course code, which are often reused and thus do not have a catalog entry. Otherwise, the course may have been discontinued."

    title.innerText += ": " + cname;
    document.getElementById("cname").innerText = cname;
    document.getElementById("ccredits").innerText = last_term_offered ? course_data[last_term_offered][1] : "Unknown";
    document.getElementById("prereq-classes").innerHTML = last_term_offered ? pillFormatPrerequisites(prereqs[ccode],catalog,courses) : unknownRect;
}

const makeOfferingData = () => {
    alt_codes = (xlistings[ccode] || []).flatMap(c => c.search(/^STSO/) == -1 ? c : ["STSH"+c.substring(4),"STSS"+c.substring(4),c])
    course_data = getCourseData(ccode,courses);
    terms_offered = new Set(Object.keys(course_data));
    scheduled_terms = new Set(Object.keys(courses["all_terms"]));
    terms_offered_alt_code = new Set(alt_codes
                                .flatMap(c => Object.keys(getCourseData(c,courses))
                                .filter(c => !terms_offered.has(c)
                                    && !terms_offered.has(c+"02")
                                    && !terms_offered.has(c+"03"))));
    terms_not_offered = new Set(Object.keys(courses["all_terms"])
                                .filter(item => !terms_offered.has(item)
                                    && !terms_offered.has(item+"02")
                                    && !terms_offered.has(item+"03")
                                    && !terms_offered_alt_code.has(item)
                                    && !terms_offered_alt_code.has(item+"02")
                                    && !terms_offered_alt_code.has(item+"03")
                                    ));
    unscheduled_terms = new Set(all_terms
                                .filter(item => !scheduled_terms.has(item)));
    
    last_term_offered = Object.keys(course_data).sort(compare_terms).slice(-1)[0];
}

const colorTable = () => {
    // Terms offered under normal code, in green
    // Terms not offered and not scheduled, in red and gray
    // Terms offered only under different code, in yellow (e.g. Materials Science)
    Object.keys(course_data).forEach(t => set_term(t))
    Array.from(terms_offered_alt_code).forEach(t => set_term(t,"offered-diff-code",false));
    Array.from(terms_not_offered).forEach(t => set_term(t,"not-offered",false));
    Array.from(unscheduled_terms).forEach(t => set_term(t,"unscheduled",false));

    // Disable enrichment term if nothing is there
    if(!Array.from(terms_offered).filter(item => item.substring(4,6) == "12").length) {
        document.getElementById("disable-enrichment").media = "";
    }
}

/*
 .d88b.  d8b   db db       .d88b.   .d8b.  d8888b.
.8P  Y8. 888o  88 88      .8P  Y8. d8' `8b 88  `8D
88    88 88V8o 88 88      88    88 88ooo88 88   88
88    88 88 V8o88 88      88    88 88~~~88 88   88
`8b  d8' 88  V888 88booo. `8b  d8' 88   88 88  .8D
 `Y88P'  VP   V8P Y88888P  `Y88P'  YP   YP Y8888D'

*/

window.onload = async function() {
    await loadData(); // load all quatalog data

    // make the table itself
    makeTable();

    // Create bulleted lists of cross-listings, corequisites, attributes

    // make the cross listings
    handleCrossListings(xlistings[ccode], "crosslist-container", "crosslist-classes", catalog);
    // make the coreqs
    handleCrossListings(coreqs[ccode], "coreq-container", "coreq-classes", catalog);
    // make the attributes
    addAttrs(attrs[ccode],"cattrs-container");

    // get the actual data. stores it in global-ish variables for easy access
    makeOfferingData();

    // adds course info (name, description, etc)
    addCourseInfo();

    colorTable();
}
