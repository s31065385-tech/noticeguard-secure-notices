# NoticeGuard Secure Notices

Build a professional cybersecurity web application called NoticeGuard.

The application must demonstrate two separate features:

QR Code Based Notice Access

Cryptographic Digital Signature Verification

Create these pages:

ADMIN DASHBOARD:

Admin login.

Register official notices.

Upload PDF and image files.

Enter notice title, department and date.

Display registered notices.

Generate QR codes for registered notices.

NOTICE VERIFICATION:

QR scanning interface.

Display the original registered notice.

Show notice metadata.

Provide a separate Verify Digital Signature button.

Display verification results.

SECURITY RESULTS:

Original document: Signature Valid.

Modified document: Signature Invalid.

Display SHA-256 hash comparison.

Display clear success and failure messages.

DESIGN:

Premium cybersecurity theme.

Dark navy background with blue and purple accents.

Professional dashboard.

Smooth animations.

Responsive mobile design.

IMPORTANT:
QR code access and digital signature verification must be implemented as two independent features.

Do not treat successful QR scanning as proof of document authenticity.

Keep the React frontend ready for FastAPI backend integration.
Do not fake cryptographic verification in production. Clearly label simulated demo results until connected to real backend verification APIs.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bb61240b-edba-4615-83b3-56f2444611ba).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
