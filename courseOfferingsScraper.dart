import 'dart:io';
import 'dart:math';
import 'dart:convert';
import 'dart:collection';

void main(final List<String> args) async {
	final Directory dataDir = Directory(args[0]);
	final File offerings_outfile = File(args[1]);
	final File cross_listings_outfile = File(args[2]);
	final File prerequisites_outfile = File(args[3]);
	final File corequisites_outfile = File(args[4]);
	final File attributes_outfile = File(args[5]);
	final List<Directory> semesterDirs = (await dataDir.list().toList()).whereType<Directory>().toList();
	semesterDirs.sort((a,b) => int.parse(dirname(a)) - int.parse(dirname(b)));

	final HttpClient client = HttpClient();
	final Map<String,Map<String,List<String>>> courses_terms_offered = Map();
	final Map<String,List<String>> cross_listings = Map();
	final Map<String,dynamic> prerequisites = Map();
	final Map<String,List<String>> corequisites = Map();
	final Map<String,List<String>> attributes = Map();

	String term, term_real, courseCode, id, attr;
	dynamic semesterCourseData;
	dynamic semesterPrereqData;
	dynamic coursePrereqData;
	dynamic courseXlData;
	dynamic section;
	int credMin, credMax;
	Set<String> instructors;
	List<String> titleAndAttributes;
	int currentTerm = 0;
	courses_terms_offered["all_terms"] = {};
	for(Directory semester in semesterDirs) {
		term = dirname(semester);
		currentTerm = max(int.parse(term),currentTerm);
		semesterCourseData = await getJsonFromFile(File("${semester.path}/courses.json"));
		semesterPrereqData = await getJsonFromFile(File("${semester.path}/prerequisites.json"));
		if(semesterCourseData != null) {
			for(final courseCodeData in semesterCourseData) {
				for(final course in courseCodeData["courses"]) {
					id = course["id"];
					courseCode = courseCodeData["code"];

					courses_terms_offered[id] ??= Map();

					section = course["sections"][0];
					attributes[id] = section["attribute"].split(RegExp(" and |, "));
					titleAndAttributes = [course["title"],"",""];
					
					// I hate RCOS
					credMin = 2147483647;
					course["sections"].forEach((x) => credMin = min(credMin,x["credMin"].toInt()));
					credMax = 0;
					course["sections"].forEach((x) => credMax = max(credMax,x["credMax"].toInt()));
					
					titleAndAttributes[1] = (credMin == credMax) ? credMax.toString() : "${credMin.toString()}-${credMax.toString()}";
					if(attributes[id]?.contains("Communication Intensive") ?? false) {
						titleAndAttributes[2] += "[CI] ";
					}
					if(attributes[id]?.contains("Writing Intensive") ?? false) {
						titleAndAttributes[2] += "[WI] ";
					}
					if(attributes[id]?.contains("HASS Inquiry") ?? false) {
						titleAndAttributes[2] += "[HInq] ";
					}
					if(attributes[id]?.contains("Culminating Exp/Capstone") ?? false) {
						titleAndAttributes[2] += "[CulmExp] ";
					}
					if(attributes[id]?.contains("PDII Option for Engr Majors") ?? false) {
						titleAndAttributes[2] += "[PDII] ";
					}

					if(term.substring(4) == "05") {
						for(final sec in course["sections"]) {
							instructors = {};
							for(final timeslot in sec["timeslots"]) {
								var term_real = term;
								try {
									if(timeslot["dateEnd"].substring(0,2) != "08") {
										term_real += "02";
									} else if(timeslot["dateStart"].substring(0,2) != "05") {
										term_real += "03";
									}
								} catch(e) {
									// Do nothing, this happens when dateEnd or dateStart
									// are "-" or the empty string, instead of an actual date
								}
								if(timeslot["instructor"] != "TBA" && timeslot["instructor"] != "") {
									instructors.add(timeslot["instructor"]);
								}
								courses_terms_offered[id]?[term_real] = titleAndAttributes + instructors.toList();
							}
						}
					} else {
						instructors = {};
						for(final sec in course["sections"]) {
							for(final timeslot in sec["timeslots"]) {
								if(timeslot["instructor"] != "TBA" && timeslot["instructor"] != "") {
									instructors.add(timeslot["instructor"].split(", ").map((c) => c.replaceAll(exp.key,exp.value)).join(", "));
								}
							}
						}
						courses_terms_offered[id]?[term] = titleAndAttributes + instructors.toList();
					}

					coursePrereqData = semesterPrereqData[section["crn"].toString()];

					prerequisites[id] = coursePrereqData["prerequisites"] ?? [];

					if(isNotTopicsCourse(id)) {
						courseXlData = coursePrereqData["cross_list_courses"];
						cross_listings[id] = courseXlData
							?.whereType<String>()
							.where((elem) => (isNotTopicsCourse(elem) && (id != elem)))
							.toList() ?? [];
					}

					corequisites[id] = coursePrereqData["corequisites"]
						?.whereType<String>()
						.where((elem) => (isNotTopicsCourse(elem) && (id != elem)))
						.toList() ?? [];
				}
			}
			courses_terms_offered["all_terms"]?[term] = [];
			if(term.substring(4) == "05") {
				courses_terms_offered["all_terms"]?[term+"02"] = [];
				courses_terms_offered["all_terms"]?[term+"03"] = [];
			}
		}
	}
	courses_terms_offered["current_term"] = {currentTerm.toString():[]};

	cross_listings.removeWhere((k,v) => (v.isEmpty));
	prerequisites.removeWhere((k,v) => (v.isEmpty));
	corequisites.removeWhere((k,v) => (v.isEmpty));
	attributes.removeWhere((k,v) => (v[0] == ""));

	final JsonEncoder encoder = JsonEncoder.withIndent("  ");
	final String courses_terms_string = encoder.convert(courses_terms_offered);
	final String cross_listings_string = encoder.convert(cross_listings);
	final String prerequisites_string = encoder.convert(prerequisites);
	final String corequisites_string = encoder.convert(corequisites);
	final String attributes_string = encoder.convert(attributes);
	offerings_outfile.openWrite()..write(courses_terms_string)..close();
	cross_listings_outfile.openWrite()..write(cross_listings_string)..close();
	prerequisites_outfile.openWrite()..write(prerequisites_string)..close();
	corequisites_outfile.openWrite()..write(corequisites_string)..close();
	attributes_outfile.openWrite()..write(attributes_string)..close();
}

bool isNotTopicsCourse(id) {
	return (id[6] != "9" || (id[7] != "6" && id[7] != "7"));
}

String dirname(Directory dir) {
	return dir.path.split("/").last;
}

dynamic getJsonFromFile(File file) async {
	if(await file.exists()) {
		String string = await file.openRead().transform(utf8.decoder).join();
		final dynamic obj = json.decode(string);
		return obj;
	} else {
		return null;
	}
}
