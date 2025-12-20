import requests

url = "https://servicesenligne2.ville.montreal.qc.ca/api/infoneige/InfoneigeWebService"

xml = """<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:ser="https://servicesenlignedev.ville.montreal.qc.ca">
  <soapenv:Header/>
  <soapenv:Body>
    <ser:GetPlanificationsForDate>
        <getPlanificationsForDate>
            <fromDate>2025-11-25T07:00:00</fromDate>
            <tokenString>xa21-2cefbddf-1eef-4c6e-9d4a-076d6475c43e-918d6ee3-42e8-43da-8fb3-55bd79329549-a3a44448-5f7a-4f85-9515-04c901b4748d-c6f5c206-ceda-4ea1-95e0-716d080c564a-05212ac3-1ada-49e4-bff3-b8fbba75b132</tokenString>
        </getPlanificationsForDate>
    </ser:GetPlanificationsForDate>
  </soapenv:Body>
</soapenv:Envelope>
"""

headers = {
    "User-Agent": "planif-neige-client https://github.com/poboisvert"
}

resp = requests.post(url, data=xml, headers=headers, timeout=30)

print("Status:", resp.status_code)
print(resp.text)
