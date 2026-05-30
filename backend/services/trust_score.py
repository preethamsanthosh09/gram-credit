def calculate_trust_score(user_id, db) -> dict:
  """
  Trust score components (max 50 bonus points on top of eligibility score):
  
  1. SHG membership (max 20):
     - Active member: +20
     - Former member: +10
  
  2. Peer vouches (max 15):
     - Each existing GramCredit borrower who vouches: +5
     - Max 3 vouches counted
  
  3. Group repayment rate (max 10):
     - If SHG group overall repayment > 90%: +10
     - 70–90%: +5
     - <70%: 0
  
  4. Village elder / panchayat endorsement (max 5):
     - If panchayat_endorsed flag on user: +5
  """
  
  # For demo: return mock trust data
  return {
    "trust_score": 35,
    "components": {
      "shg_membership": 20,
      "peer_vouches": 10,
      "group_repayment": 5,
      "panchayat_endorsement": 0
    },
    "vouchers": ["Lakshmi Devi", "Suresh Patil"],
    "shg_group_repayment_rate": "82%",
    "trust_tier": "Community Trusted",
    "explanation": "Your SHG membership and 2 peer vouches give you 35 trust points, boosting your loan eligibility."
  }
