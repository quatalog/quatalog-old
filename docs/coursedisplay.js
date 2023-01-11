"use strict";
// Get course code from URL

const set_term = function(c,term,type = "offered",l = []) {
    const inst = c[term] || l;
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
        if(l.length) {
            elem.innerHTML += "<h4>" + l[0] + "</h4>";
            if(inst.length > 1) {
                elem.innerHTML += "<ul><li>"
                    + Array.from(new Set(l.slice(1))).join("</li><li>")
                    + "</li></ul>";
            }
        } else if(inst.length) {
            elem.innerHTML += "<h4>"
                + inst[0] + " (" + inst[1] + "c) " + inst[2]
                + "</h4>";
            if(inst.length > 3) {
                elem.innerHTML += "<ul><li>"
                    + Array.from(
                            new Set(inst.slice(3).map(x => x.split(",")[0]))
                        ).join("</li><li>")
                    + "</li></ul>";
            }
        }
    }
}



// Makes courses links
const linkify = function(course,catalog,name_override) {
        return '<a href="?course='
        +course
        +'">'
        +course
        +(name_override ? " " + name_override : (catalog[course] ? " " + catalog[course]["name"] : ""))
        +"</a>";
}

// very similar to linkify except adds in pill styling. made separate so we don't mess up the linkify function
const pillLinkify = (course,catalog,name_override) => {
    return `<a class="course-pill" ${getClassHref(course)}>${course} ${name_override ? name_override : (catalog[course] ? catalog[course]["name"] : "")}</a>`
}



// sam note: leaving these here for now but making new pill based ones

// Helper functions for dealing with prerequisites
// Catalog prerequisites are occasionally wrong,
// so we will use SIS data
const formatPrerequisites = function(prereq,catalog) {
    if(prereq) {
        const fp = _formatPrerequisites(prereq,catalog);
        if(fp.search(/^\(/) != -1) {
            return fp.slice(1,-1);
        } else {
            return fp;
        }
    } else {
        return "None";
    }
}

// Recursive helper function
const _formatPrerequisites = function(prereq,catalog) {
    if(prereq["type"] == "course") {
        const course = prereq["course"];
        return linkify(course.substring(0,4)+"-"+course.substring(5),catalog);
    } else {
        return "("
            + prereq["nested"]
                .map((x) => _formatPrerequisites(x,catalog))
                .join(" "+prereq.type+" ")
            + ")";
    }
}

const noneRect = `<span class="none-rect">none</span>`;
const unknownRect = `<span class="unknown-rect">unknown</span>`;

// Helper functions for dealing with prerequisites
// Catalog prerequisites are occasionally wrong,
// so we will use SIS data
// returns up a pill based version of the prereq
const pillFormatPrerequisites = function(prereq,catalog) {
    if(prereq) {
        const fp = _pillFormatPrerequisites(prereq,catalog);
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
const _pillFormatPrerequisites = function(prereq,catalog) {
    if(prereq["type"] == "course") {
        const course = prereq["course"];
        // return linkify(course.substring(0,4)+"-"+course.substring(5),catalog);
        return pillLinkify(course.substring(0,4)+"-"+course.substring(5),catalog);
    } else if(prereq["type"] == "or"){
        return `<div class="pr-or-con"><div class="pr-or-title">one of:</div><div class="pr-or">`
        + prereq["nested"]
            .map((x) => _pillFormatPrerequisites(x,catalog))
            .join("")
        + "</div></div>";
    } else if(prereq["type"] == "and"){
        return prereq["nested"]
            .map((x) => _pillFormatPrerequisites(x,catalog))
            .join(`<div class="pr-and">${prereq.type}</div>`);
    } else {
        return "";
    }
}






// Used for corequisite and prerequisite displays
const createList = function(list,titleid,listid,catalog = false) {
    if(!list) {
        document.getElementById(titleid).style.display = "none";
    } else {
        for(const code of list) {
            document.getElementById(listid)
                .appendChild(document.createElement("li"))
                .innerHTML = catalog ? linkify(code,catalog) : code;
        }
    }
}



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
        thisPill.id = `attr-pill-${idableAttr}`;
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

window.onload = async function() {
    await loadData(); // load all quatalog data

    // Use HTML template to create rows in the table
    const year_row_template = document.getElementById("year-row").innerHTML;
    const table = document.getElementById("years-table");
    var all_terms = [];
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


    // Create bulleted lists of cross-listings, corequisites, attributes
    // make the cross listings
    handleCrossListings(xlistings[ccode], "crosslist-container", "crosslist-classes", catalog);
    // make the coreqs
    handleCrossListings(coreqs[ccode], "coreq-container", "coreq-classes", catalog);
    const alt_codes = (xlistings[ccode] || [])
                        .concat([ccode])
                        .flatMap(c => c.search(/^STSO/) == -1 ? c :
                            ["STSH"+c.substring(4),"STSS"+c.substring(4),c])
                        .slice(0,-1);
    addAttrs(attrs[ccode],"cattrs-container");


    const course_data = courses[ccode] || [];
    const terms_offered = new Set(Object.keys(course_data));
    const scheduled_terms = new Set(Object.keys(courses["all_terms"]));
    const terms_offered_alt_code = new Set(alt_codes
                                .flatMap(c => Object.keys(courses[c] || [])
                                .filter(c => !terms_offered.has(c)
                                    && !terms_offered.has(c+"02")
                                    && !terms_offered.has(c+"03"))));
    const terms_not_offered = new Set(Object.keys(courses["all_terms"])
                                .filter(item => !terms_offered.has(item)
                                    && !terms_offered.has(item+"02")
                                    && !terms_offered.has(item+"03")
                                    && !terms_offered_alt_code.has(item)
                                    && !terms_offered_alt_code.has(item+"02")
                                    && !terms_offered_alt_code.has(item+"03")
                                    ));
    const unscheduled_terms = new Set(all_terms
                                .filter(item => !scheduled_terms.has(item)));

    
    const last_term_offered = Object.keys(course_data).sort(compare_terms).slice(-1)[0];

    // Set up the code, catalog title, and catalog description
    document.getElementById("ccode").innerText = ccode;
    const title = document.getElementById("title");
    const catalog_entry = catalog[ccode];
    title.innerText = ccode;
    var cname;
    if(catalog_entry) {
        cname = catalog_entry["name"];
        document.getElementById("cdesc").innerText = catalog_entry["description"];
    } else {
        cname = course_data[last_term_offered][0];
    }
    title.innerText += ": " + cname;
    document.getElementById("cname").innerText = cname;

    document.getElementById("ccredits").innerText = last_term_offered ? course_data[last_term_offered][1] : "Unknown";
    // document.getElementById("cprereqs").innerHTML = last_term_offered ? formatPrerequisites(prereqs[ccode],catalog) : "Unknown";
    document.getElementById("prereq-classes").innerHTML = last_term_offered ? pillFormatPrerequisites(prereqs[ccode],catalog) : unknownRect;

    // Terms offered under normal code, in green
    // Terms not offered and not scheduled, in red and gray
    // Terms offered only under different code, in yellow (e.g. STSS/STSH, Materials Science)
    console.log(terms_offered)
    console.log(terms_offered_alt_code)
    Object.keys(course_data).forEach(t => set_term(course_data,t))
    Array.from(terms_offered_alt_code).forEach(t => set_term("",t,"offered-diff-code",[]));
    Array.from(terms_not_offered).forEach(t => set_term("",t,"not-offered",[]));
    Array.from(unscheduled_terms).forEach(t => set_term("",t,"unscheduled",[]));

    // Disable enrichment term if nothing is there
    if(!Array.from(terms_offered).filter(item => item.substring(4,6) == "12").length) {
        document.getElementById("disable-enrichment").media = "";
    }
}