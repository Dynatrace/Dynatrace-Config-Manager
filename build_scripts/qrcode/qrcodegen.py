import qrcode

url = "https://github.com/Dynatrace/Dynatrace-Config-Manager/releases/latest"
qrcodeName = "DT_Config_Manager_QR.png"

qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_L,
    box_size=10,
    border=4,
)

qr.add_data(url)
qr.make(fit=True)

img = qr.make_image(fill_color="black", back_color="white")

img.save(qrcodeName)

print(f"QR code generated successfully and saved as '{qrcodeName}'.")