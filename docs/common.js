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
            window.location.href = "./search.html?search="+elem.value.replaceAll(" ", "+");
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
        globalThis.searchableCatalog = makeSearchableCatalog(catalog);
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



const iconSVGs = {
    "message": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M208 352c114.9 0 208-78.8 208-176S322.9 0 208 0S0 78.8 0 176c0 38.6 14.7 74.3 39.6 103.4c-3.5 9.4-8.7 17.7-14.2 24.7c-4.8 6.2-9.7 11-13.3 14.3c-1.8 1.6-3.3 2.9-4.3 3.7c-.5 .4-.9 .7-1.1 .8l-.2 .2 0 0 0 0C1 327.2-1.4 334.4 .8 340.9S9.1 352 16 352c21.8 0 43.8-5.6 62.1-12.5c9.2-3.5 17.8-7.4 25.3-11.4C134.1 343.3 169.8 352 208 352zM448 176c0 112.3-99.1 196.9-216.5 207C255.8 457.4 336.4 512 432 512c38.2 0 73.9-8.7 104.7-23.9c7.5 4 16 7.9 25.2 11.4c18.3 6.9 40.3 12.5 62.1 12.5c6.9 0 13.1-4.5 15.2-11.1c2.1-6.6-.2-13.8-5.8-17.9l0 0 0 0-.2-.2c-.2-.2-.6-.4-1.1-.8c-1-.8-2.5-2-4.3-3.7c-3.6-3.3-8.5-8.1-13.3-14.3c-5.5-7-10.7-15.4-14.2-24.7c24.9-29 39.6-64.7 39.6-103.4c0-92.8-84.9-168.9-192.6-175.5c.4 5.1 .6 10.3 .6 15.5z"/></svg>`,
    "pencil": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"/></svg>`,
    "magnifying": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352c79.5 0 144-64.5 144-144s-64.5-144-144-144S64 128.5 64 208s64.5 144 144 144z"/></svg>`,
    "briefcase": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M184 48H328c4.4 0 8 3.6 8 8V96H176V56c0-4.4 3.6-8 8-8zm-56 8V96H64C28.7 96 0 124.7 0 160v96H192 320 512V160c0-35.3-28.7-64-64-64H384V56c0-30.9-25.1-56-56-56H184c-30.9 0-56 25.1-56 56zM512 288H320v32c0 17.7-14.3 32-32 32H224c-17.7 0-32-14.3-32-32V288H0V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V288z"/></svg>`,
    "laptop": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M128 32C92.7 32 64 60.7 64 96V352h64V96H512V352h64V96c0-35.3-28.7-64-64-64H128zM19.2 384C8.6 384 0 392.6 0 403.2C0 445.6 34.4 480 76.8 480H563.2c42.4 0 76.8-34.4 76.8-76.8c0-10.6-8.6-19.2-19.2-19.2H19.2z"/></svg>`,
    "house-laptop": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M218.3 8.5c12.3-11.3 31.2-11.3 43.4 0l208 192c6.7 6.2 10.3 14.8 10.3 23.5H336c-19.1 0-36.3 8.4-48 21.7V208c0-8.8-7.2-16-16-16H208c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16h64V416H112c-26.5 0-48-21.5-48-48V256H32c-13.2 0-25-8.1-29.8-20.3s-1.6-26.2 8.1-35.2l208-192zM352 304V448H544V304H352zm-48-16c0-17.7 14.3-32 32-32H560c17.7 0 32 14.3 32 32V448h32c8.8 0 16 7.2 16 16c0 26.5-21.5 48-48 48H544 352 304c-26.5 0-48-21.5-48-48c0-8.8 7.2-16 16-16h32V288z"/></svg>`,
    "skull": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M416 398.9c58.5-41.1 96-104.1 96-174.9C512 100.3 397.4 0 256 0S0 100.3 0 224c0 70.7 37.5 133.8 96 174.9c0 .4 0 .7 0 1.1v64c0 26.5 21.5 48 48 48h48V464c0-8.8 7.2-16 16-16s16 7.2 16 16v48h64V464c0-8.8 7.2-16 16-16s16 7.2 16 16v48h48c26.5 0 48-21.5 48-48V400c0-.4 0-.7 0-1.1zM224 256c0 35.3-28.7 64-64 64s-64-28.7-64-64s28.7-64 64-64s64 28.7 64 64zm128 64c-35.3 0-64-28.7-64-64s28.7-64 64-64s64 28.7 64 64s-28.7 64-64 64z"/></svg>`,
    "amogus": `<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 261.1819 331.5457">
            <path d="M354.8419,155.6564H344.3814a88.2754,88.2754,0,0,0-85.1231-64.9293h0a88.2421,88.2421,0,0,0-88.242,88.2422v7.2568h0a45.1069,45.1069,0,0,0-45.1069,45.1069v15.761a45.1069,45.1069,0,0,0,45.1069,45.107h0v.2909q0,3.5648.2813,7.06a26.32,26.32,0,0,0-.2813,3.823v91.78a26.1187,26.1187,0,0,0,26.1187,26.1188h0a26.1187,26.1187,0,0,0,26.1187-26.1188v-22.08a87.9243,87.9243,0,0,0,36.0046,7.6593h0a87.924,87.924,0,0,0,36.0046-7.6593v22.08a26.1188,26.1188,0,0,0,26.1188,26.1188h0A26.1187,26.1187,0,0,0,347.5,395.1541v-91.78a26.32,26.32,0,0,0-.2813-3.823q.2766-3.4938.2813-7.06V218.1544h7.3415a31.2489,31.2489,0,0,0,31.249-31.249h0A31.249,31.249,0,0,0,354.8419,155.6564Zm23.8884,31.249a28.17,28.17,0,0,1-28.17,28.17H272.2349a28.17,28.17,0,0,1-28.17-28.17h0a28.17,28.17,0,0,1,28.17-28.17h78.3259a28.17,28.17,0,0,1,28.17,28.17Z" transform="translate(-125.4091 -90.2271)" style="fill: #231f20;stroke: #fff;stroke-miterlimit: 10"/>
        </svg>
        `,
    "cubes": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M290.8 48.6l78.4 29.7L288 109.5 206.8 78.3l78.4-29.7c1.8-.7 3.8-.7 5.7 0zM136 92.5V204.7c-1.3 .4-2.6 .8-3.9 1.3l-96 36.4C14.4 250.6 0 271.5 0 294.7V413.9c0 22.2 13.1 42.3 33.5 51.3l96 42.2c14.4 6.3 30.7 6.3 45.1 0L288 457.5l113.5 49.9c14.4 6.3 30.7 6.3 45.1 0l96-42.2c20.3-8.9 33.5-29.1 33.5-51.3V294.7c0-23.3-14.4-44.1-36.1-52.4l-96-36.4c-1.3-.5-2.6-.9-3.9-1.3V92.5c0-23.3-14.4-44.1-36.1-52.4l-96-36.4c-12.8-4.8-26.9-4.8-39.7 0l-96 36.4C150.4 48.4 136 69.3 136 92.5zM392 210.6l-82.4 31.2V152.6L392 121v89.6zM154.8 250.9l78.4 29.7L152 311.7 70.8 280.6l78.4-29.7c1.8-.7 3.8-.7 5.7 0zm18.8 204.4V354.8L256 323.2v95.9l-82.4 36.2zM421.2 250.9c1.8-.7 3.8-.7 5.7 0l78.4 29.7L424 311.7l-81.2-31.1 78.4-29.7zM523.2 421.2l-77.6 34.1V354.8L528 323.2v90.7c0 3.2-1.9 6-4.8 7.3z"/></svg>`,
    
}
