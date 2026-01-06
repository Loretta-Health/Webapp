# Diabetes Prediction Model - Feature Documentation

This document lists all 98 features used by the model, their descriptions, and valid answer options.

---

## Demographics

### 1. `RIAGENDR`
**Description:** Gender
**Type:** Categorical
**Age Range:** 0-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Male |
| 1 | Female |

### 2. `RIDAGEYR`
**Description:** Age in years at screening
**Type:** Numerical
**Age Range:** 0-150
**Accepted Values:** Any numeric value (e.g., "65", "120.5")

### 3. `RIDRETH3`
**Description:** Race/Hispanic origin w/ NH Asian
**Type:** Categorical
**Age Range:** 0-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Mexican American |
| 1 | Other Hispanic |
| 2 | Non-Hispanic White |
| 3 | Non-Hispanic Black |
| 4 | Non-Hispanic Asian |
| 5 | Other Race - Including Multi-Racial |

### 4. `DMQMILIZ`
**Description:** Served active duty in US Armed Forces
**Type:** Categorical
**Age Range:** 17-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 5. `DMDEDUC2`
**Description:** Education level - Adults 20+
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Less than 9th grade |
| 1 | 9-11th grade (Includes 12th grade with no diploma) |
| 2 | High school graduate/GED or equivalent |
| 3 | Some college or AA degree |
| 4 | College graduate or above |

### 6. `DMDMARTZ`
**Description:** Marital status
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Married/Living with partner |
| 1 | Widowed/Divorced/Separated |
| 2 | Never married |

### 7. `DMDHHSIZ`
**Description:** Total number of people in the Household
**Type:** Categorical
**Age Range:** 0-150
**Accepted Values:** Numeric codes

### 8. `INDFMPIR`
**Description:** Ratio of family income to poverty
**Type:** Numerical
**Age Range:** 0-150
**Accepted Values:** Any numeric value (e.g., "65", "120.5")

## Examination

### 9. `BAQ110`
**Description:** Can stand on your own?
**Type:** Categorical
**Age Range:** 20-69
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 10. `BAQ121`
**Description:** Are you currently wearing a leg brace?
**Type:** Categorical
**Age Range:** 20-69
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 11. `BAQ125`
**Description:** Injury to foot, leg, or hip
**Type:** Categorical
**Age Range:** 20-69
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 12. `BAQ132`
**Description:** Problems with dizzy, past 24 hours
**Type:** Categorical
**Age Range:** 20-69
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 13. `BAQ140`
**Description:** Last 12 months, fallen due to dizziness
**Type:** Categorical
**Age Range:** 20-69
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 14. `BAQ150`
**Description:** Do you have neck pain now?
**Type:** Categorical
**Age Range:** 20-69
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 15. `BAQ160`
**Description:** Have you ever had surgery on your neck?
**Type:** Categorical
**Age Range:** 20-69
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 16. `BAQ170`
**Description:** Neck problem lasted more than 6 weeks
**Type:** Categorical
**Age Range:** 20-69
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 17. `BAQ201`
**Description:** Can you move head 30 degrees left/right?
**Type:** Categorical
**Age Range:** 20-69
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

## Questionnaire

### 18. `ALQ111`
**Description:** Ever had a drink of any kind of alcohol
**Type:** Categorical
**Age Range:** 18-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 19. `ALQ121`
**Description:** Past 12 mos how often drink alc bev
**Type:** Categorical
**Age Range:** 18-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Never in the last year |
| 1 | Every day |
| 2 | Nearly every day |
| 3 | 3 to 4 times a week |
| 4 | 2 times a week |
| 5 | Once a week |
| 6 | 2 to 3 times a month |
| 7 | Once a month |
| 8 | 7 to 11 times in the last year |
| 9 | 3 to 6 times in the last year |
| 10 | 1 to 2 times in the last year |

### 20. `AUQ054`
**Description:** General condition of hearing
**Type:** Categorical
**Age Range:** 1-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Excellent |
| 1 | Good |
| 2 | A little trouble |
| 3 | Moderate hearing trouble |
| 4 | A lot of trouble |
| 5 | Deaf |

### 21. `BAQ321A`
**Description:** Past 12 months, problems with vertigo
**Type:** Categorical
**Age Range:** 20-69
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 22. `BAQ321B`
**Description:** Past 12 months, prblms w/blurring vision
**Type:** Categorical
**Age Range:** 20-69
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 23. `BAQ321C`
**Description:** Past 12 months, problems with unsteady
**Type:** Categorical
**Age Range:** 20-69
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 24. `BAQ321D`
**Description:** Past 12 months, problems w/light-headed
**Type:** Categorical
**Age Range:** 20-69
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 25. `BAQ530`
**Description:** Past 5 years, how many times fallen?
**Type:** Categorical
**Age Range:** 20-69
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Never |
| 1 | 1 or 2 times |
| 2 | 3 to 4 times |
| 3 | About every year |
| 4 | About every month |
| 5 | About every week |
| 6 | Daily or constantly |

### 26. `BPQ020`
**Description:** Ever told you had high blood pressure
**Type:** Categorical
**Age Range:** 16-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 27. `BPQ080`
**Description:** Doctor told you - high cholesterol level
**Type:** Categorical
**Age Range:** 16-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 28. `DIQ010`
**Description:** Doctor told you have diabetes
**Type:** Categorical
**Age Range:** 1-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 29. `DPQ010`
**Description:** Have little interest in doing things
**Type:** Categorical
**Age Range:** 18-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Not at all |
| 1 | Several days |
| 2 | More than half the days |
| 3 | Nearly every day |

### 30. `DPQ020`
**Description:** Feeling down, depressed, or hopeless
**Type:** Categorical
**Age Range:** 18-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Not at all |
| 1 | Several days |
| 2 | More than half the days |
| 3 | Nearly every day |

### 31. `DPQ030`
**Description:** Trouble sleeping or sleeping too much
**Type:** Categorical
**Age Range:** 18-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Not at all |
| 1 | Several days |
| 2 | More than half the days |
| 3 | Nearly every day |

### 32. `DPQ040`
**Description:** Feeling tired or having little energy
**Type:** Categorical
**Age Range:** 18-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Not at all |
| 1 | Several days |
| 2 | More than half the days |
| 3 | Nearly every day |

### 33. `DPQ050`
**Description:** Poor appetite or overeating
**Type:** Categorical
**Age Range:** 18-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Not at all |
| 1 | Several days |
| 2 | More than half the days |
| 3 | Nearly every day |

### 34. `DPQ060`
**Description:** Feeling bad about yourself
**Type:** Categorical
**Age Range:** 18-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Not at all |
| 1 | Several days |
| 2 | More than half the days |
| 3 | Nearly every day |

### 35. `DPQ070`
**Description:** Trouble concentrating on things
**Type:** Categorical
**Age Range:** 18-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Not at all |
| 1 | Several days |
| 2 | More than half the days |
| 3 | Nearly every day |

### 36. `DPQ080`
**Description:** Moving or speaking slowly or too fast
**Type:** Categorical
**Age Range:** 18-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Not at all |
| 1 | Several days |
| 2 | More than half the days |
| 3 | Nearly every day |

### 37. `DPQ090`
**Description:** Thought you would be better off dead
**Type:** Categorical
**Age Range:** 18-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Not at all |
| 1 | Several days |
| 2 | More than half the days |
| 3 | Nearly every day |

### 38. `HEQ010`
**Description:** Ever told you have Hepatitis B
**Type:** Categorical
**Age Range:** 6-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 39. `HIQ011`
**Description:** Covered by health insurance
**Type:** Categorical
**Age Range:** 0-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 40. `HOD051`
**Description:** Number of rooms in home
**Type:** Categorical
**Age Range:** 0-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | 1 |
| 1 | 2 |
| 2 | 3 |
| 3 | 4 |
| 4 | 5 |
| 5 | 6 |
| 6 | 7 |
| 7 | 8 |
| 8 | 9 |
| 9 | 10 |
| 10 | 11 |
| 11 | 12 or more |

### 41. `HUQ010`
**Description:** General health condition
**Type:** Categorical
**Age Range:** 0-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Excellent |
| 1 | Very good |
| 2 | Good |
| 3 | Fair |
| 4 | Poor |

### 42. `HUQ030`
**Description:** Routine place to go for healthcare
**Type:** Categorical
**Age Range:** 0-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Yes |
| 1 | There is no place |
| 2 | There is more than one place |

### 43. `HUQ042`
**Description:** Type place most often go for healthcare
**Type:** Categorical
**Age Range:** 0-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | A doctor's office or health center |
| 1 | Urgent care center or clinic in a drug store or grocery store |
| 2 | Emergency room |
| 3 | A VA medical center or VA outpatient clinic |
| 4 | Some other place |
| 5 | Doesn't go to one place most often |

### 44. `HUQ055`
**Description:** Past 12 months had video conf w/Dr?
**Type:** Categorical
**Age Range:** 0-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 45. `HUQ090`
**Description:** Seen mental health professional/past yr
**Type:** Categorical
**Age Range:** 0-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 46. `IMQ011`
**Description:** Received Hepatitis A vaccine
**Type:** Categorical
**Age Range:** 2-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Yes, at least 2 doses |
| 1 | Less than 2 doses |
| 2 | No doses |

### 47. `INDFMMPI`
**Description:** Family monthly poverty level index
**Type:** Numerical
**Age Range:** 0-150
**Accepted Values:** Any numeric value (e.g., "65", "120.5")

### 48. `INDFMMPC`
**Description:** Family monthly poverty level category
**Type:** Categorical
**Age Range:** 0-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Monthly poverty level index <= 1.30 |
| 1 | 1.30 < Monthly poverty level index <= 1.85 |
| 2 | Monthly poverty level index >1.85 |

### 49. `INQ300`
**Description:** Family has savings more than $20,000
**Type:** Categorical
**Age Range:** 0-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 50. `KIQ022`
**Description:** Ever told you had weak/failing kidneys?
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 51. `MCQ010`
**Description:** Ever been told you have asthma
**Type:** Categorical
**Age Range:** 1-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 52. `AGQ030`
**Description:** Did SP have episode of hay fever/past yr
**Type:** Categorical
**Age Range:** 1-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 53. `MCQ053`
**Description:**  Taking treatment for anemia/past 3 mos
**Type:** Categorical
**Age Range:** 1-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 54. `MCQ160A`
**Description:** Doctor ever said you had arthritis
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 55. `MCQ160B`
**Description:** Ever told had congestive heart failure
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 56. `MCQ160C`
**Description:** Ever told you had coronary heart disease
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 57. `MCQ160D`
**Description:** Ever told you had angina/angina pectoris
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 58. `MCQ160E`
**Description:** Ever told you had heart attack
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 59. `MCQ160F`
**Description:** Ever told you had a stroke
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 60. `MCQ160M`
**Description:** Ever told you had thyroid problem
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 61. `MCQ160P`
**Description:** Ever told you had COPD, emphysema, ChB
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 62. `MCQ160L`
**Description:** Ever told you had any liver condition
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 63. `MCQ550`
**Description:** Has DR ever said you have gallstones
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 64. `MCQ560`
**Description:** Ever had gallbladder surgery?
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 65. `MCQ220`
**Description:** Ever told you had cancer or malignancy
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 66. `OCD150`
**Description:** Type of work done last week
**Type:** Categorical
**Age Range:** 16-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Working at a job or business |
| 1 | With a job or business but not at work |
| 2 | Looking for work |
| 3 | Not working at a job or business |

### 67. `OHQ845`
**Description:** Rate the health of your teeth and gums
**Type:** Categorical
**Age Range:** 1-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Excellent |
| 1 | Very good |
| 2 | Good |
| 3 | Fair |
| 4 | Poor |

### 68. `OHQ620`
**Description:** How often last yr. had aching in mouth?
**Type:** Categorical
**Age Range:** 1-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Very often |
| 1 | Fairly often |
| 2 | Occasionally |
| 3 | Hardly ever |
| 4 | Never |

### 69. `OHQ630`
**Description:** How often felt bad because of mouth?
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Very often |
| 1 | Fairly often |
| 2 | Occasionally |
| 3 | Hardly ever |
| 4 | Never |

### 70. `OHQ640`
**Description:** Last yr had diff w/ job because of mouth
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Very often |
| 1 | Fairly often |
| 2 | Occasionally |
| 3 | Hardly ever |
| 4 | Never |

### 71. `OHQ660`
**Description:** Last yr avoid some food because of mouth
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Very often |
| 1 | Fairly often |
| 2 | Occasionally |
| 3 | Hardly ever |
| 4 | Never |

### 72. `OHQ670`
**Description:** Last yr couldn't eat because of mouth
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Very often |
| 1 | Fairly often |
| 2 | Occasionally |
| 3 | Hardly ever |
| 4 | Never |

### 73. `OHQ680`
**Description:** Last yr embarrassed because of mouth
**Type:** Categorical
**Age Range:** 20-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | Very often |
| 1 | Fairly often |
| 2 | Occasionally |
| 3 | Hardly ever |
| 4 | Never |

### 74. `PAD790`
**Description:** Hour moderate LTPA/week
**Type:** Numerical
**Age Range:** 18-150
**Accepted Values:** Any numeric value (e.g., "65", "120.5")

### 75. `PAD680`
**Description:** Sedentary activity (hr/day)
**Type:** Numerical
**Age Range:** 18-150
**Accepted Values:** Any numeric value (e.g., "65", "120.5")

### 76. `RXQ510`
**Description:** Dr told to take daily low-dose aspirin?
**Type:** Categorical
**Age Range:** 40-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 77. `RXQ033`
**Description:** Taken prescription medicine, past month
**Type:** Categorical
**Age Range:** 0-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 78. `SLD012`
**Description:** Sleep hours - weekdays or workdays
**Type:** Numerical
**Age Range:** 16-150
**Accepted Values:** Any numeric value (e.g., "65", "120.5")

### 79. `SLD013`
**Description:** Sleep hours - weekends
**Type:** Numerical
**Age Range:** 16-150
**Accepted Values:** Any numeric value (e.g., "65", "120.5")

### 80. `SLQ300_sin`
**Description:** Usual sleep time on weekdays or workdays (sin)
**Type:** Numerical
**Age Range:** 16-150
**Accepted Values:** Any numeric value (e.g., "65", "120.5")

### 81. `SLQ300_cos`
**Description:** Usual sleep time on weekdays or workdays (cos)
**Type:** Numerical
**Age Range:** 16-150
**Accepted Values:** Any numeric value (e.g., "65", "120.5")

### 82. `SLQ310_sin`
**Description:** Usual wake time on weekdays or workdays (sin)
**Type:** Numerical
**Age Range:** 16-150
**Accepted Values:** Any numeric value (e.g., "65", "120.5")

### 83. `SLQ310_cos`
**Description:** Usual wake time on weekdays or workdays (cos)
**Type:** Numerical
**Age Range:** 16-150
**Accepted Values:** Any numeric value (e.g., "65", "120.5")

### 84. `SLQ320_sin`
**Description:** Usual sleep time on weekends (sin)
**Type:** Numerical
**Age Range:** 16-150
**Accepted Values:** Any numeric value (e.g., "65", "120.5")

### 85. `SLQ320_cos`
**Description:** Usual sleep time on weekends (cos)
**Type:** Numerical
**Age Range:** 16-150
**Accepted Values:** Any numeric value (e.g., "65", "120.5")

### 86. `SLQ330_sin`
**Description:** Usual wake time on weekends (sin)
**Type:** Numerical
**Age Range:** 16-150
**Accepted Values:** Any numeric value (e.g., "65", "120.5")

### 87. `SLQ330_cos`
**Description:** Usual wake time on weekends (cos)
**Type:** Numerical
**Age Range:** 16-150
**Accepted Values:** Any numeric value (e.g., "65", "120.5")

### 88. `SMD460`
**Description:** # of people who live here smoke tobacco?
**Type:** Categorical
**Age Range:** 0-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No one in household is a smoker |
| 1 | 1 household member is a smoker |
| 2 | 2 or more household members are smokers |

### 89. `SMQ681`
**Description:** Smoked tobacco last 5 days?
**Type:** Categorical
**Age Range:** 12-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 90. `SMQ846`
**Description:** Used last 5 days - E-cigarettes
**Type:** Categorical
**Age Range:** 12-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 91. `SMQ851`
**Description:** Used smokeless tobacco last 5 days?
**Type:** Categorical
**Age Range:** 12-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 92. `SMQ863`
**Description:** Used nicotine replacement last 5 days?
**Type:** Categorical
**Age Range:** 18-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 93. `SMDANY`
**Description:** Used any tobacco product last 5 days?
**Type:** Categorical
**Age Range:** 12-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 94. `SMQ020`
**Description:** Smoked at least 100 cigarettes in life
**Type:** Categorical
**Age Range:** 18-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

### 95. `WHD010`
**Description:** Current self-reported height (inches)
**Type:** Numerical
**Age Range:** 16-150
**Accepted Values:** Any numeric value (e.g., "65", "120.5")

### 96. `WHD020`
**Description:** Current self-reported weight (pounds)
**Type:** Numerical
**Age Range:** 16-150
**Accepted Values:** Any numeric value (e.g., "65", "120.5")

### 97. `WHD050`
**Description:** Self-reported weight - 1 yr ago (pounds)
**Type:** Numerical
**Age Range:** 16-150
**Accepted Values:** Any numeric value (e.g., "65", "120.5")

### 98. `WHQ070`
**Description:** Tried to lose weight in past year
**Type:** Categorical
**Age Range:** 16-150
**Accepted Values:**
| Internal Code | Human-Readable Value |
|--------------|---------------------|
| 0 | No |
| 1 | Yes |

---

**Total Features:** 98