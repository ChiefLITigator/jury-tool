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
          "text": "What are [name of plaintiff]\u2019s damages?",
          "fields": ["name of plaintiff"],
          "line_items": [
            { "id": "past_econ",      "label": "Past economic loss" },
            { "id": "future_econ",    "label": "Future economic loss" },
            { "id": "past_nonecon",   "label": "Past noneconomic loss" },
            { "id": "future_nonecon", "label": "Future noneconomic loss" }
          ],
          "if_done": "sign"
        }
      ]
    }
  ]
};