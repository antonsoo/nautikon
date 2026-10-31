export interface Reading {
  id: string;
  title: string;
  section: string;
  page: number;
  greek: string;
  english: string;
  note: string;
  words: [string, string, string][];
}
export const readings: Reading[] = [
  {
    id: "rate",
    title: "Which event changes the rate?",
    section: "35.10",
    page: 107,
    greek:
      "ἐπὶ διακοσίαις εἴκοσι πέντε τὰς χιλίας, ἐὰν δὲ μετʼ Ἀρκτοῦρον ἐκπλεύσωσιν ἐκ τοῦ Πόντου ἐφʼ Ἱερόν, ἐπὶ τριακοσίαις τὰς χιλίας",
    english:
      "At two hundred and twenty-five per thousand; but if they sail out of Pontus towards Hieron after Arcturus, at three hundred per thousand.",
    note: "The verb fixes the relevant event: departure from Pontus towards Hieron. Moving arrival at Athens does not by itself change this rate. These are voyage terms, not an annual rate. Arcturus is the named seasonal marker; the workshop adds illustrative relative days, without assigning a modern date.",
    words: [
      ["ἐκπλεύσωσιν", "ἐκπλέω · sail out", "Aorist subjunctive after ἐάν: the conditional event."],
      [
        "μετʼ Ἀρκτοῦρον",
        "μετά + accusative · after Arcturus",
        "The star’s rising supplies a seasonal boundary, not a duration for compounding.",
      ],
      [
        "τὰς χιλίας",
        "χίλιοι · the thousands",
        "In this rate expression: for every thousand drachmas lent.",
      ],
    ],
  },
  {
    id: "security",
    title: "One security, no second loan",
    section: "35.11",
    page: 108,
    greek:
      "ὑποτιθέασι δὲ ταῦτα, οὐκ ὀφείλοντες ἐπὶ τούτοις ἄλλῳ οὐδενὶ οὐδὲν ἀργύριον, οὐδʼ ἐπιδανείσονται. καὶ ἀπάξουσι τὰ χρήματα τὰ ἐκ τοῦ Πόντου ἀντιφορτισθέντα Ἀθήναζε πάλιν ἐν τῷ αὐτῷ πλοίῳ ἅπαντα.",
    english:
      "They pledge these goods, owing no money to anyone else on them, and they will not borrow further on them. They will bring all the goods loaded in exchange in Pontus back to Athens, in the same ship.",
    note: "§10 names 3,000 jars of Mendaean wine as outward security. §11 then requires all the return cargo and the same vessel. The jar count is not the cargo’s price, the loan principal or a known sale value. The diagram follows the change of cargo without inventing a return quantity or commodity.",
    words: [
      [
        "ὑποτιθέασι",
        "ὑποτίθημι · pledge as security",
        "A pledge is distinct from a cash repayment.",
      ],
      [
        "οὐδʼ ἐπιδανείσονται",
        "ἐπιδανείζομαι · borrow further",
        "The negative extends the restriction to later borrowing.",
      ],
      [
        "ἀντιφορτισθέντα",
        "ἀντιφορτίζομαι · load in return",
        "The return goods replace the outward cargo in the voyage account.",
      ],
      [
        "ἐν τῷ αὐτῷ πλοίῳ",
        "αὐτός · the same",
        "A requirement of vessel identity, not just arrival anywhere.",
      ],
    ],
  },
  {
    id: "arrival",
    title: "Safe arrival starts another interval",
    section: "35.11",
    page: 108,
    greek:
      "σωθέντων δὲ τῶν χρημάτων Ἀθήναζε, ἀποδώσουσιν οἱ δανεισάμενοι τοῖς δανείσασι τὸ γιγνόμενον ἀργύριον κατὰ τὴν συγγραφὴν ἡμερῶν εἴκοσιν, ἀφʼ ἧς ἂν ἔλθωσιν Ἀθήναζε",
    english:
      "When the goods have reached Athens safely, the borrowers will repay the lenders the money due under the agreement within twenty days from their arrival at Athens.",
    note: "Departure chooses the rate; safe arrival begins the repayment interval. The workshop uses elapsed whole days: 20 remains inside the displayed interval, 21 is beyond it. This is an explicit teaching convention, not a claim about Athenian calendar counting or a historical due date.",
    words: [
      [
        "σωθέντων",
        "σῴζω · bring safely through",
        "A genitive absolute with τῶν χρημάτων: safe arrival is a condition.",
      ],
      [
        "οἱ δανεισάμενοι",
        "δανείζομαι · borrow",
        "The middle form names the borrowers; τοῖς δανείσασι names the lenders.",
      ],
      [
        "ἡμερῶν εἴκοσιν",
        "εἴκοσι · twenty",
        "A repayment interval from arrival, not the loan’s annual duration.",
      ],
    ],
  },
  {
    id: "loss",
    title: "The exception has a condition",
    section: "35.11",
    page: 108,
    greek:
      "ἐντελὲς πλὴν ἐκβολῆς, ἣν ἂν οἱ σύμπλοι ψηφισάμενοι κοινῇ ἐκβάλωνται, καὶ ἄν τι πολεμίοις ἀποτείσωσιν· τῶν δʼ ἄλλων ἁπάντων ἐντελές.",
    english:
      "In full, except for jettison which those sailing together vote in common to throw out, and whatever they pay to enemies; in full as regards all other losses.",
    note: "Calling a loss ‘jettison’ is not enough: the shared decision belongs to the exception. The workshop takes a learner-entered drachma amount as the assumed allowable deduction and subtracts it from principal plus voyage interest. The clause supplies the categories, not a valuation method. Only one selected loss event is modeled.",
    words: [
      [
        "πλὴν ἐκβολῆς",
        "πλήν · except; ἐκβολή · throwing out",
        "The exception is narrower than every loss at sea.",
      ],
      [
        "ψηφισάμενοι κοινῇ",
        "ψηφίζομαι · vote; κοινῇ · jointly",
        "The joint decision is part of the clause’s description.",
      ],
      [
        "πολεμίοις",
        "πολέμιος · enemy",
        "The recipient category of the separate payment exception.",
      ],
    ],
  },
  {
    id: "default",
    title: "A smaller cargo does not cap the claim",
    section: "35.11–12",
    page: 108,
    greek:
      "καὶ παρέξουσι τοῖς δανείσασι τὴν ὑποθήκην ἀνέπαφον κρατεῖν, ἕως ἂν ἀποδῶσι τὸ γιγνόμενον ἀργύριον κατὰ τὴν συγγραφήν. ἐὰν δὲ μὴ ἀποδῶσιν ἐν τῷ συγκειμένῳ χρόνῳ, τὰ ὑποκείμενα τοῖς δανείσασιν ἐξέστω ὑποθεῖναι καὶ ἀποδόσθαι τῆς ὑπαρχούσης τιμῆς· καὶ ἐάν τι ἐλλείπῃ τοῦ ἀργυρίου",
    english:
      "They will let the lenders hold the security untouched until they repay the money due under the agreement. If they do not repay within the agreed time, the lenders may pledge or sell the security at the available price; and if any of the money is lacking…",
    note: "The rest of §12 allows collection from Artemon and Apollodorus and all their property on land and sea. The model computes the shortfall; it does not assume that other property exists, resolve priority against another creditor, or guarantee recovery. No rule allocating excess sale proceeds is derived from this excerpt.",
    words: [
      [
        "ὑποθήκην",
        "ὑποθήκη · security / pledge",
        "The pledged goods are not a ceiling on the ordinary default claim.",
      ],
      [
        "ἐλλείπῃ",
        "ἐλλείπω · fall short",
        "The shortfall survives a sale for less than the modeled debt.",
      ],
      [
        "ἐγγείων καὶ ναυτικῶν",
        "ἔγγειος / ναυτικός · on land / at sea",
        "These words occur later in §12 and extend the described collection to other property.",
      ],
    ],
  },
  {
    id: "exception",
    title: "Two branches the ordinary account cannot settle",
    section: "35.13",
    page: 108,
    greek:
      "τοὺς τόκους ἀποδόντων τοὺς πέρυσι γραφέντας εἰς τὴν συγγραφήν. ἐὰν δέ τι ἡ ναῦς πάθῃ ἀνήκεστον ἐν ᾗ ἂν πλέῃ τὰ χρήματα, σωτηρία δʼ ἔσται τῶν ὑποκειμένων, τὰ περιγενόμενα κοινὰ ἔστω τοῖς δανείσασιν.",
    english:
      "Let them pay the interest written into the agreement last year. If the ship carrying the goods suffers irreparable harm, but the security survives, let what remains belong jointly to the lenders.",
    note: "The first sentence concludes a conditional Hellespont provision: no entry into Pontus, a ten-day wait associated with Sirius, unloading where Athenians face no reprisals, and return to Athens. ‘Last year’ needs interpretation; Murray supplies a legal-year explanation in a note. We retain that reference without resolving it. The second sentence gives surviving security to the lenders jointly; it does not supply the ordinary safe-return deficiency calculation.",
    words: [
      [
        "πέρυσι",
        "πέρυσι · last year",
        "A cross-reference whose numerical meaning this model withholds.",
      ],
      [
        "ἀνήκεστον",
        "ἀνήκεστος · irreparable",
        "The ship’s condition is distinguished from survival of the pledged goods.",
      ],
      [
        "κοινὰ",
        "κοινός · shared / common",
        "Here the surviving security is common to the lenders.",
      ],
    ],
  },
];
export const scope =
  "A modern reading exercise in selected clauses of the agreement transmitted in [Demosthenes], Against Lacritus 35.10–13. This is a literary transmission in a partisan forensic speech, not an excavated original contract, a proven voyage record, a verdict, or a complete statement of Athenian law. The attribution and document’s authenticity are not settled here. The altered voyages, relative days, loss amounts and sale proceeds are invented teaching inputs. English translations and diagrams are new.";
