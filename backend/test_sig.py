import hmac
import hashlib
import time

secret = "3oKYOpuJTUAIU0aZO58Bpa1luc"
string_to_sign = "folder=projects&timestamp=1777447402"

# HMAC-SHA1
signature = hmac.new(
    secret.encode('utf-8'),
    string_to_sign.encode('utf-8'),
    hashlib.sha1
).hexdigest()

print(f"Manual Signature: {signature}")
