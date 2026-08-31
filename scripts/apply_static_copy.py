#!/usr/bin/env python3
"""Apply deliberate, reviewed copy to structured guide entries.

These overrides are written into app-data.json during the build. They are not browser-side
transformations.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP_DATA = ROOT / "data" / "app-data.json"

FOSTER_PROGRAM_COPY = {
    "Mecklenburg LINKS": {
        "ageWindow": "Usually ages 13–21",
        "eligibilityTrigger": "Young people who are or were in foster care in Mecklenburg County; county rules apply.",
        "primaryValue": "Help planning for housing, school, work and living on their own, plus some financial assistance.",
        "recommendedAction": "Contact LINKS as early as possible and document the young adult's foster-care history.",
    },
    "Phoenix Project": {
        "ageWindow": "Under 21",
        "eligibilityTrigger": "Former Mecklenburg County foster youth who are no longer in county care; individual eligibility must be confirmed.",
        "primaryValue": "Transition support after foster care, including access to eligible financial assistance.",
        "recommendedAction": "Call 704-336-3290 before the young adult's 21st birthday.",
    },
    "Foster Care 18 to 21 / VPA": {
        "ageWindow": "Ages 18–21",
        "eligibilityTrigger": "Young adults who meet North Carolina requirements and sign a voluntary placement agreement.",
        "primaryValue": "Continued placement, planning support and financial assistance through age 21.",
        "recommendedAction": "Contact LINKS before discharge from foster care and complete the agreement before leaving care.",
    },
    "Medicaid for Former Foster Care Youth": {
        "ageWindow": "Usually under 26",
        "eligibilityTrigger": "Certain young adults who were in foster care and had Medicaid when they aged out; state rules apply.",
        "primaryValue": "Health coverage for medical care, prescriptions and mental health care.",
        "recommendedAction": "State former foster-care status clearly on the application.",
    },
    "Children and Families Specialty Plan": {
        "ageWindow": "Often under 26 for eligible former foster youth",
        "eligibilityTrigger": "Medicaid members who meet the plan's child-welfare or former-foster-care requirements.",
        "primaryValue": "A Medicaid plan designed for people with foster-care experience, including help coordinating health care.",
        "recommendedAction": "Confirm plan enrollment and keep contact information current.",
    },
    "NC Reach": {
        "ageWindow": "College or career training; current program rules apply",
        "eligibilityTrigger": "Eligible North Carolina residents who aged out at 18 or were adopted after age 12 and attend an eligible public school at least half time.",
        "primaryValue": "Scholarship support for approved school costs remaining after other financial aid.",
        "recommendedAction": "Complete the FAFSA and NC Reach application before classes begin.",
    },
    "Education and Training Voucher": {
        "ageWindow": "Age and foster-care status rules apply",
        "eligibilityTrigger": "Eligible current or former foster youth and some young people who left care through adoption or guardianship.",
        "primaryValue": "Funding for approved college, career-school and training costs, up to the program limit.",
        "recommendedAction": "Coordinate ETV with LINKS and the school's financial-aid office.",
    },
    "Youth Villages LifeSet": {
        "ageWindow": "Generally ages 17.5–23",
        "eligibilityTrigger": "Young adults preparing to leave or recently leaving foster care who meet local referral criteria.",
        "primaryValue": "One-on-one support with housing, employment, education, money and daily life.",
        "recommendedAction": "Contact the Charlotte-area program and confirm the referral pathway and current openings.",
    },
    "The Relatives On Ramp": {
        "ageWindow": "Ages 16–24",
        "eligibilityTrigger": "Mecklenburg County young people ages 16–24; foster-care history is not required.",
        "primaryValue": "One place for planning and connections to housing, work, school and basic-needs support.",
        "recommendedAction": "Use On Ramp when a young adult has several needs or needs help deciding where to start.",
    },
    "The Relatives Housing": {
        "ageWindow": "Ages 18–24",
        "eligibilityTrigger": "Young adults ages 18–24 who are homeless, at risk of losing housing or fleeing violence; screening applies.",
        "primaryValue": "Housing in community apartments plus support with goals and everyday needs.",
        "recommendedAction": "Request screening early; placement depends on available openings.",
    },
    "Charlotte Angels Dare to Dream": {
        "ageWindow": "Generally ages 11–22",
        "eligibilityTrigger": "Young people in foster care who meet the program's matching criteria.",
        "primaryValue": "Long-term volunteer mentoring and consistent relational support.",
        "recommendedAction": "Coordinate with existing mentors to avoid overlapping or conflicting roles.",
    },
    "SaySo": {
        "ageWindow": "Teens through the mid-20s, depending on the activity",
        "eligibilityTrigger": "Young people with foster care, kinship care, group-home or other out-of-home-care experience.",
        "primaryValue": "Peer community, leadership opportunities, advocacy and transition information.",
        "recommendedAction": "Confirm eligibility for the activity and invite young adults who want peer connection and leadership opportunities.",
    },
    "I Am Here legal hotline": {
        "ageWindow": "Young people without safe, stable housing",
        "eligibilityTrigger": "Young people experiencing homelessness who need help getting an ID, birth certificate or another important document.",
        "primaryValue": "Free legal help obtaining IDs and important documents.",
        "recommendedAction": "Call or text 1-888-870-DOCS and confirm the current hours.",
    },
    "Home4Me — LEG Up on LIFE": {
        "ageWindow": "Different tracks for teens, young adults and people over 20",
        "eligibilityTrigger": "Young people transitioning from foster care or adolescence; current enrollment and age-track rules apply.",
        "primaryValue": "Mentoring, coaching, money skills, leadership and practical living skills.",
        "recommendedAction": "Ask about the current virtual group and the track that fits the young adult's age.",
    },
    "Machiah's House": {
        "ageWindow": "Generally ages 18–24",
        "eligibilityTrigger": "Young women aging out of foster care who meet the program's current criteria.",
        "primaryValue": "Workshops, supportive relationships and connections to education, employment and stability resources.",
        "recommendedAction": "Confirm current programming and do not describe housing as available unless staff confirms it.",
    },
    "Congregations for Kids — Mentor Match": {
        "ageWindow": "Ages 11–18",
        "eligibilityTrigger": "Young people under 18 currently in foster care through Mecklenburg or Union County.",
        "primaryValue": "A committed adult mentor before the transition out of foster care.",
        "recommendedAction": "Use for planning before age 18 and coordinate clearly with any other mentor.",
    },
    "Livingstone College H.O.P.E. Emancipation Project": {
        "ageWindow": "Preparing for college",
        "eligibilityTrigger": "Students with foster-care or emancipation experience who are interested in Livingstone College.",
        "primaryValue": "A foster-specific college recruitment and support pathway developed with Home4Me.",
        "recommendedAction": "Contact the project before applying and confirm current financial, housing and student-retention support.",
    },
}


def main() -> None:
    data = json.loads(APP_DATA.read_text(encoding="utf-8"))
    for item in data.get("fosterPrograms", []):
        item.update(FOSTER_PROGRAM_COPY.get(item.get("program", ""), {}))

    APP_DATA.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print("Applied deliberate static guide copy")


if __name__ == "__main__":
    main()
