const vfDB = {
  "groups": [
    {
      "id": "VF-300",
      "title": "Breach of Contract",
      "category": "contract",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] and [ name of defendant ] enter into a contract?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] do all, or substantially all, of the significant things that the contract required [him/her/ nonbinary pronoun /it] to do?",
          "fields": [
            "name of plaintiff"
          ],
          "optional": true,
          "if_yes": "q3",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] excused from having to do all, or substantially all, of the significant things that the contract required [him/her/ nonbinary pronoun /it] to do?",
          "fields": [
            "name of plaintiff"
          ],
          "optional": true,
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Did all the conditions that were required for [ name of defendant ]’s performance occur?",
          "fields": [
            "name of defendant"
          ],
          "optional": true,
          "if_yes": "q5",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Were the required conditions that did not occur [excused/waived]?",
          "fields": [],
          "optional": true,
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no_multi",
          "text": "Did [ name of defendant ] fail to do something that the contract required [him/her/ nonbinary pronoun /it] to do? [Did [ name of defendant ] do something that the contract prohibited [him/her/ nonbinary pronoun /it] from doing?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q7",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q7",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] harmed by [ name of defendant ]’s breach of contract?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q8"
        },
        {
          "id": "q8",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-301",
      "title": "Breach of Contract—Affirmative Defense—Unilateral Mistake of Fact",
      "category": "contract",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [ name of defendant ] mistaken about [ insert description of mistake ]?",
          "fields": [
            "name of defendant",
            "insert description of mistake"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] know that [ name of defendant ] was mistaken and use that mistake to take advantage of [him/her/ nonbinary pronoun /it]?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s mistake caused by [his/her/ nonbinary pronoun /its] excessive carelessness?",
          "fields": [
            "name of defendant"
          ],
          "if_no": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Would [ name of defendant ] have agreed to enter into the contract if [he/she/ nonbinary pronoun /it] had known about the mistake?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "sign",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        }
      ]
    },
    {
      "id": "VF-302",
      "title": "Breach of Contract—Affirmative Defense—Duress",
      "category": "contract",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] use a wrongful act or wrongful threat to pressure [ name of defendant ] into consenting to the contract?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [ name of defendant ] so afraid or intimidated by the wrongful act or wrongful threat that [he/she/ nonbinary pronoun ] did not have the free will to refuse to consent to the contract?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Would [ name of defendant ] have consented to the contract without the wrongful act or wrongful threat?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "sign",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        }
      ]
    },
    {
      "id": "VF-303",
      "title": "Breach of Contract—Contract Formation at Issue",
      "category": "contract",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Were the contract terms clear enough so that the parties could understand what each was required to do?",
          "fields": [],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did the parties agree to give each other something of value?",
          "fields": [],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Did the parties agree to the terms of the contract?",
          "fields": [],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] do all, or substantially all, of the significant things that the contract required [him/her/ nonbinary pronoun /it] to do?",
          "fields": [
            "name of plaintiff"
          ],
          "optional": true,
          "if_yes": "q5",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] excused from having to do all, or substantially all, of the significant things that the contract required [him/her/ nonbinary pronoun /it] to do?",
          "fields": [
            "name of plaintiff"
          ],
          "optional": true,
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no",
          "text": "Did all the conditions that were required for [ name of defendant ]’s performance occur?",
          "fields": [
            "name of defendant"
          ],
          "optional": true,
          "if_yes": "q7",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q7",
          "type": "yes_no",
          "text": "Were the required conditions that did not occur [excused/waived]?",
          "fields": [],
          "optional": true,
          "if_yes": "q8"
        },
        {
          "id": "q8",
          "type": "yes_no_multi",
          "text": "Did [ name of defendant ] fail to do something that the contract required [him/her/ nonbinary pronoun /it] to do? [Did [ name of defendant ] do something that the contract prohibited [him/her/ nonbinary pronoun /it] from doing?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q9",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q9",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] harmed by [ name of defendant ]’s breach of contract?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q10"
        },
        {
          "id": "q10",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "",
              "label": "$"
            },
            {
              "id": "",
              "label": "$"
            },
            {
              "id": "total_contracts_vf303",
              "label": "TOTAL $CONTRACTS VF-303"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-304",
      "title": "Breach of Implied Covenant of Good Faith and Fair Dealing",
      "category": "contract",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] and [ name of defendant ] enter into a contract?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] do all, or substantially all, of the significant things that the contract required [him/her/ nonbinary pronoun /it] to do?",
          "fields": [
            "name of plaintiff"
          ],
          "optional": true,
          "if_yes": "q3",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] excused from having to do all, or substantially all, of the significant things that the contract required [him/her/ nonbinary pronoun /it] to do?",
          "fields": [
            "name of plaintiff"
          ],
          "optional": true,
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Did all the conditions that were required for [ name of defendant ]’s performance occur?",
          "fields": [
            "name of defendant"
          ],
          "optional": true,
          "if_yes": "q5",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Were the required conditions that did not occur [excused/waived]?",
          "fields": [],
          "optional": true,
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no",
          "text": "Did [ name of defendant ] [specify conduct that plaintiff claims prevented plaintiff from receiving the benefits under the contract ]?",
          "fields": [
            "name of defendant",
            "specify conduct that plaintiff claims prevented plaintiff from receiving the benefits under the contract"
          ],
          "if_yes": "q7"
        },
        {
          "id": "q7",
          "type": "yes_no",
          "text": "In [ insert specified conduct from question 6 ], did [ name of defendant ] fail to act fairly and in good faith?",
          "fields": [
            "insert specified conduct from question 6",
            "name of defendant"
          ],
          "if_yes": "q8"
        },
        {
          "id": "q8",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] harmed by [ name of defendant ]’s conduct?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q9"
        },
        {
          "id": "q9",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-400",
      "title": "Negligence—Single Defendant",
      "category": "negligence",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [ name of defendant ] negligent?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s negligence a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-401",
      "title": "Negligence—Single Defendant—Plaintiff’s Negligence at Issue—Fault of Others Not at Issue",
      "category": "negligence",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [ name of defendant ] negligent?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s negligence a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s total damages? Do not reduce the damages based on the fault, if any, of [ name of plaintiff ].",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] negligent?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ]’s negligence a substantial factor in causing [his/her/ nonbinary pronoun ] harm?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "percentage",
          "text": "What percentage of responsibility for [ name of plaintiff ]’s harm do you assign to:",
          "fields": [
            "name of plaintiff"
          ],
          "parties": [
            {
              "id": "p_name_of_defendant",
              "label": "[Name of defendant]"
            },
            {
              "id": "p_name_of_plaintiff",
              "label": "[[Name of plaintiff]"
            }
          ],
          "must_total": 100,
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-402",
      "title": "Negligence—Fault of Plaintiff and Others at Issue",
      "category": "negligence",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no_multi",
          "text": "Was [ name of first defendant ] negligent? Was [ name of second defendant ] negligent?",
          "fields": [
            "name of first defendant",
            "name of second defendant"
          ],
          "if_yes": "q2",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q2",
          "type": "yes_no_multi",
          "text": "For each defendant that received a “yes” answer in question 1, answer the following: Was [ name of first defendant ]’s negligence a substantial factor in causing harm to [ name of plaintiff ]? Was [ name of second defendant ]’s negligence a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of first defendant",
            "name of plaintiff",
            "name of second defendant"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s total damages? Do not reduce the damages based on the fault, if any, of [ name of plaintiff ] or others.",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] negligent?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ]’s negligence a substantial factor in causing [his/her/ nonbinary pronoun ] harm?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no_multi",
          "text": "Was [ name/description of first nonparty ] negligent? Was [ name/description of second nonparty ] negligent?",
          "fields": [],
          "if_yes": "q8"
        },
        {
          "id": "q7",
          "type": "yes_no_multi",
          "text": "For each person who received a “yes” answer in question 6, answer the following: Was [ name/description of first nonparty ]’s negligence a substantial factor in causing harm to [ name of plaintiff ]? Was [ name/description of second nonparty ]’s negligence a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q8"
        },
        {
          "id": "q8",
          "type": "percentage",
          "text": "What percentage of responsibility for [ name of plaintiff ]’s harm do you assign to the following? Insert a percentage for only those who received “yes” answers in questions 2, 5, or 7:",
          "fields": [
            "name of plaintiff"
          ],
          "parties": [
            {
              "id": "p_name_of_first_defendant",
              "label": "[Name of first defendant]"
            },
            {
              "id": "p_name_of_second_defendant",
              "label": "[Name of second defendant]"
            },
            {
              "id": "p_name_of_plaintiff",
              "label": "[Name of plaintiff]"
            },
            {
              "id": "p_namedescription_of_first_non_party",
              "label": "[Name/description of first non- party]"
            },
            {
              "id": "p_namedescription_of_second_nonparty",
              "label": "[Name/description of second nonparty]"
            }
          ],
          "must_total": 100,
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-403",
      "title": "Primary Assumption of Risk—Liability of Coparticipant",
      "category": "negligence",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of defendant ] either intentionally injure [ name of plaintiff ] or act so recklessly that [his/her/ nonbinary pronoun ] conduct was entirely outside the range of ordinary activity involved in [ specify sport or activity, e.g., touch football ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff",
            "specify sport or activity, e.g., touch football"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s conduct a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-404",
      "title": "Primary Assumption of Risk—Liability of Instructors, Trainers, or Coaches",
      "category": "negligence",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [ name of defendant ] [name of plaintiff ]’s [coach/trainer/instructor]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no_multi",
          "text": "Did [ name of defendant ] intend to cause [ name of plaintiff ] injury or act recklessly in that [his/her/ nonbinary pronoun ] conduct was entirely outside the range of ordinary activity involved in teaching or coaching [ sport or other activity ] in which [ name of plaintiff ] was participating? [Did [ name of defendant ]’s failure to use reasonable care increase the risks to [ name of plaintiff ] over and above those inherent in [sport or other activity ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q3",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s conduct a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-405",
      "title": "Primary Assumption of Risk—Liability of Facilities Owners and Operators and Event Sponsors",
      "category": "negligence",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [ name of defendant ] the [owner/operator/sponsor/ other ] of [e.g., a ski resort ]?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of defendant ] do something or fail to do something that unreasonably increased the risks to [ name of plaintiff ] over and above those inherent in [ sport or other recreational activity, e.g., snowboarding ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was [name of defendant]’s conduct a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-406",
      "title": "Negligence—Providing Alcoholic Beverages to Obviously Intoxicated Minor",
      "category": "negligence",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [ name of defendant ] [required to be] licensed to sell alcoholic beverages?] [Was [ name of defendant ] authorized by the federal government to sell alcoholic beverages on a military base or other federal enclave?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no_multi",
          "text": "Did [ name of defendant ] [sell/ give] alcoholic beverages to [ name of alleged minor ]? [Did [ name of defendant ] cause alcoholic beverages to be [sold/ given away] to [ name of alleged minor ]?",
          "fields": [
            "name of defendant",
            "name of alleged minor"
          ],
          "if_yes": "q3",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was [ name of alleged minor ] less than 21 years old at the time?",
          "fields": [
            "name of alleged minor"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "When [ name of defendant ] provided the alcoholic beverages, did",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Did [ name of alleged minor ] later harm [ name of plaintiff ]?",
          "fields": [
            "name of alleged minor",
            "name of plaintiff"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s [selling/giving] alcoholic beverages to",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q7"
        },
        {
          "id": "q7",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-407",
      "title": "Strict Liability—Ultrahazardous Activities",
      "category": "negligence",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [ name of defendant ] engaged in [ insert ultrahazardous activity ]?",
          "fields": [
            "name of defendant",
            "insert ultrahazardous activity"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] harmed?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ]’s harm the kind of harm that would be anticipated as a result of the risk created by [ insert ultrahazardous activity ]?",
          "fields": [
            "name of plaintiff",
            "insert ultrahazardous activity"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s [insert ultrahazardous activity ] a substantial factor in causing [ name of plaintiff ]’s harm?",
          "fields": [
            "name of defendant",
            "insert ultrahazardous activity",
            "name of plaintiff"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-408",
      "title": "Strict Liability for Domestic Animal With Dangerous Propensities",
      "category": "negligence",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of defendant ] own, keep, or control a [ insert type of animal ]?",
          "fields": [
            "name of defendant",
            "insert type of animal"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did the [ insert type of animal ] have an unusually dangerous nature or tendency?",
          "fields": [
            "insert type of animal"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Did [ name of defendant ] know, or should [he/she/ nonbinary pronoun ] have known, that the [ insert type of animal ] had this nature or tendency?",
          "fields": [
            "name of defendant",
            "insert type of animal"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Was the [ insert type of animal ]’s unusually dangerous nature or tendency a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "insert type of animal",
            "name of plaintiff"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-409",
      "title": "Dog Bite Statute (Civ. Code, § 3342)",
      "category": "negligence",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of defendant ]’s dog bite [ name of plaintiff ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] in a public place or lawfully on private property when [he/she/ nonbinary pronoun ] was bitten?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was the dog a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "damages",
          "text": "What are the damages, if any, that [ name of plaintiff ] suffered as a result of the dog bite?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-410",
      "title": "Statute of Limitations—Delayed Discovery—Reasonable Investigation Would Not Have Disclosed Pertinent Facts",
      "category": "negligence",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ]’s claimed harm occur before [ insert date from applicable statute of limitations ]?",
          "fields": [
            "name of plaintiff",
            "insert date from applicable statute of limitations"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no_multi",
          "text": "Before [ insert date from applicable statute of limitations ], did [ name of plaintiff ] discover, or know of facts that would have caused a reasonable person to suspect, that [he/she/ nonbinary pronoun /it] had suffered harm that was caused by someone’s wrongful conduct? Would a reasonable and diligent investigation have disclosed before [ insert date from applicable statute of limitations ] that [specify factual basis for cause of action ] contributed to [ name of plaintiff ]’s harm?",
          "fields": [
            "insert date from applicable statute of limitations",
            "name of plaintiff",
            "specify factual basis for cause of action"
          ],
          "if_yes": "sign",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        }
      ]
    },
    {
      "id": "VF-411",
      "title": "Parental Liability (Nonstatutory)",
      "category": "negligence",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [ name of defendant ] aware of habits or tendencies of [ name of minor ] that created an unreasonable risk of harm to other persons and led to [ name of plaintiff ]’s harm?",
          "fields": [
            "name of defendant",
            "name of minor",
            "name of plaintiff"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of defendant ] have the opportunity and ability to control the conduct of [ name of minor ]?",
          "fields": [
            "name of defendant",
            "name of minor"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was [ name of defendant ] negligent because [he/she/ nonbinary pronoun ] failed to exercise reasonable care to prevent [ name of minor ]’s conduct?",
          "fields": [
            "name of defendant",
            "name of minor"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s negligence a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-500",
      "title": "Medical Negligence",
      "category": "medical_negligence",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [ name of defendant ] negligent in the diagnosis or treatment of",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s negligence a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-501",
      "title": "Medical Negligence—Informed Consent—Affirmative Defense—Plaintiff Would Have Consented Even If Informed",
      "category": "medical_negligence",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of defendant ] perform a [ insert medical procedure ] on",
          "fields": [
            "name of defendant",
            "insert medical procedure"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] give [his/her/ nonbinary pronoun ] informed consent for the [ insert medical procedure ]?",
          "fields": [
            "name of plaintiff",
            "insert medical procedure"
          ],
          "if_no": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Would a reasonable person in [ name of plaintiff ]’s position have refused the [ insert medical procedure ] if that person had been adequately informed of the possible results and risks of [and alternatives to] the [ insert medical procedure ]?",
          "fields": [
            "name of plaintiff",
            "insert medical procedure"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Would [ name of plaintiff ] have consented to the [ insert medical procedure ] even if [he/she/ nonbinary pronoun ] had been given adequate information about the risks of the [ insert medical procedure ]?",
          "fields": [
            "name of plaintiff",
            "insert medical procedure"
          ],
          "if_no": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] harmed as a consequence of a result or risk that [ name of defendant ] should have explained before the [insert medical procedure ] was performed?",
          "fields": [
            "name of plaintiff",
            "name of defendant",
            "insert medical procedure"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-502",
      "title": "Medical Negligence—Informed Consent—Affirmative Defense—Emergency",
      "category": "medical_negligence",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of defendant ] perform a [ insert medical procedure ] on",
          "fields": [
            "name of defendant",
            "insert medical procedure"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] give [his/her/ nonbinary pronoun ] informed consent to the [ insert medical procedure ]?",
          "fields": [
            "name of plaintiff",
            "insert medical procedure"
          ],
          "if_no": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Would a reasonable person in [ name of plaintiff ]’s position have refused the [ insert medical procedure ] if that person had been fully informed of the possible results and risks of [and alternatives to] the [ insert medical procedure ]?",
          "fields": [
            "name of plaintiff",
            "insert medical procedure"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] harmed as a consequence of a result or risk that [ name of defendant ] should have explained before the [insert medical procedure ] was performed?",
          "fields": [
            "name of plaintiff",
            "name of defendant",
            "insert medical procedure"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Did [ name of defendant ] reasonably believe the [ insert medical procedure ] had to be done immediately in order to preserve the life or health of [ name of plaintiff ]?",
          "fields": [
            "name of defendant",
            "insert medical procedure",
            "name of plaintiff"
          ],
          "if_no": "q7"
        },
        {
          "id": "q6",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] unconscious?",
          "fields": [
            "name of plaintiff"
          ],
          "if_no": "q7"
        },
        {
          "id": "q7",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-700",
      "title": "Motor Vehicle Owner Liability—Permissive Use of Vehicle",
      "category": "motor_vehicle",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [ name of defendant ] an owner of the vehicle at the time of the injury to [ name of plaintiff ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of defendant ], by words or conduct, give permission to",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "sign",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        }
      ]
    },
    {
      "id": "VF-701",
      "title": "Motor Vehicle Owner Liability—Permissive Use of Vehicle—Affirmative Defense—Use Beyond Scope of Permission",
      "category": "motor_vehicle",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [ name of defendant ] an owner of the vehicle at the time of the injury to [ name of plaintiff ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of defendant ], by words or conduct, give permission to",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s permission to use the vehicle given for a limited time, place, or purpose?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Did [ name of driver ]’s use of the vehicle substantially violate the limitations as to time, place, or purpose?",
          "fields": [
            "name of driver"
          ],
          "if_yes": "sign",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        }
      ]
    },
    {
      "id": "VF-702",
      "title": "Adult’s Liability for Minor’s Permissive Use of Motor Vehicle",
      "category": "motor_vehicle",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [ name of minor ] negligent in operating the vehicle?",
          "fields": [
            "name of minor"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [ name of minor ]’s negligence a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of minor",
            "name of plaintiff"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Did [ name of defendant ], by words or conduct, give [ name of minor ] permission to use the vehicle?",
          "fields": [
            "name of defendant",
            "name of minor"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-703",
      "title": "Liability of Cosigner of Minor’s Application for Driver’s License",
      "category": "motor_vehicle",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [ name of minor ] negligent in operating the vehicle?",
          "fields": [
            "name of minor"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [ name of minor ]’s negligence a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of minor",
            "name of plaintiff"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Did [ name of defendant ] sign [ name of minor ]’s application for a driver’s license?",
          "fields": [
            "name of defendant",
            "name of minor"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "At the time of the collision, had [ name of minor ]’s driver’s license been cancelled or revoked by the Department of Motor Vehicles?",
          "fields": [
            "name of minor"
          ],
          "if_no": "q5"
        },
        {
          "id": "q5",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-704",
      "title": "Negligent Entrustment of Motor Vehicle",
      "category": "motor_vehicle",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [ name of driver ] negligent in operating the vehicle?",
          "fields": [
            "name of driver"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of defendant ] own the vehicle operated by [ name of driver ] or did [ name of defendant ] have possession of the vehicle operated by [ name of driver ] with the owner’s permission?",
          "fields": [
            "name of defendant",
            "name of driver"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Did [ name of defendant ] know, or should [he/she/ nonbinary pronoun ] have known, that [ name of driver ] was incompetent or unfit to drive?",
          "fields": [
            "name of defendant",
            "name of driver"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Did [ name of defendant ] permit [ name of driver ] to drive the vehicle?",
          "fields": [
            "name of defendant",
            "name of driver"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Was [ name of driver ]’s incompetence or unfitness to drive a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of driver",
            "name of plaintiff"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-1000",
      "title": "Premises Liability—Comparative Negligence of Others Not at Issue",
      "category": "premises_liability",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of defendant ] [own/lease/occupy/control] the property?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [ name of defendant ] negligent in the use or maintenance of the property?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s negligence a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-1001",
      "title": "Premises Liability—Affirmative Defense—Recreation Immunity—Exceptions",
      "category": "premises_liability",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of defendant ] [own/lease/occupy/control] the property?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [ name of defendant ] negligent in the [use/maintenance] of the property?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s negligence a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Did [ name of plaintiff/name of person causing injury ] enter on or use [ name of defendant ]’s property for a recreational purpose?",
          "fields": [
            "name of plaintiff/name of person causing injury",
            "name of defendant"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Did [ name of defendant ] willfully or maliciously fail to protect others from or warn others about a dangerous [condition/use/ structure/activity] on the property?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-1002",
      "title": "Premises Liability—Comparative Fault of Plaintiff at Issue",
      "category": "premises_liability",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of defendant ] [own/lease/occupy/control] the property?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [ name of defendant ] negligent in the use or maintenance of the property?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s negligence a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] also negligent?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ]’s negligence a substantial factor in causing [his/her/ nonbinary pronoun ] harm?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q7"
        },
        {
          "id": "q7",
          "type": "percentage",
          "text": "What percentage of responsibility for [ name of plaintiff ]’s harm do you assign to the following?",
          "fields": [
            "name of plaintiff"
          ],
          "parties": [
            {
              "id": "p_name_of_defendant",
              "label": "[Name of defendant]"
            },
            {
              "id": "p_name_of_plaintiff",
              "label": "[Name of plaintiff]"
            }
          ],
          "must_total": 100,
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-1003",
      "title": "Landlord’s Liability for Dangerous Dog Kept on Property",
      "category": "premises_liability",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of defendant landlord ] own the property?",
          "fields": [
            "name of defendant landlord"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of defendant landlord ] know, or must [ name of defendant landlord ] have known, before the [attack/ other incident ] that [a] dog[s] being kept on the premises had a nature or tendency to be dangerous?",
          "fields": [
            "name of defendant landlord"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] harmed by the dog[s]?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Could [ name of defendant landlord ] have taken reasonable measures before the [attack/ other incident ] to prevent the harm?",
          "fields": [
            "name of defendant landlord"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Did [ name of defendant landlord ] fail to take reasonable measures to prevent the harm?",
          "fields": [
            "name of defendant landlord"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no",
          "text": "Was [ name of defendant landlord ]’s failure to take reasonable measures a substantial factor in causing [ name of plaintiff ]’s harm?",
          "fields": [
            "name of defendant landlord",
            "name of plaintiff"
          ],
          "if_yes": "q7"
        },
        {
          "id": "q7",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-1100",
      "title": "Dangerous Condition of Public Property",
      "category": "dangerous_condition",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of defendant ] own [or control] the property?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was the property in a dangerous condition at the time of the injury?",
          "fields": [],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Did the dangerous condition create a reasonably foreseeable risk that this kind of injury would occur?",
          "fields": [],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Did the negligent or wrongful conduct of [ name of defendant ]’s employee acting within the scope of employment create the dangerous condition?] [Did [ name of defendant ] have notice of the dangerous condition for a long enough time for [ name of defendant ] to have protected against it?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Was the dangerous condition a substantial factor in causing harm to [name of plaintiff ]?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-1101",
      "title": "Dangerous Condition of Public Property—Affirmative Defense—Reasonable Act or Omission (Gov. Code, § 835.4)",
      "category": "dangerous_condition",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of defendant ] own [or control] the property?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was the property in a dangerous condition at the time of the incident?",
          "fields": [],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Did the dangerous condition create a reasonably foreseeable risk that this kind of incident would occur?",
          "fields": [],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no_multi",
          "text": "Did negligent or wrongful conduct of [ name of defendant ]’s employee acting within the scope of the employee’s employment create the dangerous condition?] [Did [ name of defendant ] have notice of the dangerous condition for a long enough time to have protected against it?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q5",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Was the dangerous condition a substantial factor in causing harm to [name of plaintiff ]?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no_multi",
          "text": "Answer if you answered yes to the first option for question 4: When you consider the likelihood and seriousness of potential injury, compared with the practicality and cost of either (a) taking alternative action that would not have created the risk of injury, or (b) protecting against the risk of injury, was [ name of defendant ]’s [act/ specify failure to act ] that created the dangerous condition reasonable under the circumstances?] [Answer if you answered yes to the second option for question 4: When you consider the likelihood and seriousness of potential injury, compared with (a) how much time and opportunity [ name of defendant ] had to take action, and (b) the practicality and cost of protecting against the risk of injury, was [ name of defendant ]’s failure to take sufficient steps to protect against the risk of injury created by the dangerous condition reasonable under the circumstances?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q7",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q7",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-1200",
      "title": "Strict Products Liability—Manufacturing Defect—Comparative Fault at Issue",
      "category": "products_liability",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of defendant ] [manufacture/distribute/sell] the [product ]?",
          "fields": [
            "name of defendant",
            "product"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did the [ product ] contain a manufacturing defect when it left",
          "fields": [
            "product"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was the manufacturing defect a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages? Do not reduce the damages based on the fault, if any, of [ name of plaintiff ] or [ name/ description of other person ].",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] negligent?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ]’s negligence a substantial factor in causing [his/her/ nonbinary pronoun ] harm?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q7",
          "if_no": "q7"
        },
        {
          "id": "q7",
          "type": "yes_no",
          "text": "Was [ name/description of other person ] negligent?",
          "fields": [],
          "if_yes": "q8"
        },
        {
          "id": "q8",
          "type": "yes_no",
          "text": "Was [ name/description of other person ]’s negligence a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q9"
        },
        {
          "id": "q9",
          "type": "percentage",
          "text": "What percentage of responsibility for [ name of plaintiff ]’s harm do you assign to:",
          "fields": [
            "name of plaintiff"
          ],
          "parties": [
            {
              "id": "p_name_of_defendant",
              "label": "[Name of defendant]"
            },
            {
              "id": "p_name_of_plaintiff",
              "label": "[Name of plaintiff]"
            },
            {
              "id": "p_namedescription_of_other_person",
              "label": "[Name/description of other person]"
            }
          ],
          "must_total": 100,
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-1201",
      "title": "Strict Products Liability—Design Defect—Affirmative Defense—Misuse or Modification",
      "category": "products_liability",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of defendant ] [manufacture/distribute/sell] the [product ]?",
          "fields": [
            "name of defendant",
            "product"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was the [ product ] [misused/ [or] modified] after it left [ name of defendant ]’s possession in a way that was so highly extraordinary that it was not reasonably foreseeable to [him/her/ nonbinary pronoun /it]?",
          "fields": [
            "product",
            "name of defendant"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was the [misuse/ [or] modification] the sole cause of [ name of plaintiff ]’s harm?",
          "fields": [
            "name of plaintiff"
          ],
          "if_no": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Is the [ product ] one about which an ordinary consumer can form reasonable minimum safety expectations?",
          "fields": [
            "product"
          ],
          "optional": true,
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Did the [ product ] fail to perform as safely as an ordinary consumer would have expected when used or misused in an intended or reasonably foreseeable way?",
          "fields": [
            "product"
          ],
          "optional": true,
          "if_yes": "q6",
          "if_no": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no",
          "text": "Did the benefits of the [ product ]’s design outweigh the risks of the design?",
          "fields": [
            "product"
          ],
          "optional": true,
          "if_yes": "q7",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q7",
          "type": "yes_no",
          "text": "Was the [ product ]’s design a substantial factor in causing harm to",
          "fields": [
            "product"
          ],
          "if_yes": "q8"
        },
        {
          "id": "q8",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-1203",
      "title": "Strict Products Liability—Failure to Warn",
      "category": "products_liability",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of defendant ] [manufacture/distribute/sell] the [product ]?",
          "fields": [
            "name of defendant",
            "product"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did the [ product ] have potential [risks/side effects/allergic reactions] that were [known/ [or] knowable in light of the [scientific/ [and] medical] knowledge that was generally accepted in the scientific community] at the time of [manufacture/distribution/sale]?",
          "fields": [
            "product"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Did the potential [risks/side effects/allergic reactions] present a substantial danger to persons using or misusing the [ product ] in an intended or reasonably foreseeable way?",
          "fields": [
            "product"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Would ordinary consumers have recognized the potential [risks/ side effects/allergic reactions]?",
          "fields": [],
          "if_no": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Did [ name of defendant ] fail to adequately warn [or instruct] of the potential [risks/side effects/allergic reactions]?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no",
          "text": "Was the lack of sufficient [instructions] [or] [warnings] a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q7"
        },
        {
          "id": "q7",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-1204",
      "title": "Products Liability—Negligence—Comparative Fault of Plaintiff at Issue",
      "category": "products_liability",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of defendant ] [design/manufacture/supply/install/inspect/ repair/rent] the [ product ]?",
          "fields": [
            "name of defendant",
            "product"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [ name of defendant ] negligent in [designing/manufacturing/ supplying/installing/inspecting/repairing/renting] the [ product ]?",
          "fields": [
            "name of defendant",
            "product"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s negligence a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s total damages? Do not reduce the damages based on the fault, if any, of [ name of plaintiff ].",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] negligent?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ]’s negligence a substantial factor in causing [his/her/ nonbinary pronoun ] harm?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q7"
        },
        {
          "id": "q7",
          "type": "percentage",
          "text": "What percentage of responsibility for [ name of plaintiff ]’s harm do you assign to:",
          "fields": [
            "name of plaintiff"
          ],
          "parties": [
            {
              "id": "p_name_of_defendant",
              "label": "[Name of defendant]"
            },
            {
              "id": "p_name_of_plaintiff",
              "label": "[Name of plaintiff]"
            }
          ],
          "must_total": 100,
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-1205",
      "title": "Products Liability—Negligent Failure to Warn",
      "category": "products_liability",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of defendant ] [manufacture/distribute/sell] the [product ]?",
          "fields": [
            "name of defendant",
            "product"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of defendant ] know or should [he/she/ nonbinary pronoun /it] reasonably have known that the [ product ] was dangerous or was likely to be dangerous when used or misused in a reasonably foreseeable manner?",
          "fields": [
            "name of defendant",
            "product"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Did [ name of defendant ] know or should [he/she/ nonbinary pronoun /it] reasonably have known that users would not realize the danger?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Did [ name of defendant ] fail to adequately warn of the danger [or instruct on the safe use of] the [ product ]?",
          "fields": [
            "name of defendant",
            "product"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Would a reasonable [manufacturer/distributor/seller] under the same or similar circumstances have warned of the danger [or instructed on the safe use of] the [ product ]?",
          "fields": [
            "product"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s failure to warn a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q7"
        },
        {
          "id": "q7",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-1206",
      "title": "Products Liability—Express Warranty—Affirmative Defense—Not “Basis of Bargain”",
      "category": "products_liability",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of defendant ] represent to [ name of plaintiff ] by a [statement/description/sample/model/ other ] that the [ product ] [insert description of alleged express warranty ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff",
            "product",
            "insert description of alleged express warranty"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was the resulting bargain between the parties in which [ name of plaintiff ] decided to [ purchase/use ] the [ product ] based in any way on [name of defendant ]’s [statement/description/sample/model/ other ]?",
          "fields": [
            "name of plaintiff",
            "product",
            "name of defendant"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Did the [ product ] fail to [perform] [or] [have the same quality] as represented?",
          "fields": [
            "product"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Was the failure of the [ product ] to [perform] [or] [meet the quality] as represented a substantial factor in causing harm to",
          "fields": [
            "product"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-1207",
      "title": "Products Liability—Implied Warranty of Merchantability—Affirmative Defense—Exclusion of Implied Warranties",
      "category": "products_liability",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] buy the [ product ] from [ name of defendant ]?",
          "fields": [
            "name of plaintiff",
            "product",
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [ name of defendant ] in the business of selling these goods?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Did the sale of the [ product ] include notice that would have made a buyer aware that it was being sold without any representations relating to the quality that a buyer would expect?",
          "fields": [
            "product"
          ],
          "if_no": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Was the [ product ] fit for the ordinary purposes for which such goods are used?",
          "fields": [
            "product"
          ],
          "if_no": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Was the failure of the [ product ] to have the expected quality a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "product",
            "name of plaintiff"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-1208",
      "title": "Products Liability—Implied Warranty of Fitness for a Particular Purpose",
      "category": "products_liability",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] buy the [ product ] from [ name of defendant ]?",
          "fields": [
            "name of plaintiff",
            "product",
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "At the time of purchase, did [ name of defendant ] know or have reason to know that [ name of plaintiff ] intended to use the [product ] for a particular purpose?",
          "fields": [
            "name of defendant",
            "name of plaintiff",
            "product"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "At the time of purchase, did [ name of defendant ] know that [ name of plaintiff ] was relying on [ name of defendant ]’s skill and judgment to select or furnish a product that was suitable for the particular purpose?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] justifiably rely on [ name of defendant ]’s skill and judgment?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Was the [ product ] suitable for the particular purpose?",
          "fields": [
            "product"
          ],
          "if_no": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no",
          "text": "Was the failure of the [ product ] to be suitable a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "product",
            "name of plaintiff"
          ],
          "if_yes": "q7"
        },
        {
          "id": "q7",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-2300",
      "title": "Breach of Contractual Duty to Pay a Covered Claim",
      "category": "insurance",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] suffer a loss, [all or part of] which was covered under an insurance policy with [ name of defendant ]?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [ name of defendant ] notified of the loss [as required by the policy]?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "damages",
          "text": "What is the amount of the covered loss that [ name of defendant ] failed to pay [ name of plaintiff ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "line_items": [],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-2301",
      "title": "Breach of the Implied Obligation of Good Faith and Fair Dealing—Failure or Delay in Payment",
      "category": "insurance",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] suffer a loss covered under an insurance policy with [ name of defendant ]?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [ name of defendant ] notified of the loss?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Did [ name of defendant ] [fail to pay/delay payment of] policy benefits?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s [failure to pay/delay in payment of] policy benefits, unreasonable or without proper cause?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s [failure to pay/delay in payment of] policy benefits a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-2303",
      "title": "Bad Faith (First Party)—Breach of Duty to Inform Insured of Rights",
      "category": "insurance",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] suffer a loss covered under an insurance policy with [ name of defendant ]?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of defendant ] [deny coverage for/refuse to pay] [ name of plaintiff ]’s loss?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] have the [right/obligation] to [ describe right or obligation at issue; e.g., “to request arbitration within 180 days” ] under the policy?",
          "fields": [
            "name of plaintiff",
            "describe right or obligation at issue; e.g., “to request arbitration within 180 days”"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Did [ name of defendant ] fail to reasonably inform [ name of plaintiff ] of [his/her/ nonbinary pronoun ] [right/obligation] to [describe right or obligation ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff",
            "describe right or obligation"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s failure to reasonably inform [ name of plaintiff ] a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-2304",
      "title": "Bad Faith (Third Party)—Refusal to Accept Reasonable Settlement Demand Within Liability Policy Limits",
      "category": "insurance",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] insured under a policy of liability insurance issued by [ name of defendant ]?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of claimant ] make a claim against [ name of plaintiff ] that was covered by [ name of defendant ]’s insurance policy?",
          "fields": [
            "name of claimant",
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "damages",
          "text": "Did [ name of claimant ] make a reasonable settlement demand to settle [his/her/ nonbinary pronoun ] claim against [ name of plaintiff ] for an amount within policy limits?",
          "fields": [
            "name of claimant",
            "name of plaintiff"
          ],
          "line_items": [],
          "if_yes": "q4",
          "if_done": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Did [ name of defendant ] fail to accept this settlement demand?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s failure to accept the settlement demand the result of unreasonable conduct by [ name of defendant ]?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no",
          "text": "Was a judgment entered against [ name of plaintiff ] for a sum of money greater than the policy limits?] [Was [ name of defendant ]’s failure to accept the settlement demand a substantial factor in causing harm to [ name of plaintiff ]?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q7"
        },
        {
          "id": "q7",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "amount_of_judgment_entered_against_name_",
              "label": "Amount of judgment entered against  name of plaintiff",
              "children": []
            },
            {
              "id": "",
              "label": "$"
            },
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-2400",
      "title": "Breach of Employment Contract—Unspecified Term",
      "category": "employment",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] and [ name of defendant ] enter into an employment relationship?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of defendant ] promise, by words or conduct, not to [discharge/demote] [ name of plaintiff ] except for good cause?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] substantially perform [his/her/ nonbinary pronoun ] job duties?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ]’s performance excused or prevented?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Did [ name of defendant ] [discharge/demote] [ name of plaintiff ] without good cause?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] harmed by the [discharge/demotion]?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q7"
        },
        {
          "id": "q7",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss_",
              "label": "Past economic loss: $"
            },
            {
              "id": "future_economic_loss_",
              "label": "Future economic loss: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-2401",
      "title": "Breach of Employment Contract—Unspecified Term—Constructive Discharge",
      "category": "employment",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] and [ name of defendant ] enter into an employment relationship?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of defendant ] promise, by words or conduct, not to [discharge/demote] [ name of plaintiff ] except for good cause?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] substantially perform [his/her/ nonbinary pronoun ] job duties?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ]’s performance excused or prevented?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Did [ name of defendant ] intentionally create or knowingly permit working conditions to exist that were so intolerable that a reasonable person in [ name of plaintiff ]’s position would have had no reasonable alternative except to resign?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] resign because of the intolerable conditions?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q7"
        },
        {
          "id": "q7",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] harmed by the loss of employment?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q8"
        },
        {
          "id": "q8",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss_",
              "label": "Past economic loss: $"
            },
            {
              "id": "future_economic_loss_",
              "label": "Future economic loss: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-2402",
      "title": "Breach of Employment Contract—Specified Term",
      "category": "employment",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] and [ name of defendant ] enter into an employment contract that specified a length of time for which",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] substantially perform [his/her/ nonbinary pronoun ] job duties?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ]’s performance excused or prevented?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Did [ name of defendant ] breach the employment contract by [discharging/demoting] [ name of plaintiff ] before the end of the term of the contract?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] harmed by the [discharge/demotion]?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss_",
              "label": "Past economic loss: $"
            },
            {
              "id": "future_economic_loss_",
              "label": "Future economic loss: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-2403",
      "title": "Breach of Employment Contract—Specified Term—Good-Cause Defense",
      "category": "employment",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] and [ name of defendant ] enter into an employment contract that specified a length of time for which",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] substantially perform [his/her/ nonbinary pronoun ] job duties?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ]’s performance excused or prevented?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Did [ name of defendant ] [discharge/demote] [ name of plaintiff ] before the end of the term of the contract?",
          "fields": [
            "name of defendant",
            "name of plaintiff"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Did [ name of defendant ] have good cause to [discharge/demote",
          "fields": [
            "name of defendant"
          ],
          "if_no": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] harmed by the [discharge/demotion]?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q7"
        },
        {
          "id": "q7",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss_",
              "label": "Past economic loss: $"
            },
            {
              "id": "future_economic_loss_",
              "label": "Future economic loss: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-2404",
      "title": "Employment—Breach of the Implied Covenant of Good Faith and Fair Dealing",
      "category": "employment",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] and [ name of defendant ] enter into an employment relationship?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] substantially perform [his/her/ nonbinary pronoun ] job duties?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ]’s performance excused or prevented?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Did [ name of defendant ] [specify conduct that plaintiff claims prevented plaintiff from receiving the benefits under the contract ]?",
          "fields": [
            "name of defendant",
            "specify conduct that plaintiff claims prevented plaintiff from receiving the benefits under the contract"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Did [ name of defendant ] fail to act fairly and in good faith?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] harmed by [ name of defendant ]’s failure to act fairly and in good faith?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q7"
        },
        {
          "id": "q7",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss_",
              "label": "Past economic loss: $"
            },
            {
              "id": "future_economic_loss_",
              "label": "Future economic loss: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-2405",
      "title": "Breach of the Implied Covenant of Good Faith and Fair Dealing—Affirmative Defense—Good Faith Mistaken Belief",
      "category": "employment",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] and [ name of defendant ] enter into an employment agreement?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] substantially perform [his/her/ nonbinary pronoun ] job duties?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ]’s performance excused or prevented?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Did [ name of defendant ] [specify conduct that plaintiff claims prevented plaintiff from receiving the benefits under the contract ]?",
          "fields": [
            "name of defendant",
            "specify conduct that plaintiff claims prevented plaintiff from receiving the benefits under the contract"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Was [ name of defendant ]’s conduct based on an honest belief that [insert alleged mistake ]?",
          "fields": [
            "name of defendant",
            "insert alleged mistake"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no",
          "text": "If true, would [ insert alleged mistake ] have been a legitimate and reasonable business purpose for the conduct?",
          "fields": [
            "insert alleged mistake"
          ],
          "if_no": "q7"
        },
        {
          "id": "q7",
          "type": "yes_no",
          "text": "Did [ name of defendant ] fail to act fairly and in good faith?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q8"
        },
        {
          "id": "q8",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] harmed by [ name of defendant ]’s failure to act in good faith?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q9"
        },
        {
          "id": "q9",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss_",
              "label": "Past economic loss: $"
            },
            {
              "id": "future_economic_loss_",
              "label": "Future economic loss: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-2406",
      "title": "Wrongful Discharge in Violation of Public Policy",
      "category": "employment",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] employed by [ name of defendant ]?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] discharged?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ]’s [insert alleged activity protected by public policy, e.g., “refusal to engage in price fixing” ] a substantial motivating reason for [ name of defendant ]’s decision to discharge",
          "fields": [
            "name of plaintiff",
            "insert alleged activity protected by public policy, e.g., “refusal to engage in price fixing”",
            "name of defendant"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Did the discharge cause [ name of plaintiff ] harm?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-2407",
      "title": "Constructive Discharge in Violation of Public Policy—Plaintiff Required to Violate Public Policy",
      "category": "employment",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] employed by [ name of defendant ]?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did [ name of defendant ] require [ name of plaintiff ] to [ specify alleged conduct in violation of public policy, e.g., “engage in price fixing” ] as a condition of employment?",
          "fields": [
            "name of defendant",
            "name of plaintiff",
            "specify alleged conduct in violation of public policy, e.g., “engage in price fixing”"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Was this requirement so intolerable that a reasonable person in",
          "fields": [],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] resign because of this requirement?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Was the requirement a substantial factor in causing harm to",
          "fields": [],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-2408",
      "title": "Constructive Discharge in Violation of Public Policy—Plaintiff Required to Endure Intolerable Conditions for Improper Purpose That Violates Public Policy",
      "category": "employment",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] employed by [ name of defendant ]?",
          "fields": [
            "name of plaintiff",
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [ name of plaintiff ] subjected to working conditions that violated public policy, in that [ describe conditions imposed on the employee that constitute the violation, e.g., “plaintiff was treated intolerably in retaliation for filing a workers’ compensation claim” ]?",
          "fields": [
            "name of plaintiff",
            "describe conditions imposed on the employee that constitute the violation, e.g., “plaintiff was treated intolerably in retaliation for filing a workers’ compensation claim”"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "yes_no",
          "text": "Did [ name of defendant ] intentionally create or knowingly permit these working conditions?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Were these working conditions so intolerable that a reasonable person in [ name of plaintiff ]’s position would have had no reasonable alternative except to resign?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q5"
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Did [ name of plaintiff ] resign because of these working conditions?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q6"
        },
        {
          "id": "q6",
          "type": "yes_no",
          "text": "Were the working conditions a substantial factor in causing harm to [name of plaintiff ]?",
          "fields": [
            "name of plaintiff"
          ],
          "if_yes": "q7"
        },
        {
          "id": "q7",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_economic_loss",
              "label": "Past economic loss",
              "children": []
            },
            {
              "id": "total_past_economic_damages_",
              "label": "Total Past Economic Damages: $"
            },
            {
              "id": "future_economic_loss",
              "label": "Future economic loss",
              "children": []
            },
            {
              "id": "total_future_economic_damages_",
              "label": "Total Future Economic Damages: $"
            },
            {
              "id": "total",
              "label": "TOTAL"
            }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-3900",
      "title": "Punitive Damages",
      "category": "punitive_damages",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of defendant ] engage in the conduct with malice, oppression, or fraud?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "damages",
          "text": "What amount of punitive damages, if any, do you award [ name of plaintiff ]?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-3901",
      "title": "Punitive Damages Against Employer or Principal for Conduct of a Specific Agent or Employee",
      "category": "punitive_damages",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did [ name of agent/employee ] engage in the conduct with malice, oppression, or fraud?",
          "fields": [
            "name of agent/employee"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [ name of employee/agent ] an officer, director, or managing agent of [ name of defendant ] acting on behalf of [ name of defendant ]?",
          "fields": [
            "name of employee/agent",
            "name of defendant"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "damages",
          "text": "What amount of punitive damages, if any, do you award [ name of plaintiff ]?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-3902",
      "title": "Punitive Damages—Entity Defendant",
      "category": "punitive_damages",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was the conduct constituting malice, oppression, or fraud committed by one or more officers, directors, or managing agents of [name of defendant ] acting on behalf of [ name of defendant ]?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "damages",
          "text": "What amount of punitive damages, if any, do you award [ name of plaintiff ]?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-3903",
      "title": "Punitive Damages—Entity Defendant—Ratification",
      "category": "punitive_damages",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Did an agent or employee of [ name of defendant ] engage in the conduct with malice, oppression, or fraud?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q2"
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Did one or more officers, directors, or managing agents of [ name of defendant ] know of this conduct and adopt or approve it after it occurred?",
          "fields": [
            "name of defendant"
          ],
          "if_yes": "q3"
        },
        {
          "id": "q3",
          "type": "damages",
          "text": "What amount of punitive damages, if any, do you award [ name of plaintiff ]?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-3904",
      "title": "Punitive Damages—Entity Defendant—Authorization or Ratification",
      "category": "punitive_damages",
      "signature_block": false,
      "questions": []
    },
    {
      "id": "VF-3905",
      "title": "Damages for Wrongful Death (Death of an Adult)",
      "category": "punitive_damages",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s economic damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_losses_of_gifts_or_benefits_that",
              "label": "Past losses of gifts or benefits that",
              "children": []
            },
            {
              "id": "future_losses_of_gifts_or_benefits_that",
              "label": "Future losses of gifts or benefits that",
              "children": []
            }
          ],
          "if_done": "sign"
        },
        {
          "id": "q2",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s noneconomic damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-3906",
      "title": "Damages for Wrongful Death (Parents’ Recovery for Death of a Minor Child)",
      "category": "punitive_damages",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s economic damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [
            {
              "id": "past_losses_of_gifts_or_benefits_that",
              "label": "Past losses of gifts or benefits that",
              "children": []
            },
            {
              "id": "future_losses_of_gifts_or_benefits_that",
              "label": "Future losses of gifts or benefits that",
              "children": []
            }
          ],
          "if_done": "sign"
        },
        {
          "id": "q2",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s noneconomic damages?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-3907",
      "title": "Damages for Loss of Consortium (Noneconomic Damage)",
      "category": "punitive_damages",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages for loss of [his/her/ nonbinary pronoun ] [husband/wife]’s love, companionship, comfort, care, assistance, protection, affection, society, moral support, and enjoyment of sexual relations [or the ability to have children]?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-3919",
      "title": "Damages for Loss of Consortium (Noneconomic Damage)",
      "category": "punitive_damages",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "damages",
          "text": "What are [ name of plaintiff ]’s damages for loss of [his/her/ nonbinary pronoun ] [husband/wife]’s love, companionship, comfort, care, assistance, protection, affection, society, moral support, and enjoyment of sexual relations [or the ability to have children]?",
          "fields": [
            "name of plaintiff"
          ],
          "line_items": [],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-3920",
      "title": "Damages on Multiple Legal Theories What are [ name of plaintiff ]’s damages? [ List each item of damages listed in CACI No. 3934. ]",
      "category": "punitive_damages",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "damages",
          "text": "e.g., economic damages: lost past earnings ]. [Enter the amount below if you find that [ name of defendant ] is liable to [ name of plaintiff ] under [ specify all of the legal theories supporting this element of damages; use “or” if more than one ].]",
          "fields": [
            "name of defendant",
            "name of plaintiff",
            "specify all of the legal theories supporting this element of damages; use “or” if more than one"
          ],
          "line_items": [],
          "if_done": "sign"
        },
        {
          "id": "q2",
          "type": "damages",
          "text": "e.g., economic damages: past medical expenses ]. [Enter the amount below if you find that [ name of defendant ] is liable to [ name of plaintiff ] under [ specify the legal theories supporting this element of damages; use “or” if more than one ].]",
          "fields": [
            "name of defendant",
            "name of plaintiff",
            "specify the legal theories supporting this element of damages; use “or” if more than one"
          ],
          "line_items": [],
          "if_done": "sign"
        },
        {
          "id": "q3",
          "type": "damages",
          "text": "e.g., economic damages: lost future earnings ]. [Enter the amount below if you find that [ name of defendant ] is liable to [ name of plaintiff ] under [ specify the legal theories supporting this element of damages; use “or” if more than one ].]",
          "fields": [
            "name of defendant",
            "name of plaintiff",
            "specify the legal theories supporting this element of damages; use “or” if more than one"
          ],
          "line_items": [],
          "if_done": "sign"
        },
        {
          "id": "q4",
          "type": "damages",
          "text": "e.g., economic damages: future medical expenses ]. [Enter the amount below if you find that [ name of defendant ] is liable to",
          "fields": [
            "name of defendant"
          ],
          "line_items": [],
          "if_done": "sign"
        },
        {
          "id": "q5",
          "type": "damages",
          "text": "e.g., past noneconomic loss including [physical pain/mental suffering ].] [Enter the amount below if you find that [ name of defendant ] is liable to [ name of plaintiff ] under [ specify the legal theories supporting this element of damages; use “or” if more than one].]",
          "fields": [
            "name of defendant",
            "name of plaintiff",
            "specify the legal theories supporting this element of damages; use “or” if more than one"
          ],
          "line_items": [],
          "if_done": "sign"
        },
        {
          "id": "q6",
          "type": "damages",
          "text": "e.g., future noneconomic loss including [physical pain/mental suffering ].] [Enter the amount below if you find that [ name of defendant ] is liable to [ name of plaintiff ] under [ specify the legal theories supporting this element of damages; use “or” if more than one].]",
          "fields": [
            "name of defendant",
            "name of plaintiff",
            "specify the legal theories supporting this element of damages; use “or” if more than one"
          ],
          "line_items": [],
          "if_done": "sign"
        }
      ]
    }
  ]
};
