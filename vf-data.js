const vfDB = {
  "groups": [
    {
      "id": "VF-400",
      "title": "Negligence\u2014Essential Factual Elements",
      "category": "negligence",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [name of defendant] negligent?",
          "fields": ["name of defendant"],
          "if_yes": "q2",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [name of defendant]\u2019s negligence a substantial factor in causing harm to [name of plaintiff]?",
          "fields": ["name of defendant", "name of plaintiff"],
          "if_yes": "q3",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q3",
          "type": "damages",
          "text": "What are [name of plaintiff]\u2019s damages? Do not reduce the damages based on the fault, if any, of [name of plaintiff].",
          "fields": ["name of plaintiff"],
          "line_items": [
            { "id": "past_econ", "label": "Past economic loss", "children": [
              { "id": "past_lost_earnings", "label": "Lost earnings" },
              { "id": "past_lost_profits",  "label": "Lost profits" },
              { "id": "past_medical",       "label": "Medical expenses" },
              { "id": "past_other_econ",    "label": "Other past economic loss" }
            ]},
            { "id": "future_econ", "label": "Future economic loss", "children": [
              { "id": "future_lost_earnings", "label": "Lost earnings" },
              { "id": "future_lost_profits",  "label": "Lost profits" },
              { "id": "future_medical",       "label": "Medical expenses" },
              { "id": "future_other_econ",    "label": "Other future economic loss" }
            ]},
            { "id": "past_nonecon",   "label": "Past noneconomic loss" },
            { "id": "future_nonecon", "label": "Future noneconomic loss" }
          ],
          "if_done": "sign"
        }
      ]
    },
    {
      "id": "VF-401",
      "title": "Negligence\u2014Single Defendant\u2014Plaintiff's Negligence at Issue\u2014Fault of Others Not at Issue",
      "category": "negligence",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [name of defendant] negligent?",
          "fields": ["name of defendant"],
          "if_yes": "q2",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [name of defendant]\u2019s negligence a substantial factor in causing harm to [name of plaintiff]?",
          "fields": ["name of defendant", "name of plaintiff"],
          "if_yes": "q3",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q3",
          "type": "damages",
          "text": "What are [name of plaintiff]\u2019s damages?",
          "fields": ["name of plaintiff"],
          "line_items": [
            { "id": "past_econ", "label": "Past economic loss", "children": [
              { "id": "past_lost_earnings", "label": "Lost earnings" },
              { "id": "past_lost_profits",  "label": "Lost profits" },
              { "id": "past_medical",       "label": "Medical expenses" },
              { "id": "past_other_econ",    "label": "Other past economic loss" }
            ]},
            { "id": "future_econ", "label": "Future economic loss", "children": [
              { "id": "future_lost_earnings", "label": "Lost earnings" },
              { "id": "future_lost_profits",  "label": "Lost profits" },
              { "id": "future_medical",       "label": "Medical expenses" },
              { "id": "future_other_econ",    "label": "Other future economic loss" }
            ]},
            { "id": "past_nonecon",   "label": "Past noneconomic loss" },
            { "id": "future_nonecon", "label": "Future noneconomic loss" }
          ],
          "if_done": "q4"
        },
        {
          "id": "q4",
          "type": "yes_no",
          "text": "Was [name of plaintiff] negligent?",
          "fields": ["name of plaintiff"],
          "if_yes": "q5",
          "if_no": "sign",
          "stop_text": ""
        },
        {
          "id": "q5",
          "type": "yes_no",
          "text": "Was [name of plaintiff]\u2019s negligence a substantial factor in causing [his/her/nonbinary pronoun] harm?",
          "fields": ["name of plaintiff", "his/her/nonbinary pronoun"],
          "if_yes": "q6",
          "if_no": "sign",
          "stop_text": ""
        },
        {
          "id": "q6",
          "type": "percentage",
          "text": "What percentage of responsibility for [name of plaintiff]\u2019s harm do you assign to:",
          "fields": ["name of plaintiff"],
          "parties": [
            { "id": "p_plaintiff", "label": "[name of plaintiff]" },
            { "id": "p_defendant", "label": "[name of defendant]" }
          ],
          "must_total": 100,
          "if_done": "sign"
        }
      ]

    }
  ]
};