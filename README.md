This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Install the project

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### NOTE: To use the "Search Lyrics" function, you need to run the server file locally. Please refer to the "Use Server" section.

## Run Locally

In the test folder, you can find audio files (.mp3) with their lyrics (.lrc). *Load in the audio first (Do not load in the lyrics first!)*, then the lyrics using the Upload buttons. Wait for the lyrics to pop in until you see the Importance curve tab below appear; then, you can start playing with the lyrics!

Features:
- You can seek a specific time in the video using the slider at the bottom left.
- By selecting a line in the lyrics column to the top left, you can quickly seek that line in the video. You can also quickly seek by selecting a line in the Importance Curve tab.
- By default, the importance curve does nothing. You need to apply specific "instruments" (aka styles) to lines in the Lyrical Instrument tab, where you can not only designate meanings to importance but also specify animations.
