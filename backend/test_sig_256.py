import hashlib
import hmac

secret = "3oKYOpuJTUAIU0aZO58Bpa1luc"
string_to_sign = "folder=projects&timestamp=1777447402"

# SHA256(string + secret)
signature_256 = hashlib.sha256((string_to_sign + secret).encode('utf-8')).hexdigest()
print(f"SHA256: {signature_256}")

# HMAC-SHA256
signature_hmac_256 = hmac.new(secret.encode('utf-8'), string_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()
print(f"HMAC-SHA256: {signature_hmac_256}")
