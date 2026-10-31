import type { Reading } from "./readings";
export const testimonyReadings: Reading[] = [
  {
    id: "required",
    title: "The written security",
    section: "35.10",
    page: 107,
    greek: "ἐπὶ οἴνου κεραμίοις Μενδαίοις τρισχιλίοις",
    english: "On three thousand jars of Mendaean wine as security.",
    note: "A contractual specification, not an observation that 3,000 jars were actually loaded. The same section separately names 3,000 drachmas lent. Jars and drachmas have different units; their matching numeral does not make one a price for the other.",
    words: [
      ["κεραμίοις", "κεράμιον · jar", "Dative plural: the containers naming the outward security."],
      [
        "τρισχιλίοις",
        "τρισχίλιοι · three thousand",
        "Agrees with the jars. The loan sum elsewhere is δραχμὰς τρισχιλίας.",
      ],
    ],
  },
  {
    id: "speaker",
    title: "An upper bound in an accusation",
    section: "35.19",
    page: 110,
    greek: "οὗτοι δὲ ἀντὶ τῶν τρισχιλίων κεραμίων οὐδὲ πεντακόσια κεράμια εἰς τὸ πλοῖον ἐνέθεντο",
    english:
      "But these men, instead of the three thousand jars, did not put even five hundred jars into the ship.",
    note: "The speaker alleges a quantity below 500. Read literally as a whole-jar count, it allows 0 through 499. It does not alone establish 450. The lower bound zero comes from the modern nonnegative count model, not from a claim that the ship was empty.",
    words: [
      [
        "οὐδὲ",
        "οὐδέ · not even",
        "Together with 500, gives a strict upper bound in this selected reading.",
      ],
      ["πεντακόσια", "πεντακόσιοι · five hundred", "499 fits the stated bound; 500 does not."],
      [
        "ἐνέθεντο",
        "ἐντίθημι · put in / load",
        "Aorist middle indicative: the accusation concerns what they loaded, rather than what the contract said to load.",
      ],
    ],
  },
  {
    id: "erasikles",
    title: "A numbered report, attributed to Erasikles",
    section: "35.20",
    page: 110,
    greek:
      "καὶ εἰδέναι Ἀπολλόδωρον ἀγόμενον ἐν τῷ πλοίῳ οἴνου Μενδαίου κεράμια τετρακόσια πεντήκοντα, καὶ οὐ πλείω",
    english:
      "And that he knows Apollodoros was carrying in the ship four hundred and fifty jars of Mendaean wine, and no more.",
    note: "The transmitted deposition attributes this report to Erasikles, who says he was the ship’s helmsman. Its number is 450, reinforced by ‘and no more.’ Selecting it makes 450 the exact count for this conditional exercise; selection is not a judgment about the witness’s reliability or the document’s authenticity.",
    words: [
      [
        "μαρτυρεῖ",
        "μαρτυρέω · testifies",
        "The full section attributes the report to a named witness; the interface preserves that attribution.",
      ],
      ["τετρακόσια πεντήκοντα", "four hundred + fifty", "The two numerals total 450, not 400–450."],
      ["οὐ πλείω", "no more", "An explicit limit following the numbered quantity."],
    ],
  },
  {
    id: "hippias",
    title: "Hippias’s report crosses the printed page",
    section: "35.20",
    page: 111,
    greek: "οἴνου Μενδαίου κεράμια τετρακόσια πεντήκοντα, ἄλλο δὲ μηδὲν φορτίον",
    english: "Four hundred and fifty jars of Mendaean wine, and no other cargo.",
    note: "The preceding words name Hippias of Halikarnassos and the journey from Mende to Pontus. His deposition starts at the foot of p. 110 and continues on p. 111. The report agrees numerically with Erasikles. Two selected reports do not receive an invented probability or count as independent measurements in this exercise.",
    words: [
      [
        "φορτίον",
        "φορτίον · cargo",
        "‘No other cargo’ concerns cargo attributed to Apollodoros, within the surrounding sentence; it does not prove the whole ship carried nothing else.",
      ],
      [
        "μαρτυρία",
        "μαρτυρία · testimony",
        "The document heading appears between §§19 and 20. Read the continuation before assigning its words to a speaker.",
      ],
    ],
  },
];
export const evidenceScope =
  "A conditional reading of the literary text transmitted as [Demosthenes], Against Lacritus 35.10 and 35.18–22. Contract wording, the litigant’s allegation and attributed depositions are different kinds of statement. Selecting a report means taking its stated count at face value for this exercise. It does not authenticate an inserted document, establish actual cargo, rank witnesses, prove fraud, decide a lawsuit or reconstruct a verdict. No probability, damages or monetary deduction is inferred.";
