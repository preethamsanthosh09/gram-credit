import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from config import settings

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])

class ChatMessageRequest(BaseModel):
    message: str
    language: str

class ChatMessageResponse(BaseModel):
    reply: str

# Offline localized rule-based fallbacks for rural context
OFFLINE_RESPONSES = {
    "en": {
        "interest": "GramCredit crop loan interest rates range from 8% to 15% per annum based on your cooperative credit score. A score above 75 gets a premium rate of 8.5% p.a.!",
        "repay": "You can easily repay your EMIs using UPI, Net Banking, or cash at your local cooperative society branch. We offer harvest-aligned schedules where you pay zero during sowing!",
        "schemes": "Government schemes like PM-Kisan Credit Card (KCC) and PMFBY Crop Insurance are fully supported. GramCredit helps you verify Bhoomi land registry details to unlock these automatically.",
        "default": "Hello! I am Saathi, your GramCredit financial assistant. You can ask me about crop loans, interest rates, repayment schedules, or government schemes. How can I help you today?"
    },
    "hi": {
        "interest": "ग्रामक्रेडिट फसल ऋण की ब्याज दरें आपके सहकारी क्रेडिट स्कोर के आधार पर 8% से 15% प्रति वर्ष तक होती हैं। 75 से ऊपर के स्कोर पर 8.5% प्रति वर्ष की प्रीमियम दर मिलती है!",
        "repay": "आप आसानी से यूपीआई, नेट बैंकिंग या अपने स्थानीय सहकारी समिति शाखा में नकद के माध्यम से अपनी ईएमआई चुका सकते हैं। हम फसल-संरेखित कार्यक्रम प्रदान करते हैं जहां आप बुवाई के दौरान शून्य भुगतान करते हैं!",
        "schemes": "पीएम-किसान क्रेडिट कार्ड (केसीसी) और पीएमएफबीवाई फसल बीमा जैसी सरकारी योजनाओं का पूरा समर्थन किया जाता है। ग्रामक्रेडिट आपको इन्हें स्वचालित रूप से अनलॉक करने के लिए भूमि रिकॉर्ड विवरण सत्यापित करने में मदद करता है।",
        "default": "नमस्ते! मैं साथी हूँ, आपका ग्रामक्रेडिट वित्तीय सहायक। आप मुझसे फसल ऋण, ब्याज दरों, पुनर्भुगतान कार्यक्रम या सरकारी योजनाओं के बारे में पूछ सकते हैं। आज मैं आपकी क्या सहायता कर सकता हूँ?"
    },
    "kn": {
        "interest": "ನಿಮ್ಮ ಸಹಕಾರಿ ಕ್ರೆಡಿಟ್ ಸ್ಕೋರ್ ಆಧರಿಸಿ ಗ್ರಾಮ್ ಕ್ರೆಡಿಟ್ ಬೆಳೆ ಸಾಲದ ಬಡ್ಡಿ ದರಗಳು ವರ್ಷಕ್ಕೆ 8% ರಿಂದ 15% ವರೆಗೆ ಇರುತ್ತದೆ. 75 ಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ಸ್ಕೋರ್ ಪಡೆದರೆ 8.5% ರಿಯಾಯಿತಿ ಬಡ್ಡಿ ದರ ಸಿಗುತ್ತದೆ!",
        "repay": "ಯುಪಿಐ, ನೆಟ್ ಬ್ಯಾಂಕಿಂಗ್ ಅಥವಾ ನಿಮ್ಮ ಸ್ಥಳೀಯ ಸಹಕಾರಿ ಸಂಘದ ಶಾಖೆಯಲ್ಲಿ ನಗದು ಬಳಸಿ ನೀವು ಸುಲಭವಾಗಿ ನಿಮ್ಮ ಇಎಂಐಗಳನ್ನು ಮರುಪಾವತಿಸಬಹುದು. ನಾವು ಸುಗ್ಗಿ ಆಧಾರಿತ ಮರುಪಾವತಿ ಆಯ್ಕೆಗಳನ್ನು ನೀಡುತ್ತೇವೆ!",
        "schemes": "ಪಿಎಂ-ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ (ಕೆಸಿಸಿ) ಮತ್ತು ಪಿಎಂಎಫ್‌ಬಿವೈ ಬೆಳೆ ವಿಮೆಯಂತಹ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ಬೆಂಬಲಿಸಲಾಗುತ್ತದೆ. ಅವುಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಅನ್ಲಾಕ್ ಮಾಡಲು ಭೂಮಿ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಗ್ರಾಮ್ ಕ್ರೆಡಿಟ್ ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
        "default": "ನಮಸ್ಕಾರ! ನಾನು ಸಾಥಿ, ನಿಮ್ಮ ಗ್ರಾಮ್ ಕ್ರೆಡಿಟ್ ಡಿಜಿಟಲ್ ಸಹಾಯಕ. ಬೆಳೆ ಸಾಲಗಳು, ಬಡ್ಡಿ ದರಗಳು, ಮರುಪಾವತಿ ಮತ್ತು ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದು. ಇಂದು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?"
    },
    "ta": {
        "interest": "கிராம்கிரெடிட் பயிர் கடன் வட்டி விகிதங்கள் உங்கள் கூட்டுறவு கடன் மதிப்பெண்ணின் அடிப்படையில் ஆண்டுக்கு 8% முதல் 15% வரை இருக்கும். 75-க்கு மேல் மதிப்பெண் பெற்றால் 8.5% பிரீமியம் வட்டி விகிதம் கிடைக்கும்!",
        "repay": "UPI, நெட் பேங்கிங் அல்லது உங்கள் உள்ளூர் கூட்டுறவு சங்க கிளையில் பணம் செலுத்துவதன் மூலம் உங்கள் EMI-களை எளிதாக செலுத்தலாம். அறுவடைக்கு பிந்தைய தவணை முறைகளையும் நாங்கள் வழங்குகிறோம்!",
        "schemes": "PM-Kisan கிரெடிட் கார்டு (KCC) and PMFBY பயிர் காப்பீடு போன்ற அரசு திட்டங்கள் முழுமையாக ஆதரிக்கப்படுகின்றன. இவற்றை தானாகவே பெற பூமி நிலப்பதிவு விவரங்களை சரிபார்க்க கிராம்கிரெடிட் உதவுகிறது.",
        "default": "வணக்கம்! நான் சாரதி, உங்கள் கிராம்கிரெடிட் நிதியுதவி உதவியாளர். பயிர் கடன்கள், வட்டி விகிதங்கள், திருப்பிச் செலுத்தும் முறைகள் அல்லது அரசு திட்டங்கள் பற்றி நீங்கள் என்னிடம் கேட்கலாம். இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?"
    },
    "te": {
        "interest": "గ్రామ్‌క్రెడిట్ పంట రుణ వడ్డీ రేట్లు మీ సహకార క్రెడిట్ స్కోరు ఆధారంగా సంవత్సరానికి 8% నుండి 15% వరకు ఉంటాయి. 75 కంటే ఎక్కువ స్కోరుకు 8.5% ప్రీమియం వడ్డీ రేటు లభిస్తుంది!",
        "repay": "మీరు UPI, నెట్ బ్యాంకింగ్ లేదా మీ స్థానిక సహకార సంఘం బ్రాంచ్‌లో నగదు ద్వారా మీ EMIలను సులభంగా చెల్లించవచ్చు. మేము పంట కోత సమయానికి అనుగుణంగా చెల్లింపు పద్ధతులను అందిస్తున్నాము!",
        "schemes": "PM-Kisan క్రెడిట్ కార్డ్ (KCC) మరియు PMFBY పంట బీమా వంటి ప్రభుత్వ పథకాలకు పూర్తి మద్దతు ఉంది. వీటిని స్వయంచాలకంగా అన్‌లాక్ చేయడానికి భూమి రికార్డుల వివరాలను ధృవీకరించడంలో గ్రామ్‌క్రెడిట్ సహాయపడుతుంది.",
        "default": "నమస్కారం! నేను సారథి, మీ గ్రామ్‌క్రెడిట్ ఆర్థిక సహాయకుడు. పంట రుణాలు, వడ్డీ రేట్లు, చెల్లింపు విధానాలు లేదా ప్రభుత్వ పథకాల గురించి మీరు నన్ను అడగవచ్చు. ఈ రోజు మీకు ఏ విధంగా సహాయం చేయగలను?"
    }
}

def get_offline_response(message: str, lang: str) -> str:
    text = message.lower()
    lang_key = lang if lang in OFFLINE_RESPONSES else "en"
    responses = OFFLINE_RESPONSES[lang_key]
    
    if any(keyword in text for keyword in ["interest", "rate", "ಬಡ್ಡಿ", "ब्याज", "வட்டி", "వడ్డీ"]):
        return responses["interest"]
    elif any(keyword in text for keyword in ["repay", "payment", "ಮರುಪಾವತಿ", "भुगतान", "தவணை", "చెల్లింపు"]):
        return responses["repay"]
    elif any(keyword in text for keyword in ["scheme", "government", "ಯೋಜನೆ", "योजना", "திட்டம்", "పథకం"]):
        return responses["schemes"]
    return responses["default"]

@router.post("/message", response_model=ChatMessageResponse)
async def get_chatbot_message(request: ChatMessageRequest):
    if settings.GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            prompt = (
                f"You are Saathi (meaning friend), a friendly digital financial assistant for farmers using the GramCredit app. "
                f"Provide helpful, warm, professional advice on crop credit, interest rates (8% to 15%), cooperative lending, "
                f"repayment modes (monthly, harvest-aligned, yearly), and agricultural schemes in {request.language} language. "
                f"Keep your reply under 3 short sentences, extremely simple for rural farmers to understand. "
                f"Here is the user's message: '{request.message}'"
            )
            payload = {
                "contents": [{"parts": [{"text": prompt}]}]
            }
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=10.0)
                if response.status_code == 200:
                    resp_json = response.json()
                    text_content = resp_json["candidates"][0]["content"]["parts"][0]["text"].strip()
                    return {"reply": text_content}
        except Exception as e:
            print(f"[Chatbot] Gemini call failed: {e}. Falling back to offline responses.")
            
    reply = get_offline_response(request.message, request.language)
    return {"reply": reply}
