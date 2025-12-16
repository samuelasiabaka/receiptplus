# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

📱 Simple Receipt Generator (WhatsApp-Friendly)
Overview

A mobile-first receipt generator designed for Nigerian petty traders, shop owners, online vendors, and freelancers.
The app allows users to generate professional receipts and share them instantly via WhatsApp.

🎯 Product Goals

Generate receipts in under 10 seconds

Work offline

Be extremely simple to use

Be WhatsApp-first

Avoid accounting complexity

🧩 Target Users

Petty traders

POS agents

Online sellers

Freelancers

Small shop owners

🛠️ Tech Stack
Frontend

React Native

Expo (managed)

TypeScript

React Navigation

Storage

SQLite (local only for Phase 1)

Utilities

Image generation via view capture

File system for saving receipts

Native share for WhatsApp

🚀 Development Phases
Phase 1 — MVP (Current)

Scope strictly limited to:

Receipt creation

Local business profile

Image-based receipt generation

WhatsApp sharing

Local receipt history

Offline-first

No backend. No login. No payments.

Phase 2 — Business Branding

Enhanced business profile

Logo & branding

Receipt customization

Watermark removal (paid)

Phase 3 — Accounts & Backend

ASP.NET Core Web API

User authentication

Cloud sync

Subscription management

Analytics

🖥️ App Screens (Phase 1)

Home / Receipt List

Create Receipt

Receipt Preview

Business Profile

🧱 Folder Structure
src/
 ├── components/
 ├── screens/
 ├── navigation/
 ├── storage/
 ├── models/
 ├── utils/

🔐 Data Handling

All data stored locally in SQLite

No cloud sync in Phase 1

Privacy-first approach

💰 Monetization Strategy

Freemium model

Free basic receipts with watermark

Paid tier for branding & advanced features

📌 Development Principles

Simplicity over features

Speed over perfection

Validate with real users early

Add backend only when necessary

📍 Status

Phase 1 — In Development

3. What This Gives You

With this:

Cursor behaves like a senior engineer

You avoid feature creep

You have clear documentation

You can onboard contributors later

You align perfectly with a future ASP.NET backend


