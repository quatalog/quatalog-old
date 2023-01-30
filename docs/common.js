"use strict";

// redirects you to the course code you enter, if the course exists
// otherwise redirects you to the search
const prepSearch = (elem, event)=>{
    console.log(courses.length);
    if(event.key == "Enter"){
        const courseCodeInput = elem.value.replace(" ", "").replace("-", "");
        const subCode = courseCodeInput.substring(0,4).toUpperCase();
        const courseNum = courseCodeInput.substring(courseCodeInput.length-4,courseCodeInput.length);
        if(`${subCode}-${courseNum}` in catalog){
            // course exists
            window.location.href = "./coursedisplay.html?course="+subCode+"-"+courseNum;
        } else {
            // course doesn't exist
            window.location.href = "./search.html?search="+encodeURIComponent(elem.value);
            showSearchResults();
        }
    }
}

const range = (start, stop, step) => Array.from({ length: (stop - start) / step + 1}, (_, i) => start + (i * step));

const getCourseData = (course)=>{
	// Handling for topics courses. I want the table to show *all* the topics
	// courses offered at the given level (1960, 2960, 4960, 6960) in the given
	// term. This shows *one* of the topics courses offered during a term.
	// Probably need to rework the object's structure
	// to get this to work, or do something hacky. Putting it off for now.
	var subjcodes = [course.substring(0,4)];
	if(subjcodes[0] == "STSO") {
		subjcodes.push("STSH","STSS");
	}
	var codes = [];
	for(const subjcode of subjcodes) {
		if(course.substring(6) == "960") {
			const level = course.substring(4,6);
			range(960,979,1).map(c => subjcode+level+c).forEach(c => codes.push(c));
		} else {
			codes.push(subjcode+course.substring(4));
		}
	}

	const data_list = codes.map(c => courses[c] || {});
	
	var table = {};
	for(const code_data of data_list) {
		for(const semester of Object.keys(code_data)) {
			table[semester] = code_data[semester];
		}
	}

	return table;
}

const getLastTermOffered = (course)=>{
	return Object.keys(getCourseData(course)).sort(compare_terms).slice(-1)[0];
}

const compare_terms = function(a,b) {
    if(a == b) {
        return 0;
    } if(a.substring(0,6) < b.substring(0,6)) {
        return -1;
    } else if(a.substring(0,6) > b.substring(0,6)) {
        return 1;
    } else if(a.length < b.length) {
        return -1;
    } else if(a.substring(7) < b.substring(7)) {
        return -1;
    } else {
        return 1;
    }
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

const ccode = window.location.search.substring(1).toUpperCase().split("=").slice(-1)[0];
// quatalog data loading (in common so other files can access it)
const _courses = fetch("./quatalog-data/terms_offered.json").then(data => data.json());
const _catalog = fetch("./quatalog-data/catalog.json").then(data => data.json());
const _prereqs = fetch("./quatalog-data/prerequisites.json").then(data => data.json());
const _xlistings = fetch("./quatalog-data/cross_listings.json").then(data => data.json());
const _coreqs = fetch("./quatalog-data/corequisites.json").then(data => data.json());
const _attrs = fetch("./quatalog-data/attributes.json").then(data => data.json());

// call this from any window.onload that needs access to the data 
const loadData = async ()=>{
    return new Promise(async (resolve)=>{
        console.log("start loading data");
        globalThis.xlistings = await _xlistings;
        globalThis.catalog = await _catalog;
        globalThis.courses = await _courses;
        globalThis.prereqs = await _prereqs;
        globalThis.coreqs = await _coreqs;
        globalThis.attrs = await _attrs;
        globalThis.current_term = Object.keys(courses["current_term"])[0];
        resolve();
    })
}

// this will get overridden by other window.onload assignments. It is a backup.
window.onload = loadData;

/*
d888888b  .o88b.  .d88b.  d8b   db      db   db d88888b db      d8888b. d88888b d8888b. .d8888.
  `88'   d8P  Y8 .8P  Y8. 888o  88      88   88 88'     88      88  `8D 88'     88  `8D 88'  YP
   88    8P      88    88 88V8o 88      88ooo88 88ooooo 88      88oodD' 88ooooo 88oobY' `8bo.
   88    8b      88    88 88 V8o88      88~~~88 88~~~~~ 88      88~~~   88~~~~~ 88`8b     `Y8b.
  .88.   Y8b  d8 `8b  d8' 88  V888      88   88 88.     88booo. 88      88.     88 `88. db   8D
Y888888P  `Y88P'  `Y88P'  VP   V8P      YP   YP Y88888P Y88888P 88      Y88888P 88   YD `8888Y'

*/

const getSVG = (name) => {
    return '<svg><use href="./icons.svg#'+name+'"></use></svg>';
}
