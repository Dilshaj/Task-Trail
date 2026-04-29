import hashlib

secret = "3oKYOpuJTUAIU0aZO58Bpa1luc"
string_to_sign = "folder=projects&timestamp=1777447402"

# Standard SHA1(string + secret)
signature = hashlib.sha1((string_to_sign + secret).encode('utf-8')).hexdigest()
print(f"Standard SHA1 Signature: {signature}")
