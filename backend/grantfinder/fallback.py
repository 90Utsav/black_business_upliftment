"""What we tell a user when no stored grant matches (used by phase 4's no-match path).

SBIR/STTR is a federal R&D seed fund, not a business-type grant. Per the team's
decision it is shown to every no-match user; the text states what it funds
(new technology/products) so users can judge fit. Facts: sbir.gov/about (award ceilings as of 2026-10-16);
eligibility/timing are the programs' standard rules; verify before launch.
"""

SBIR_URL = "https://www.sbir.gov/"

# Full paragraph for the web chat.
SBIR_PARAGRAPH = (
    "If nothing above fits, take a look at America's Seed Fund (SBIR/STTR) at sbir.gov. "
    "It is not a grant for a particular type of business: it is a federal program, run by "
    "11 agencies and coordinated by the SBA since 1982, that gives equity-free money "
    "(you give up no ownership) to small, U.S.-owned for-profit businesses developing a "
    "new technology or product. Awards come in stages: Phase I (proving the idea, usually 6-12 months) "
    "can be up to about $336,000, and Phase II (building it out, around 2 years) up to "
    "about $2.2 million, with the exact amount set by each agency. There is no single "
    "deadline: every agency posts its own solicitations at different times of year (some "
    "rolling), so browse sbir.gov's topics page to see what is open now. The application "
    "is detailed and competitive, but the site has free guides and a help line for "
    "first-time applicants."
)

# Same idea, trimmed to fit ~2 SMS messages (~320 chars) for the Twilio path.
SBIR_SMS = (
    "No exact match yet. Check America's Seed Fund (SBIR/STTR) for new tech or "
    "products: free money, no equity, ~$336K to start, ~$2.2M after. Open times vary "
    "by agency: sbir.gov"
)
