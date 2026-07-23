import secrets
import string

length = 14
alphabet = string.ascii_letters + string.digits + "!@#$%"
password = ''.join(secrets.choice(alphabet) for _ in range(length))
print("Generated password:")
print(password)
